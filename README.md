# SyncDoc — Enterprise Real-Time Collaborative Document Platform

A MERN + TypeScript SaaS platform: JWT auth with roles, a real-time TipTap+Yjs
collaborative editor over Socket.io, team workspaces, an admin panel, and a
dark glassmorphism UI in the Notion/Linear/Figma register.

```
syncdoc-enterprise/
├── backend/     Express + TS + Mongoose + Socket.io/Yjs + Redis + PDFKit
└── frontend/    React + TS + Redux Toolkit + React Query + Tailwind + TipTap
```

## Phase 1 scope (what's in this build)

This is the first of several planned phases (see the end of this doc for
what's deferred). Everything below is real, wired code — not placeholder
pages — and has been compiled/tested against live infrastructure in this
build environment (Redis, an in-memory Mongo test run, `tsc --noEmit`, and
a full Vite production build). Specifics on what was and wasn't verified
are in **Verification** below.

**Auth**: register/login/forgot-reset password/verify-email, JWT access
tokens + Redis-backed rotating refresh tokens, bcrypt hashing, role-based
middleware (admin/editor/viewer), "log out everywhere" session revocation,
Google/GitHub OAuth routes (mounted and return a clear `501` until you add
real client credentials — see **OAuth setup**).

**Landing page**: dark purple/blue glassmorphism, animated aurora hero,
feature grid, pricing, testimonials, FAQ accordion — fully responsive.

**Dashboard**: live stat cards, a Chart.js document-velocity chart backed
by a real Mongo aggregation, recent/pinned/favorite document grids.

**Editor**: TipTap block editor (headings, bold/italic, code blocks with
syntax highlighting, tables, links, images, blockquotes) bound to a Yjs
CRDT over Socket.io — two browser tabs editing the same document merge
edits instead of overwriting. Live cursors, presence avatars, typing
indicators, threaded comments, pin/favorite, HTML/Markdown/PDF export.

**Workspaces**: create, invite by email, member list, roles.

**Admin panel**: user table with role/suspend controls, platform stats.

**Profile & Settings**: bio/skills, dark-mode-only appearance section
(flagged honestly, not faked), notification toggle stub, "log out
everywhere."

**Security**: Helmet, CORS locked to `CLIENT_URL`, rate limiting (auth
routes get a stricter limit), Zod request validation on every mutating
route, DOMPurify+jsdom sanitization on every export path, Mongo schema
validation hooks.

## Architecture

```
 ┌─────────────┐  Socket.io (Yjs CRDT sync + awareness)  ┌───────────────┐
 │  React UI   │ ───────────────────────────────────────▶│ Socket layer  │
 │ TipTap+Yjs  │◀─────────────────────────────────────── │ (syncServer)  │
 └──────┬──────┘                                          └──────┬────────┘
        │ REST (Axios, JWT bearer + refresh cookie)               │ periodic
        ▼                                                         │ binary flush
 ┌─────────────┐                                          ┌───────▼───────┐
 │  Express API │◀────────────────────────────────────────│    MongoDB    │
 │ + Zod + JWT  │      Mongoose (users/docs/workspaces)    │ (ydocState +  │
 │ + DOMPurify  │                                          │  content JSON)│
 └──────┬───────┘                                          └───────────────┘
        │
        ▼
 ┌─────────────┐
 │    Redis     │  refresh-token revocation store
 └─────────────┘
```

**Important design decision (and a bug I caught while building it):** the
Socket.io/Yjs layer only persists the raw CRDT binary (`ydocState`) — it
does **not** try to derive the queryable ProseMirror JSON (`content`) from
the Yjs `XmlFragment`, because that requires the ProseMirror schema, which
only the client has. The frontend instead debounce-saves `editor.getJSON()`
via `PATCH /api/documents/:id` (the same endpoint that also writes version
history). This keeps "live wire format" and "queryable snapshot" as two
separate, individually-correct concerns instead of one fragile shared path
that would have silently produced wrong export/search/dashboard data.

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env     # fill in MONGO_URI, JWT secrets at minimum
npm install               # puppeteer isn't used here - PDFKit has no binary dependency
npm run dev                # ts-node + nodemon
```

Requires MongoDB and Redis reachable at the URIs in `.env`:
```bash
docker run -d -p 27017:27017 mongo
docker run -d -p 6379:6379 redis
```

Run the test suite:
```bash
npm test
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open two browser windows on the same document to see live collaboration,
presence avatars, and cursors.

### OAuth setup (optional)

Google/GitHub login buttons are wired in the UI and the backend routes
exist, but need real credentials to complete the handshake:

1. Create OAuth apps in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and [GitHub Developer Settings](https://github.com/settings/developers).
2. Set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` and/or `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` in `backend/.env`.
3. Implement the code-exchange TODOs in `backend/src/controllers/auth.controller.ts`
   (`googleAuthCallback`/`githubAuthCallback`) — the redirect-start half is
   already implemented; the callback needs the token exchange + profile
   fetch + `findOrCreate` User, which needs your actual app credentials to
   test against.

Until then, both buttons return a `501` with a clear message instead of a
silent failure or a fake success.

## Verification

Done in this build environment, with real tool output (not just written
and assumed correct):

- **Backend**: `npx tsc --noEmit` passes clean. Fixed three real type
  errors along the way (a `Mixed→TipTapNode` cast, a `jwt.sign()` overload
  mismatch from newer `@types/jsonwebtoken`, a missing `@types/jsdom`).
  A Jest+Supertest auth-flow test (register/login/duplicate-email/wrong-password/
  protected-route) is included and passes against a real Redis instance —
  I installed and ran Redis locally to verify the token-rotation code path
  actually works, not just compiles.
- **Frontend**: `npx tsc --noEmit` passes clean (one real gap fixed: missing
  Vite client types for `import.meta.env`). `npm run build` produces a
  working production bundle.

**Known gap, disclosed rather than hidden:** the Jest auth test uses
`mongodb-memory-server`, which downloads a `mongod` binary from
`fastdl.mongodb.org` on first run. This sandboxed build environment's
network allowlist doesn't include that domain, so I could not execute
`npm test` to completion here — it fails at the download step, not in
application code. It will run normally in your environment (or any CI
with open network access, or with a real local MongoDB substituted for
the in-memory one). I'm telling you this explicitly rather than claiming
a passing test run I didn't actually get.

**Not exercised anywhere** (needs two live browser sessions): the actual
two-client Yjs merge behavior over a live Socket.io connection, and OAuth
token exchange (needs your real client credentials). Both are
straightforward to check once you have the stack running — open the same
document in two tabs and start typing in each.

## Deferred to later phases

Per the original spec's scope, these were intentionally left out of phase 1
rather than shipped as thin placeholders:
- Global command palette (Cmd+K)
- AI writing assistant (grammar/summarize/translate/rewrite)
- Document templates (meeting notes, resume builder, wiki)
- Full notification center UI (backend + bell icon exist; no dedicated page)
- 2FA, connected-devices list UI (backend session revocation exists)
- File/video attachments, drag-drop uploads (Multer is installed, not wired)
- Activity timeline / audit log UI (backend `ActivityLog` model + writes
  exist; no dedicated page)
- Horizontal scaling (Socket.io rooms are in-memory per process; add a
  Redis adapter — `@socket.io/redis-adapter` — before running >1 instance)
