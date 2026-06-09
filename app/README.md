# Office Quest — app

Backend + frontend for the office scavenger hunt. See `../SPEC.md` for the full design.

## What's built so far

- TypeScript project scaffold (Node 20, ESM)
- SQLite layer with migrations and a `resetGame()` helper (`src/server/db.ts`)
- Data-access layer with all SQL in one place (`src/server/store.ts`)
- Quest loader with hashed codes (`src/server/quest.ts`)
- `quest:hash` CLI that turns the plaintext quest into the committed, hashed one
- Auth: register / login / logout / me, bcrypt + JWT cookie (`src/server/auth.ts`)
- Solo routes: start, state, submit, leaderboard (`src/server/routes.solo.ts`)
- Team routes: shared state + submit, broadcast over Socket.IO (`src/server/routes.team.ts`)
- Socket.IO live updates (`src/server/sockets.ts`)
- Server wiring with rate-limited submits, serving the built client (`src/server/index.ts`)
- React + Vite + Tailwind frontend: Hunt, Solo cabinet, Leaderboard (`src/client/`)
- Admin reset: `npm run reset` CLI + token-protected `POST /api/admin/reset` (`routes.admin.ts`)

The app is feature-complete; infra lives in `../infra` and `../deploy`.

## Setup

```bash
npm install
cp .env.example .env
```

> Native deps (`better-sqlite3`) install from prebuilt binaries on Node 20. The production image
> uses `node:20-slim` for this reason.

## Authoring the quest (codes are hashed)

1. Edit `../quest/quest.plain.yaml` with your real codes and hints (this file is gitignored).
2. Generate the committed, hashed file:

   ```bash
   npm run quest:hash
   ```

   This writes `../quest/quest.yaml` with bcrypt `code_hash` values — no plaintext answers. Commit
   only `quest.yaml`.

Codes are matched case- and separator-insensitively, so `BLUE-FALCON` and `blue falcon` are the
same code.

## Run (development)

Two processes — the API and the Vite dev server (which proxies `/api` and `/socket.io` to it):

```bash
npm run migrate     # create tables
npm run dev         # API on :3000
npm run dev:client  # UI on :5173  (second terminal)
```

Open http://localhost:5173.

## Run (production-style, single port)

```bash
npm run build       # tsc (server) + vite build (client)
npm start           # serves API + UI together on :3000
```

## Scripts

| Script               | Does                                            |
|----------------------|-------------------------------------------------|
| `npm run dev`        | start API with hot reload (tsx)                 |
| `npm run dev:client` | Vite dev server for the UI                      |
| `npm run build`      | build server (tsc) + client (vite)              |
| `npm start`          | run the compiled server (serves API + UI)       |
| `npm run migrate`    | apply DB migrations                             |
| `npm run reset`      | clear all progress (users, runs, team, feed)    |
| `npm run quest:hash` | hash `quest.plain.yaml` -> `quest.yaml`         |
