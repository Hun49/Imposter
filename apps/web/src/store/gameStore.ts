import { create } from 'zustand';
import {
  type GamePhase,
  type PlayerPublic,
  type AllCardsRevealedPayload,
  type ServerMessage,
  type ClientMessage,
  DEFAULT_TIMER_MINUTES,
} from '@imposter/shared';
import { getSession, signIn, signUp, signOut } from '../lib/auth-client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username?: string;
}

export interface GameState {
  // Auth state
  user: AuthUser | null;
  isAuthLoading: boolean;

  // Modals state
  isAuthModalOpen: boolean;
  isJoinModalOpen: boolean;

  // Room & game state
  roomCode: string | null;
  hostId: string | null;
  phase: GamePhase;
  players: PlayerPublic[];
  timerMinutes: number;
  remainingSeconds: number;
  isMyCardFlipped: boolean;
  myRole: { isImposter: boolean; secretWord: string | null } | null;
  revealedData: AllCardsRevealedPayload | null;
  roomClosedReason: string | null;
  error: string | null;
  isConnected: boolean;
  ws: WebSocket | null;

  // Auth actions
  checkAuth: () => Promise<void>;
  signInUser: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpUser: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOutUser: () => Promise<void>;

  // Modal actions
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openJoinModal: () => void;
  closeJoinModal: () => void;

  // Room & game actions
  createRoom: () => Promise<{ success: boolean; error?: string }>;
  joinRoom: (code: string) => Promise<{ success: boolean; error?: string }>;
  connect: (code: string, userId: string, username: string) => void;
  leaveRoom: () => void;
  toggleReady: () => void;
  setTimerMinutes: (minutes: number) => void;
  startRound: () => void;
  revealAllCards: () => void;
  startNextRound: () => void;
  toggleMyCard: () => void;
  clearRoomClosed: () => void;
  clearError: () => void;
}

const STORAGE_ROOM_KEY = 'imposter_active_room';

