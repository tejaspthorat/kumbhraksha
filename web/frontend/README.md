# KumbhRaksha — ICCC Dashboard & Landing (Next.js)

The authority-facing web app for **KumbhRaksha**, the crowd-management and
missing-persons platform for the **Nashik Simhastha Kumbh Mela**, Maharashtra.

This package contains:

- **Landing page** (`/`) — the public marketing/explainer for the platform.
- **ICCC dashboard** (`/dashboard/*`) — the Integrated Command & Control Center:
  live crowd density, CCTV coverage intel, missing-person cases, sighting triage,
  heatmaps, coordinator tasks, analytics, and emergency tooling.
- **Public intake** (`/public/*`) — captcha-protected citizen task/issue reporting.

It talks to the **Express backend** (`../backend`) through a Next.js API gateway
(`/api/[...path]`) which injects Clerk auth context for dashboard routes and
forwards public/mobile routes directly.

> ⚠️ **Heads up:** this project pins **Next.js 16** (`next@16.2.1`). APIs and
> conventions differ from older Next versions — see `AGENTS.md` and the bundled
> docs under `node_modules/next/dist/docs/` before changing framework code.

## Tech stack

| Concern        | Choice                                             |
| -------------- | -------------------------------------------------- |
| Framework      | Next.js 16 (App Router) + React 19                 |
| Styling        | Tailwind CSS v4                                     |
| Auth           | Clerk                                               |
| Data / ORM     | Prisma + Supabase Postgres                          |
| Maps           | Leaflet / react-leaflet                             |
| Charts         | Recharts                                            |
| Realtime       | socket.io-client + SSE (`/api/missing/stream`)      |
| AI             | Groq (crowd-safety predictions, suggestions)        |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The dashboard expects the Express backend running on
[http://localhost:5001](http://localhost:5001):

```bash
cd ../backend && npm run dev
```

## Environment

Create `.env.local` with (at minimum) the Clerk and API keys used by the app:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
BACKEND_URL=http://localhost:5001
```

## Scripts

| Script           | Purpose                          |
| ---------------- | -------------------------------- |
| `npm run dev`    | Start the dev server             |
| `npm run build`  | Production build                 |
| `npm run start`  | Serve the production build       |
| `npm run lint`   | ESLint                           |
| `npm run db:seed`| Seed reference / demo data       |
| `npm run db:prune`| Prune stale rows                |

## Geography

Reference geography (CCTV cameras, coverage zones, police stations, traffic
chokepoints) is parsed from the real Nashik Kumbh KML datasets in `../../data/`
into static JSON under `public/nashik/`. The network center is the camera
centroid around Panchavati / Ramkund (`NASHIK_CENTER` in `src/lib/nashik/geo.ts`).
</content>
</invoke>
