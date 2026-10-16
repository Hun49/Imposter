import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createAuth, type AuthEnv } from './auth';
import { RoomDO } from './durable-objects/RoomDO';

export { RoomDO };

type Bindings = AuthEnv & {
  ROOM_DO: DurableObjectNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      if (!origin) return 'http://localhost:5173';
      if (
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('pages.dev') ||
        origin.includes('workers.dev')
      ) {
        return origin;
      }
      return 'http://localhost:5173';
    },
    allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Set-Cookie'],
    credentials: true,
  })
);

// Better Auth endpoint
app.on(['POST', 'GET'], '/api/auth/**', (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ ok: true, app: 'Imposter API' });
});

function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create Room: POST /api/rooms/create
app.post('/api/rooms/create', async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  let userId: string;
  let username: string;

  if (session?.user) {
    userId = session.user.id;
    username = (session.user as unknown as { username?: string }).username || session.user.name;
  } else {
    // Fallback if client passed credentials in body or unauthorized
    const body = await c.req.json().catch(() => ({}));
    if (body.userId && body.username) {
      userId = body.userId;
      username = body.username;
    } else {
      return c.json({ error: 'Authentication required to create a room.' }, 401);
    }
  }

  const roomCode = generateRoomCode();
  const doId = c.env.ROOM_DO.idFromName(roomCode);
  const roomStub = c.env.ROOM_DO.get(doId);

  const initRes = await roomStub.fetch('http://do/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode, hostId: userId }),
  });

  if (!initRes.ok) {
    return c.json({ error: 'Failed to initialize room.' }, 500);
  }

  return c.json({
    success: true,
    roomCode,
    hostId: userId,
    hostName: username,
  });
});

// Join Room Check: POST /api/rooms/join
app.post('/api/rooms/join', async (c) => {
  const body = await c.req.json().catch(() => ({})) as { roomCode?: string };
  const cleanCode = (body.roomCode || '').trim().toUpperCase();

  if (!cleanCode || cleanCode.length < 4) {
    return c.json({ error: 'Please enter a valid room code.' }, 400);
  }

  const doId = c.env.ROOM_DO.idFromName(cleanCode);
  const roomStub = c.env.ROOM_DO.get(doId);

  const statusRes = await roomStub.fetch('http://do/status');
  if (!statusRes.ok) {
    return c.json({ error: 'Room not found.' }, 404);
  }

  const status = (await statusRes.json()) as {
    exists: boolean;
    canJoin: boolean;
    phase: string;
    roomCode: string;
  };

  if (!status.exists) {
    return c.json({ error: 'Room not found. Check the room code and try again.' }, 404);
  }

  if (!status.canJoin) {
    return c.json(
      {
        error: 'This room is currently in an active round. Please wait until the round concludes.',
      },
      403
    );
  }

  return c.json({
    success: true,
    roomCode: status.roomCode,
  });
});

// WebSocket Upgrade route: /api/rooms/:code/ws
app.get('/api/rooms/:code/ws', async (c) => {
  const code = c.req.param('code').trim().toUpperCase();
  const doId = c.env.ROOM_DO.idFromName(code);
  const roomStub = c.env.ROOM_DO.get(doId);

  // Forward the WebSocket request directly to the Durable Object
  const url = new URL(c.req.url);
  url.pathname = '/ws';
  return roomStub.fetch(new Request(url.toString(), c.req.raw));
});

export default app;
