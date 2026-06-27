# KumbhRaksha

**AI-powered crowd management & missing-persons network for the Nashik Simhastha Kumbh Mela, Maharashtra.**

The Kumbh Mela draws up to **17 million pilgrims a day** to the banks of the
Godavari in Nashik. Two problems dominate public safety at that scale:

1. **Crowd surges & stampedes** — dense chokepoints around the bathing ghats
   (Ramkund, Panchavati) become deadly in minutes.
2. **Missing persons** — children and elders separated from families in a sea of
   people, with no fast way to reunite them.

KumbhRaksha tackles both with **software and the phones people already carry** —
no special hardware. It gives the **Integrated Command & Control Center (ICCC)**
real-time crowd density and CCTV coverage intel, and turns every pilgrim's phone
into a live missing-persons search network with an automatically expanding alert
cascade.

---

## What's in this repo

| Path           | What it is                                                                                  | Stack                                  |
| -------------- | ------------------------------------------------------------------------------------------- | -------------------------------------- |
| `mobile_app/`  | **Citizen app** — onboarding, report missing person, witness alert feed, sightings, map.    | Flutter · Dart · Provider              |
| `web/frontend/`| **ICCC dashboard + landing** — crowd density, CCTV, cases, sighting triage, analytics.      | Next.js 16 · React 19 · Tailwind v4    |
| `web/backend/` | **Core API** — missing-persons network, mobile/coordinator auth, tasks, alerts.             | Express · Prisma · Supabase Postgres   |
| `fast-api/`    | **Crowd-vision service** — YOLOv8 person detection, density levels, heatmaps, CCTV streams. | Python · Flask · OpenCV · Ultralytics  |
| `data/`        | Real Nashik Kumbh reference geography (CCTV cameras, chokepoints, police stations).         | KML datasets                           |
| `implementation/` | Phase-by-phase build plan, architecture, and design system.                              | Markdown                               |

---

## Architecture

```
                ┌───────────────────────────┐
   Pilgrims ───▶│  mobile_app (Flutter)     │
                │  report · alerts · sight  │
                └────────────┬──────────────┘
                             │ REST  /api/missing/*
                             ▼
   Authorities ─▶┌───────────────────────────┐   Prisma   ┌──────────────┐
   (ICCC)        │  web/backend (Express)    │──────────▶│  Supabase     │
                 │  missing · mobile · tasks │            │  Postgres     │
                 └────────────┬──────────────┘            └──────────────┘
                              ▲ gateway /api/[...path]
                 ┌────────────┴──────────────┐
                 │  web/frontend (Next.js)   │
                 │  ICCC dashboard + landing │
                 └────────────┬──────────────┘
                              │ crowd density / heatmaps / CCTV
                              ▼
                 ┌───────────────────────────┐
                 │  fast-api (Flask + YOLO)  │
                 │  camera streams + counts  │
                 └───────────────────────────┘
```

- **Missing-persons flow** is owned by `web/backend` (`/api/missing/*`) and backed
  by Supabase Postgres. Both the mobile app and the dashboard read/write it.
- **Crowd-vision** (person counts, density, heatmaps) is produced by `fast-api`
  from CCTV / video sources and surfaced on the dashboard.

---

## Quick start

Run the four pieces in separate terminals.

### 1. Core API — `web/backend`

```bash
cd web/backend
npm install
npx prisma generate
npm run dev          # http://localhost:5001
```

### 2. Dashboard + landing — `web/frontend`

```bash
cd web/frontend
npm install
npm run dev          # http://localhost:3000
```

### 3. Crowd-vision service — `fast-api`

```bash
cd fast-api
pip install -r requirements.txt
python app.py        # http://localhost:5000
```

### 4. Citizen app — `mobile_app`

```bash
cd mobile_app
flutter pub get
flutter run
```

> On the Android emulator, point the app at the host via `10.0.2.2` — see the
> commented `baseUrl` in `mobile_app/lib/core/constants/api_constants.dart`.

---

## Key features

**Crowd management (ICCC)**
- Live crowd **density** and **counts** per zone (YOLOv8 person detection).
- **Heatmaps** and grid aggregation across all cameras.
- **CCTV coverage intel** — 4,000+ real camera points, coverage zones, blind spots.
- **Chokepoint** risk map and **coordinator tasks** to dispatch field teams.
- Groq-powered **predictions, suggestions and decisions** for crowd safety.

**Missing persons**
- **Flow A (reactive):** a family files a report → it lands on the ICCC dashboard
  and pushes to every phone near the last-seen location.
- **Flow B (proactive):** a citizen reports someone who *looks* lost → triaged and
  matched against open cases.
- **Expanding alert cascade:** 500 m → 1 km → sector → Mela-wide, overridable by
  command at any time.

---

## Geography

All map data is grounded in the **real Nashik Kumbh** KML datasets in `data/`,
parsed into static JSON. The network center is the CCTV camera centroid around
**Panchavati / Ramkund** (`NASHIK_CENTER` ≈ `19.9958, 73.7973`).

---

## Documentation

- `implementation/app/` — phased build plan, architecture, and design system.
- `web/backend/API_DOCUMENTATION.md` — full API catalog and auth model.
- `DESIGN.md` / `redesign.md` — design language and UI direction.

---

*Built for pilgrim safety.*
</content>
