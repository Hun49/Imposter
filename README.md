# 🕵️ Imposter — Voice Party Game Companion

A real-time party game companion web application designed for group voice calls (e.g., Discord).

Everyone in the room receives the same secret word—except one randomly selected **Imposter**. Players take turns describing the word subtly without giving it away, while the Imposter tries to blend in, deduce the secret word, and survive the vote.

🌐 **Live Application**: [https://imposter-web.pages.dev](https://imposter-web.pages.dev)  
⚡ **API & Realtime Gateway**: [https://imposter-api.hun-wrk0966.workers.dev](https://imposter-api.hun-wrk0966.workers.dev)

---

## 🎯 Gameplay Rules & Philosophy

- **Zero-In-App Bloat**: Voice discussion, questioning, accusing, and voting happen naturally in your voice call (Discord). The app handles secret role distribution, synchronized timers, and player presence.
- **Strict Role Secrecy**: The server Durable Object isolates role data. The Imposter payload has `secretWord: null` to make client-side tampering impossible.
- **Synchronized Authoritative Timer**: Server-authoritative countdown using Cloudflare Durable Object alarms (minimum 6 minutes).
- **Concealed Cards**: Tap your card to reveal your role/word privately. Tap again to conceal.

---

## 🛠️ Tech Stack

- **Frontend (`apps/web`)**:
  - React 19 + TypeScript + Vite
  - Tailwind CSS v4 (Strict dark theme `bg-zinc-950`)
  - Lucide React icons
  - Zustand for unified client-side state management & auto-reconnection
  - Better Auth Client (First-party cookies via Pages Functions proxy)

- **Backend (`apps/api`)**:
  - Cloudflare Workers + Hono
  - Cloudflare Durable Objects (`RoomDO`) with WebSockets
  - Cloudflare D1 (Serverless SQLite) with Drizzle ORM
  - Better Auth with credentials & username plugin

- **Shared Package (`packages/shared`)**:
  - Strongly typed client/server WebSocket protocols
  - Curated 100+ word pool
  - Game constants & validation rules

---

## 🚀 Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/) >= 9
- [Node.js](https://nodejs.org/) >= 20
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) >= 4

### Installation

```bash
# Clone the repository
git clone https://github.com/Hun49/Imposter.git
cd Imposter

# Install dependencies
pnpm install
```

### Local Development

```bash
# Run both API and Web concurrently
pnpm run dev
```

- Web runs at `http://localhost:5173`
- API runs at `http://localhost:8787`

### Production Build & Tests

```bash
# Type check all packages
pnpm run check-types

# Build web application
pnpm --filter @imposter/web run build

# Run automated E2E live protocol test suite
node scripts/e2e-live-test.mjs
```

---

## 📄 License

MIT © [Huntech](https://github.com/Hun49)