export const useGameStore = create<GameState>((set, get) => {
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  const startLocalCountdown = () => {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const state = get();
      if (state.phase === 'ACTIVE' && state.remainingSeconds > 0) {
        set({ remainingSeconds: state.remainingSeconds - 1 });
      }
    }, 1000);
  };

  const stopLocalCountdown = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  const sendMessage = (msg: ClientMessage) => {
    const ws = get().ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  };

  return {
    user: null,
    isAuthLoading: true,
    isAuthModalOpen: false,
    isJoinModalOpen: false,

    roomCode: null,
    hostId: null,
    phase: 'LOBBY',
    players: [],
    timerMinutes: DEFAULT_TIMER_MINUTES,
    remainingSeconds: DEFAULT_TIMER_MINUTES * 60,
    isMyCardFlipped: false,
    myRole: null,
    revealedData: null,
    roomClosedReason: null,
    error: null,
    isConnected: false,
    ws: null,

    // ==========================================
    // Auth Actions
    // ==========================================
    checkAuth: async () => {
      try {
        const { data } = await getSession();
        if (data?.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            username: (data.user as unknown as { username?: string }).username || data.user.name,
          };
          set({ user: authUser, isAuthLoading: false });

          // Auto-reconnect if user refreshed while in an active room
          const savedRoom = sessionStorage.getItem(STORAGE_ROOM_KEY);
          if (savedRoom && !get().roomCode) {
            get().connect(savedRoom, authUser.id, authUser.username || authUser.name);
          }
        } else {
          set({ user: null, isAuthLoading: false });
        }
      } catch {
        set({ user: null, isAuthLoading: false });
      }
    },

    signInUser: async (identifier: string, password: string) => {
      const clean = identifier.trim();
      const isEmail = clean.includes('@');
      try {
        const { error } = isEmail
          ? await signIn.email({ email: clean.toLowerCase(), password })
          : await signIn.username({ username: clean.toLowerCase(), password });

        if (error) {
          return { success: false, error: error.message || 'Invalid credentials' };
        }

        await get().checkAuth();
        set({ isAuthModalOpen: false, error: null });
        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Sign in failed';
        return { success: false, error: msg };
      }
    },

    signUpUser: async (username: string, email: string, password: string) => {
      try {
        const { error } = await signUp.email({
          email: email.trim().toLowerCase(),
          password,
          name: username.trim(),
          username: username.trim().toLowerCase(),
        });

        if (error) {
          return { success: false, error: error.message || 'Registration failed' };
        }

        await get().checkAuth();
        set({ isAuthModalOpen: false, error: null });
        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Sign up failed';
        return { success: false, error: msg };
      }
    },

    signOutUser: async () => {
      try {
        await signOut();
      } finally {
        get().leaveRoom();
        set({ user: null });
      }
    },

    // ==========================================
    // Modal Actions
    // ==========================================
    openAuthModal: () => set({ isAuthModalOpen: true }),
    closeAuthModal: () => set({ isAuthModalOpen: false }),
    openJoinModal: () => set({ isJoinModalOpen: true }),
    closeJoinModal: () => set({ isJoinModalOpen: false }),

    // ==========================================
    // Room & Game Actions
    // ==========================================
    createRoom: async () => {
      set({ error: null });
      const user = get().user;
      if (!user) {
        set({ isAuthModalOpen: true });
        return { success: false, error: 'Please sign in first' };
      }

      const username = user.username || user.name || 'Player';

      try {
        const res = await fetch('/api/rooms/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, username }),
        });

        const data = (await res.json()) as { roomCode?: string; error?: string };
        if (!res.ok || !data.roomCode) {
          const err = data.error || 'Failed to create room';
          set({ error: err });
          return { success: false, error: err };
        }

        sessionStorage.setItem(STORAGE_ROOM_KEY, data.roomCode);
        get().connect(data.roomCode, user.id, username);
        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error creating room';
        set({ error: msg });
        return { success: false, error: msg };
      }
    },

    joinRoom: async (code: string) => {
      set({ error: null });
      const user = get().user;
      if (!user) {
        set({ isAuthModalOpen: true });
        return { success: false, error: 'Please sign in first' };
      }

      const clean = code.trim().toUpperCase();
      const username = user.username || user.name || 'Player';

      try {
        const res = await fetch('/api/rooms/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode: clean }),
        });

        const data = (await res.json()) as { roomCode?: string; error?: string };
        if (!res.ok || !data.roomCode) {
          const err = data.error || 'Failed to join room';
          set({ error: err });
          return { success: false, error: err };
        }

        sessionStorage.setItem(STORAGE_ROOM_KEY, data.roomCode);
        set({ isJoinModalOpen: false });
        get().connect(data.roomCode, user.id, username);
        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error joining room';
        set({ error: msg });
        return { success: false, error: msg };
      }
    },

    connect: (code: string, userId: string, username: string) => {
      const existingWs = get().ws;
      if (existingWs) {
        existingWs.close();
      }

      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const wsUrl = isLocal
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/rooms/${code}/ws?userId=${encodeURIComponent(userId)}&username=${encodeURIComponent(username)}`
        : `wss://imposter-api.hun-wrk0966.workers.dev/api/rooms/${code}/ws?userId=${encodeURIComponent(userId)}&username=${encodeURIComponent(username)}`;

      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        set({ isConnected: true, ws: socket, roomCode: code, error: null });
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as ServerMessage;

          switch (msg.type) {
            case 'ROOM_STATE': {
              const prevPhase = get().phase;
              set({
                roomCode: msg.data.roomCode,
                hostId: msg.data.hostId,
                phase: msg.data.phase,
                timerMinutes: msg.data.timerMinutes,
                remainingSeconds: msg.data.remainingSeconds,
                players: msg.data.players,
              });

              if (msg.data.phase === 'ACTIVE') {
                startLocalCountdown();
              } else {
                stopLocalCountdown();
              }

              if (msg.data.phase === 'LOBBY' && prevPhase !== 'LOBBY') {
                set({ myRole: null, revealedData: null, isMyCardFlipped: false });
              }
              break;
            }

            case 'YOUR_CARD': {
              set({ myRole: msg.data, isMyCardFlipped: false });
              break;
            }

            case 'ALL_CARDS_REVEALED': {
              set({ revealedData: msg.data });
              break;
            }

            case 'ROOM_CLOSED': {
              stopLocalCountdown();
              sessionStorage.removeItem(STORAGE_ROOM_KEY);
              set({
                roomClosedReason: msg.reason || 'The room has been closed.',
                isConnected: false,
                phase: 'CLOSED',
              });
              break;
            }

            case 'ERROR': {
              set({ error: msg.message });
              break;
            }
          }
        } catch {
          // ignore parsing error
        }
      };

      socket.onclose = () => {
        stopLocalCountdown();
        set({ isConnected: false });
      };

      socket.onerror = () => {
        set({ error: 'Connection error' });
      };
    },

    leaveRoom: () => {
      stopLocalCountdown();
      sessionStorage.removeItem(STORAGE_ROOM_KEY);
      const ws = get().ws;
      if (ws) {
        ws.close();
      }
      set({
        roomCode: null,
        hostId: null,
        phase: 'LOBBY',
        players: [],
        timerMinutes: DEFAULT_TIMER_MINUTES,
        remainingSeconds: DEFAULT_TIMER_MINUTES * 60,
        isMyCardFlipped: false,
        myRole: null,
        revealedData: null,
        roomClosedReason: null,
        error: null,
        isConnected: false,
        ws: null,
      });
    },

    toggleReady: () => {
      const state = get();
      const currentUserId = state.user?.id;
      // Precisely identify current user by authenticated user id
      const me = state.players.find((p) => p.id === currentUserId) || state.players[0];
      const nextReady = !me?.isReady;
      sendMessage({ type: 'SET_READY', isReady: nextReady });
    },

    setTimerMinutes: (minutes: number) => {
      sendMessage({ type: 'SET_TIMER', minutes });
    },

    startRound: () => {
      sendMessage({ type: 'START_ROUND' });
    },

    revealAllCards: () => {
      sendMessage({ type: 'REVEAL_CARDS' });
    },

    startNextRound: () => {
      sendMessage({ type: 'NEXT_ROUND' });
    },

    toggleMyCard: () => {
      set((s) => ({ isMyCardFlipped: !s.isMyCardFlipped }));
    },

    clearRoomClosed: () => {
      get().leaveRoom();
    },

    clearError: () => {
      set({ error: null });
    },
  };
});
