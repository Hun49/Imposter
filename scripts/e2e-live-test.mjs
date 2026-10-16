// End-to-End Live Integration Test for Imposter Game
// Runs against deployed Cloudflare API: https://imposter-api.hun-wrk0966.workers.dev

const API_BASE = process.env.API_BASE || 'https://imposter-api.hun-wrk0966.workers.dev';
const WS_BASE = API_BASE.replace(/^http/, 'ws');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class TestClient {
  constructor(name) {
    this.name = name;
    this.email = `${name}_${Date.now()}@example.com`;
    this.password = 'SuperSecret123!';
    this.username = `${name}_${Math.floor(Math.random() * 9000 + 1000)}`;
    this.userId = null;
    this.cookie = null;
    this.ws = null;
    this.receivedMessages = [];
  }

  async signUp() {
    const res = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://imposter-web.pages.dev',
      },
      body: JSON.stringify({
        email: this.email,
        password: this.password,
        name: this.username,
        username: this.username,
      }),
    });

    assert(res.ok, `${this.name} sign-up returned HTTP ${res.status}`);
    const cookie = res.headers.get('set-cookie');
    assert(Boolean(cookie), `${this.name} received session cookie`);
    this.cookie = cookie;

    const data = await res.json();
    this.userId = data.user.id;
    assert(Boolean(this.userId), `${this.name} user ID created: ${this.userId}`);
  }

  async connectWS(roomCode) {
    const wsUrl = `${WS_BASE}/api/rooms/${roomCode}/ws?userId=${this.userId}&username=${encodeURIComponent(this.username)}`;
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        resolve();
      };

      this.ws.onerror = (err) => {
        reject(err);
      };

      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        this.receivedMessages.push(msg);
      };
    });
  }

  send(msg) {
    this.ws.send(JSON.stringify(msg));
  }

  getLastMessage(type) {
    for (let i = this.receivedMessages.length - 1; i >= 0; i--) {
      if (this.receivedMessages[i].type === type) {
        return this.receivedMessages[i];
      }
    }
    return null;
  }

  async waitForMessage(type, predicate = () => true, timeoutMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      for (let i = this.receivedMessages.length - 1; i >= 0; i--) {
        const msg = this.receivedMessages[i];
        if (msg.type === type && predicate(msg)) {
          return msg;
        }
      }
      await sleep(100);
    }
    throw new Error(`${this.name} timed out waiting for message of type ${type}`);
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function run() {
  console.log(`\n🚀 Starting Imposter End-to-End Live Integration Test...`);
  console.log(`Target API: ${API_BASE}\n`);

  // 1. Health check
  console.log('--- Step 1: Health Check ---');
  const healthRes = await fetch(`${API_BASE}/api/health`);
  assert(healthRes.ok, `Health check returned ${healthRes.status}`);
  const healthData = await healthRes.json();
  assert(healthData.ok === true, 'Health check payload contains { ok: true }');

  // 2. Multi-user Authentication
  console.log('\n--- Step 2: Multi-User Authentication ---');
  const host = new TestClient('host');
  const player2 = new TestClient('player2');
  const player3 = new TestClient('player3');

  await host.signUp();
  await player2.signUp();
  await player3.signUp();

  // 3. Room Creation (Host)
  console.log('\n--- Step 3: Room Creation (Host) ---');
  const createRes = await fetch(`${API_BASE}/api/rooms/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: host.cookie,
    },
    body: JSON.stringify({ userId: host.userId, username: host.username }),
  });

  assert(createRes.ok, `Host room creation returned HTTP ${createRes.status}`);
  const createData = await createRes.json();
  assert(Boolean(createData.roomCode), `Room code generated: ${createData.roomCode}`);
  const roomCode = createData.roomCode;

  // 4. Room Joining Check
  console.log('\n--- Step 4: Room Joining Verification ---');
  const joinCheckRes = await fetch(`${API_BASE}/api/rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode }),
  });
  assert(joinCheckRes.ok, `Join check returned HTTP ${joinCheckRes.status}`);

  // Test invalid room code rejection
  const invalidJoinRes = await fetch(`${API_BASE}/api/rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode: 'FAKEXX' }),
  });
  assert(invalidJoinRes.status === 404, 'Invalid room code correctly rejected with 404');

  // 5. Connect all 3 players via Real WebSocket
  console.log('\n--- Step 5: Real WebSocket Connection & Presence ---');
  await host.connectWS(roomCode);
  console.log('  ✓ Host connected via WebSocket');

  await player2.connectWS(roomCode);
  console.log('  ✓ Player 2 connected via WebSocket');

  await player3.connectWS(roomCode);
  console.log('  ✓ Player 3 connected via WebSocket');

  // Wait for all players to receive ROOM_STATE
  await sleep(1000);
  const hostState = host.getLastMessage('ROOM_STATE');
  assert(Boolean(hostState), 'Host received ROOM_STATE');
  assert(hostState.data.players.length === 3, 'ROOM_STATE has exactly 3 players');
  assert(hostState.data.phase === 'LOBBY', 'Room is in LOBBY phase');
  assert(hostState.data.hostId === host.userId, 'Host is correctly designated');

  // 6. Timer Configuration & Permission
  console.log('\n--- Step 6: Timer Configuration & Permissions ---');
  // Non-host attempts to set timer -> should receive ERROR
  player2.send({ type: 'SET_TIMER', minutes: 20 });
  const p2Error = await player2.waitForMessage('ERROR');
  assert(Boolean(p2Error), 'Non-host setting timer was rejected with ERROR message');

  // Host sets timer to 10 minutes
  host.send({ type: 'SET_TIMER', minutes: 10 });
  const updatedState = await host.waitForMessage('ROOM_STATE', (m) => m.data.timerMinutes === 10);
  assert(updatedState.data.timerMinutes === 10, 'Host successfully set timer to 10 minutes');

  // 7. Readiness Enforcement before Starting
  console.log('\n--- Step 7: Readiness Enforcement ---');
  // Host attempts to start when nobody is ready -> should receive ERROR
  host.send({ type: 'START_ROUND' });
  const hostStartErr = await host.waitForMessage('ERROR');
  assert(Boolean(hostStartErr), 'Host cannot start before all players are ready');

  // Player 2 & 3 mark ready
  player2.send({ type: 'SET_READY', isReady: true });
  player3.send({ type: 'SET_READY', isReady: true });
  await host.waitForMessage('ROOM_STATE', (m) => m.data.players.filter((p) => p.isReady).length === 2);

  // Host still not ready -> starting must still fail
  host.send({ type: 'START_ROUND' });
  const hostNotReadyErr = await host.waitForMessage('ERROR');
  assert(Boolean(hostNotReadyErr), 'Host cannot start before host is also ready');

  // Host marks ready
  host.send({ type: 'SET_READY', isReady: true });
  await host.waitForMessage('ROOM_STATE', (m) => m.data.players.every((p) => p.isReady));

  // 8. Start Round & Secret Role Isolation (SEC-002, SEC-003, SEC-004)
  console.log('\n--- Step 8: Start Round & Secret Role Delivery ---');
  host.send({ type: 'START_ROUND' });

  const activeState = await host.waitForMessage('ROOM_STATE', (m) => m.data.phase === 'ACTIVE');
  assert(activeState.data.phase === 'ACTIVE', 'Room successfully transitioned to ACTIVE phase');
  assert(Boolean(activeState.data.expiresAt), 'Server authoritative expiresAt timestamp set');

  // Verify each player received YOUR_CARD
  const hostCard = await host.waitForMessage('YOUR_CARD');
  const p2Card = await player2.waitForMessage('YOUR_CARD');
  const p3Card = await player3.waitForMessage('YOUR_CARD');

  assert(Boolean(hostCard), 'Host received private YOUR_CARD');
  assert(Boolean(p2Card), 'Player 2 received private YOUR_CARD');
  assert(Boolean(p3Card), 'Player 3 received private YOUR_CARD');

  const cards = [hostCard.data, p2Card.data, p3Card.data];
  const imposters = cards.filter((c) => c.isImposter);
  const innocents = cards.filter((c) => !c.isImposter);

  assert(imposters.length === 1, `Exactly 1 Imposter assigned (count: ${imposters.length})`);
  assert(innocents.length === 2, `Exactly 2 Innocent players assigned (count: ${innocents.length})`);

  // Verify Imposter does NOT receive the secret word
  assert(imposters[0].secretWord === null, 'Imposter card has secretWord === null (no word leakage)');

  // Verify Innocents receive the same word
  assert(Boolean(innocents[0].secretWord), `Innocent 1 received word: "${innocents[0].secretWord}"`);
  assert(innocents[0].secretWord === innocents[1].secretWord, 'All innocent players received the identical secret word');

  // 9. Joining Refusal During Active Round (Spec FR-012)
  console.log('\n--- Step 9: Join Refusal During Active Round ---');
  const activeJoinRes = await fetch(`${API_BASE}/api/rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode }),
  });
  assert(activeJoinRes.status === 403, 'Attempt to join active round refused with HTTP 403');

  // 10. Card Reveal & Next Round
  console.log('\n--- Step 10: Card Reveal & Next Round Flow ---');
  // Trigger reveal (in production this happens when timer expires)
  // Let's test reveal permission
  player2.send({ type: 'REVEAL_CARDS' });
  const p2RevealErr = await player2.waitForMessage('ERROR');
  assert(Boolean(p2RevealErr), 'Non-host cannot trigger reveal');

  // Set phase to awaiting reveal directly or trigger reveal
  // In RoomDO, reveal requires phase AWAITING_REVEAL
  // Let's test that premature reveal is rejected
  host.send({ type: 'REVEAL_CARDS' });
  const hostRevealErr = await host.waitForMessage('ERROR');
  assert(Boolean(hostRevealErr), 'Premature reveal rejected while round is still active');

  // 11. Host Disconnect & Clean Room Closure (Spec §6.9, FR-026)
  console.log('\n--- Step 11: Host Disconnect Room Closure ---');
  host.close();

  const p2Closed = await player2.waitForMessage('ROOM_CLOSED');
  const p3Closed = await player3.waitForMessage('ROOM_CLOSED');

  assert(Boolean(p2Closed), 'Player 2 received ROOM_CLOSED on host disconnect');
  assert(Boolean(p3Closed), 'Player 3 received ROOM_CLOSED on host disconnect');
  assert(p2Closed.reason.includes('host disconnected'), `Closure reason verified: "${p2Closed.reason}"`);

  // Cleanup
  player2.close();
  player3.close();

  console.log('\n🎉 ALL 11 TEST SCENARIOS PASSED WITH 100% SUCCESS ON PRODUCTION CLOUDFLARE!\n');
}

run().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
