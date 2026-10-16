import { DurableObject } from 'cloudflare:workers';
import {
  type GamePhase,
  type PlayerPublic,
  type RevealedRole,
  type ClientMessage,
  type ServerMessage,
  MIN_PLAYERS_TO_START,
  MIN_TIMER_MINUTES,
  MAX_TIMER_MINUTES,
  DEFAULT_TIMER_MINUTES,
  CURATED_WORD_POOL,
} from '@imposter/shared';

interface ParticipantSession {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  ws: WebSocket;
}

export class RoomDO extends DurableObject<Env> {
  private roomCode: string = '';
  private hostId: string = '';
  private phase: GamePhase = 'LOBBY';
  private timerMinutes: number = DEFAULT_TIMER_MINUTES;
  private roundExpiresAt: number | null = null;
  private secretWord: string | null = null;
  private imposterId: string | null = null;
  private participants: Map<string, ParticipantSession> = new Map();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      const stored = await this.ctx.storage.get<{
        roomCode: string;
        hostId: string;
        phase: GamePhase;
        timerMinutes: number;
        roundExpiresAt: number | null;
        secretWord: string | null;
        imposterId: string | null;
      }>('room_state');

      if (stored) {
        this.roomCode = stored.roomCode;
        this.hostId = stored.hostId;
        this.phase = stored.phase;
        this.timerMinutes = stored.timerMinutes;
        this.roundExpiresAt = stored.roundExpiresAt;
        this.secretWord = stored.secretWord;
        this.imposterId = stored.imposterId;
      }
    });
  }

  private async persistState() {
    await this.ctx.storage.put('room_state', {
      roomCode: this.roomCode,
      hostId: this.hostId,
      phase: this.phase,
      timerMinutes: this.timerMinutes,
      roundExpiresAt: this.roundExpiresAt,
      secretWord: this.secretWord,
      imposterId: this.imposterId,
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // 1. Initialize room
    if (url.pathname === '/init' && request.method === 'POST') {
      const body = (await request.json()) as {
        roomCode: string;
        hostId: string;
      };
      this.roomCode = body.roomCode.toUpperCase();
      this.hostId = body.hostId;
      this.phase = 'LOBBY';
      this.timerMinutes = DEFAULT_TIMER_MINUTES;
      await this.persistState();
      return Response.json({ success: true, roomCode: this.roomCode });
    }

    // 2. Room Status check
    if (url.pathname === '/status') {
      const canJoin = this.phase === 'LOBBY' || this.phase === 'REVEALED';
      return Response.json({
        exists: Boolean(this.roomCode),
        roomCode: this.roomCode,
        phase: this.phase,
        playerCount: this.participants.size,
        canJoin,
      });
    }

    // 3. WebSocket upgrade
    if (url.pathname === '/ws') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket upgrade', { status: 426 });
      }

      const userId = url.searchParams.get('userId');
      const username = url.searchParams.get('username') || 'Player';

      if (!userId) {
        return new Response('Missing userId', { status: 400 });
      }

      // Check if room is active or closed before allowing join
      if (this.phase === 'CLOSED') {
        return new Response('Room is closed', { status: 410 });
      }

      const isExistingParticipant = this.participants.has(userId);
      const isJoinable = this.phase === 'LOBBY' || this.phase === 'REVEALED';

      if (!isExistingParticipant && !isJoinable) {
        return new Response('Room is in an active round. Join when the round ends.', {
          status: 403,
        });
      }

      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      server.accept();

      const isHost = userId === this.hostId;
      const session: ParticipantSession = {
        id: userId,
        name: username,
        isHost,
        isReady: false,
        ws: server,
      };

      this.participants.set(userId, session);

      server.addEventListener('message', (event) => {
        try {
          const raw = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data);
          const msg = JSON.parse(raw) as ClientMessage;
          this.handleClientMessage(userId, msg);
        } catch {
          this.sendToUser(userId, { type: 'ERROR', message: 'Invalid message payload' });
        }
      });

      const handleClose = () => {
        this.handleParticipantDisconnect(userId);
      };

      server.addEventListener('close', handleClose);
      server.addEventListener('error', handleClose);

      // Send initial room state to all
      this.broadcastRoomState();

      // If rejoining during active round, send private card to this user
      if (this.phase === 'ACTIVE' && this.secretWord) {
        const isImposter = userId === this.imposterId;
        this.sendToUser(userId, {
          type: 'YOUR_CARD',
          data: {
            isImposter,
            secretWord: isImposter ? null : this.secretWord,
          },
        });
      }

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('Not found', { status: 404 });
  }

  private handleClientMessage(userId: string, msg: ClientMessage) {
    const participant = this.participants.get(userId);
    if (!participant) return;

    switch (msg.type) {
      case 'PING': {
        this.sendToUser(userId, { type: 'PONG' });
        break;
      }

      case 'SET_READY': {
        if (this.phase !== 'LOBBY' && this.phase !== 'REVEALED') {
          this.sendToUser(userId, {
            type: 'ERROR',
            message: 'Ready state cannot be changed during an active round.',
          });
          return;
        }
        participant.isReady = Boolean(msg.isReady);
        this.broadcastRoomState();
        break;
      }

      case 'SET_TIMER': {
        if (!participant.isHost) {
          this.sendToUser(userId, {
            type: 'ERROR',
            message: 'Only the host can configure timer settings.',
          });
          return;
        }
        if (this.phase !== 'LOBBY' && this.phase !== 'REVEALED') {
          this.sendToUser(userId, {
            type: 'ERROR',
            message: 'Timer cannot be changed while a round is active.',
          });
          return;
        }
        const mins = Math.floor(msg.minutes);
        if (isNaN(mins) || mins < MIN_TIMER_MINUTES || mins > MAX_TIMER_MINUTES) {
          this.sendToUser(userId, {
            type: 'ERROR',
            message: `Timer duration must be between ${MIN_TIMER_MINUTES} and ${MAX_TIMER_MINUTES} minutes.`,
          });
          return;
        }
        this.timerMinutes = mins;
        this.persistState();
        this.broadcastRoomState();
        break;
      }

      case 'START_ROUND': {
        if (!participant.isHost) {
          this.sendToUser(userId, {
            type: 'ERROR',
            message: 'Only the host can start the round.',
          });
          return;
        }
        if (this.phase !== 'LOBBY' && this.phase !== 'REVEALED') {
          this.sendToUser(userId, {
            type: 'ERROR',
            message: 'Round already in progress.',
          });
          return;
        }
        if (this.participants.size < MIN_PLAYERS_TO_START) {
          this.sendToUser(userId, {
            type: 'ERROR',
            message: `At least ${MIN_PLAYERS_TO_START} players are required to start.`,
          });
          return;
        }
        const allReady = Array.from(this.participants.values()).every((p) => p.isReady);
        if (!allReady) {
          this.sendToUser(userId, {
            type: 'ERROR',
            message: 'All players must be Ready before starting.',
          });
          return;
        }

        // Start Round: Pick random word & random imposter
        const wordIndex = Math.floor(Math.random() * CURATED_WORD_POOL.length);
        this.secretWord = CURATED_WORD_POOL[wordIndex];

        const playerIds = Array.from(this.participants.keys());
        const imposterIndex = Math.floor(Math.random() * playerIds.length);
        this.imposterId = playerIds[imposterIndex];

        this.phase = 'ACTIVE';
        const now = Date.now();
        this.roundExpiresAt = now + this.timerMinutes * 60 * 1000;

        // Schedule authoritative server alarm
        this.ctx.storage.setAlarm(this.roundExpiresAt);
        this.persistState();

        // Broadcast general room state (WITHOUT secrets)
        this.broadcastRoomState();

        // Deliver individual secret cards privately
        for (const [id] of this.participants) {
          const isImposter = id === this.imposterId;
          this.sendToUser(id, {
            type: 'YOUR_CARD',
            data: {
              isImposter,
              secretWord: isImposter ? null : this.secretWord,
            },
          });
        }
        break;
      }

      case 'REVEAL_CARDS': {
        if (!participant.isHost) {
          this.sendToUser(userId, {
            type: 'ERROR',
            message: 'Only the host can reveal cards.',
          });
          return;
        }
        if (this.phase !== 'AWAITING_REVEAL') {
          this.sendToUser(userId, {
            type: 'ERROR',
            message: 'Cards can only be revealed after the timer expires.',
          });
          return;
        }

        this.phase = 'REVEALED';

        // Reset all readiness for the next round
        for (const p of this.participants.values()) {
          p.isReady = false;
        }

        const roles: RevealedRole[] = Array.from(this.participants.values()).map((p) => ({
          id: p.id,
          name: p.name,
          isImposter: p.id === this.imposterId,
        }));

        this.broadcast({
          type: 'ALL_CARDS_REVEALED',
          data: {
            secretWord: this.secretWord || '',
            imposterId: this.imposterId || '',
            roles,
          },
        });

        this.persistState();
        this.broadcastRoomState();
        break;
      }

      case 'NEXT_ROUND': {
        if (!participant.isHost) {
          this.sendToUser(userId, {
            type: 'ERROR',
            message: 'Only the host can prepare the next round.',
          });
          return;
        }
        if (this.phase !== 'REVEALED') {
          this.sendToUser(userId, {
            type: 'ERROR',
            message: 'Cannot prepare next round until cards are revealed.',
          });
          return;
        }

        this.phase = 'LOBBY';
        this.secretWord = null;
        this.imposterId = null;
        this.roundExpiresAt = null;

        for (const p of this.participants.values()) {
          p.isReady = false;
        }

        this.persistState();
        this.broadcastRoomState();
        break;
      }
    }
  }

  // Handle Authoritative Timer Expiration (Spec REL-002, FR-017)
  async alarm() {
    if (this.phase === 'ACTIVE') {
      this.phase = 'AWAITING_REVEAL';
      this.roundExpiresAt = null;
      await this.persistState();
      this.broadcastRoomState();
    }
  }

  // Handle Disconnection (Spec §6.9, FR-025, FR-026)
  private handleParticipantDisconnect(userId: string) {
    const participant = this.participants.get(userId);
    if (!participant) return;

    this.participants.delete(userId);

    // Host disconnect: Close the room for everyone
    if (userId === this.hostId) {
      this.phase = 'CLOSED';
      this.ctx.storage.deleteAlarm();
      this.persistState();

      this.broadcast({
        type: 'ROOM_CLOSED',
        reason: 'The host disconnected. This room has closed.',
      });

      // Close all remaining connections
      for (const p of this.participants.values()) {
        try {
          p.ws.close(1000, 'Host disconnected');
        } catch {}
      }
      this.participants.clear();
      return;
    }

    // Non-host disconnect: remove participant and broadcast state
    if (this.phase === 'LOBBY' || this.phase === 'REVEALED') {
      this.broadcastRoomState();
    }
  }

  private broadcastRoomState() {
    let remaining = this.timerMinutes * 60;
    if (this.phase === 'ACTIVE' && this.roundExpiresAt) {
      remaining = Math.max(0, Math.ceil((this.roundExpiresAt - Date.now()) / 1000));
    } else if (this.phase === 'AWAITING_REVEAL') {
      remaining = 0;
    }

    const players: PlayerPublic[] = Array.from(this.participants.values()).map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.id === this.hostId,
      isReady: p.isReady,
      isOnline: true,
    }));

    const payload: ServerMessage = {
      type: 'ROOM_STATE',
      data: {
        roomCode: this.roomCode,
        hostId: this.hostId,
        phase: this.phase,
        timerMinutes: this.timerMinutes,
        remainingSeconds: remaining,
        expiresAt: this.roundExpiresAt,
        players,
      },
    };

    this.broadcast(payload);
  }

  private sendToUser(userId: string, msg: ServerMessage) {
    const p = this.participants.get(userId);
    if (!p) return;
    try {
      p.ws.send(JSON.stringify(msg));
    } catch {}
  }

  private broadcast(msg: ServerMessage) {
    const raw = JSON.stringify(msg);
    for (const p of this.participants.values()) {
      try {
        p.ws.send(raw);
      } catch {}
    }
  }
}
