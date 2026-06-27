# KumbhRaksha: Flutter App Implementation Guide

## Project Overview

**KumbhRaksha** is a missing person search and reunion platform for Kumbh Mela pilgrims using:
- **BLE proximity detection** for witness identification
- **GPS-based radius alerts** for area awareness
- **Real-time authority dashboard** for case management
- **Family pre-registration** for quick reporting

---

## Implementation Structure

This guide is organized into modular components:

```
00-overview/           # Project overview & high-level architecture
01-architecture/       # System design & data models
02-design-system/      # Material Design 3 theme & component specs
03-phase1-ble/         # Phase 1: BLE + Core Reporting (Week 1)
04-phase2-alerts/      # Phase 2: Alert System + Feed (Week 2)
05-phase3-map/         # Phase 3: Sightings + Map + Dashboard (Week 3)
06-phase4-polish/      # Phase 4: Optimization + Deployment (Week 4)
07-backend/            # Backend API & PostgreSQL specs
08-testing/            # Testing strategy & QA
09-deployment/         # Deployment & launch checklist
```

Each phase folder contains:
- `00-feature-list.md` - All tasks for that phase
- `01-*.md` - Individual feature implementation guides
- `checklist.md` - Phase completion checklist

---

## Quick Start

1. **Read first**: `01-architecture/system-design.md` — understand data flow
2. **Design phase**: `02-design-system/` — Material Design 3 setup
3. **Development phase**: Start with `03-phase1-ble-foundation/`
4. **Parallel**: Backend team starts `07-backend/`

---

## Key Principles

### 🎨 Design
- **Material Design 3** with dynamic color theming
- **Figma mockups** for all screens before coding
- **Accessibility-first** (WCAG AA compliance)
- **11 languages** support (Hindi + 10 regional)

### 🏗️ Architecture
- **Feature-based folder structure** in `lib/`
- **Riverpod** for state management
- **Repository pattern** for data access
- **Service layer** for business logic
- **BLoC/Cubit** for complex flows

### 🔐 Security & Privacy
- **JWT + refresh token** auth
- **Encrypted local storage** for sensitive data
- **BLE UUID rotation** every 15 minutes
- **Geo-data anonymization** where possible
- **Consent-based** data collection

### 🚀 Performance
- **<3s cold start** time
- **60 FPS** alert feed rendering
- **<50MB** APK/IPA size
- **<10%** daily battery drain
- **Offline-first** with sync queue

---

## Success Metrics (Hackathon)

- 🔄 **BLE Proximity Detection**: Scanning functional; Advertising is stubbed (Central-only scanning via `flutter_blue_plus`, peripheral advertising deferred).
- ✅ **End-to-End Flow**: Simulated OTP login, report creation, witness detection, and sighting alerts work fully.
- ✅ **Home Feed**: Live paginated scroll feed with WebSocket integration works fully.
- 🔄 **Active Alerts Map**: Custom pure-Dart interactive map works fully; Google Maps SDK integration is ready but stubbed pending API key configuration.
- ✅ **Authority Dashboard**: Next.js SentinelView dashboard, YOLOv8 crowd monitoring, and coordinator task flow are fully implemented.
- 🔄 **Platform Support**: Builds cleanly and parses with zero analyze issues; local packaging was blocked by local system resources.
- ✅ **Documentation**: Complete set of phase-by-phase implementation blueprints and developer specifications.

---

## Technology Stack

### Mobile (Flutter)
- **Framework**: Flutter 3.x (Dart)
- **State**: Riverpod 2.x
- **Local DB**: SQLite (sqflite)
- **BLE**: flutter_blue_plus
- **Maps**: google_maps_flutter
- **HTTP**: dio + interceptors
- **Push**: firebase_messaging
- **UI**: Material 3 + custom widgets

### Backend (Node.js/Express)
- **API**: Express 4.x + TypeScript
- **DB**: PostgreSQL + PostGIS
- **Real-time**: Socket.io
- **Push**: Firebase Admin SDK
- **File Storage**: AWS S3
- **Job Queue**: Bull/Redis

### Dashboard (React)
- **Framework**: React 18+ (TypeScript)
- **State**: Zustand
- **UI**: Material-UI 5 + Tailwind
- **Maps**: google-maps-react
- **Tables**: TanStack Table
- **Real-time**: Socket.io client

---

## Timeline Overview

| Week | Phase | Focus | Key Deliverables |
|------|-------|-------|-----------------|
| 1 | Phase 1 | BLE + Core Reporting | BLE scanning, Report form, Auth |
| 2 | Phase 2 | Alert System + Feed | Witness alerts, Home feed, WebSocket |
| 3 | Phase 3 | Map + Dashboard | Active alerts map, Authority dashboard, Sightings |
| 4 | Phase 4 | Polish + Scale | Audio beacon, Localization, Load testing, Deployment |

---

## 📊 Project Implementation Status & Tasks Checklist

This checklist tracks all the tasks and features outlined in the modular guides, showing which are fully implemented, partially implemented/stubbed, deferred, or not implemented.

### Legend
*   🟢 **Fully Implemented**: Complete production-ready or fully functional code.
*   🟡 **Partially Implemented / Stubbed**: Feature code exists but relies on stubs, mock data, or a custom implementation instead of external APIs (e.g. custom map instead of Google Maps API).
*   🟠 **Deferred / Skipped**: Postponed due to hardware/credential limitations (documented with clean integration paths).
*   🔴 **Not Implemented**: Scheduled for Phase 4 but not yet developed.

### 📱 Citizen Mobile App (Flutter) & Backend API

#### Phase 1: BLE Foundation & Core Reporting (Week 1)
- [x] **Project Initialization** — 🟢 *Fully Implemented* (Flutter project setup with Provider state management and modular directory structure)
- [x] **Theme & Design System** — 🟢 *Fully Implemented* (Material Design 3 light/dark themes, dynamic typography, custom brand theme)
- [x] **Dart Data Models** — 🟢 *Fully Implemented* (Models for `User`, `MissingReport`, `WitnessAlert`, `Sighting`, `FamilyGroup`, and `BLEEncounter` with JSON serialization and unit tests)
- [x] **BLE Scanner Service** — 🟢 *Fully Implemented* (Foreground scanning to discover nearby devices via `flutter_blue_plus`)
- [/] **BLE Advertising Service** — 🟡 *Partially Implemented / Stubbed* (BLE advertising is stubbed because `flutter_blue_plus` is central-only; advertising requires a peripheral-specific plugin)
- [x] **RSSI-to-Distance Utility** — 🟢 *Fully Implemented* (Logarithmic path loss model accurately estimating proximity in meters)
- [x] **BLE Permissions Handling** — 🟢 *Fully Implemented* (Runtime permissions for location, Bluetooth, notifications, camera)
- [x] **UUID Rotation System** — 🟢 *Fully Implemented* (Generates and rotates temporary BLE advertisement UUIDs every 15 minutes with a 5-minute grace period)
- [x] **Local SQLite Database** — 🟢 *Fully Implemented* (SQLite storage via `sqflite` for encounters, rotated registry, and offline queues with a 2-hour rolling window)
- [x] **GPS Location Service** — 🟢 *Fully Implemented* (Position tracking and caching via `geolocator`)
- [x] **Onboarding UI Flow** — 🟢 *Fully Implemented* (Indian phone number validation and OTP verification countdown screens)
- [x] **Report Missing Person Form** — 🟢 *Fully Implemented* (Photo picker/compressor, physical descriptors, clothing selector, coordinates/landmark picker, and Provider form state submission)
- [x] **Backend API & PostgreSQL Schema** — 🟢 *Fully Implemented* (JWT auth, report processing, and SQLite sync endpoints mapped on backend)
- [ ] **Android BLE Foreground Service** — 🟠 *Deferred / Skipped* (Android-native Kotlin service deferred to Phase 4; documented clean setup path)
- [x] **Unit & Integration Testing** — 🟢 *Fully Implemented* (Validation of data models and distance calculations, 5 passing unit tests)

#### Phase 2: Alert System + Feed (Week 2)
- [/] **Firebase Cloud Messaging (FCM)** — 🟡 *Partially Implemented / Stubbed* (FCM token management and notification routing are fully implemented; production-ready FCM is stubbed pending `google-services.json`)
- [x] **BLE Witness Matching** — 🟢 *Fully Implemented* (Local SQLite logs queried against missing person UUIDs on backend to find matching co-located witnesses)
- [x] **GPS Radius Cascade Alerting** — 🟢 *Fully Implemented* (Geospatial queries (`ST_DWithin`) implemented on Postgres/PostGIS to target users in expanding geographical zones)
- [x] **Home Screen & Alert Feed UI** — 🟢 *Fully Implemented* (Proximity-sorted alert feed with pull-to-refresh, infinite scroll, and live status badges)
- [x] **WebSocket Real-Time Broadcast** — 🟢 *Fully Implemented* (Live feed updates instantly via Socket.io/`web_socket_channel` with reconnection and backoff handlers)
- [x] **Sighting ("I See Them") Flow** — 🟢 *Fully Implemented* (One-tap reporting with camera snapshot, location pins, and notes)
- [x] **Witness Memory ("I Was There") Flow** — 🟢 *Fully Implemented* (Forms allowing citizens to retrospectively share details on direction, location, and timestamps)
- [x] **Phase 2 UI Testing** — 🟢 *Fully Implemented* (7 passing tests, including widget-level tests for Alert feed cards)

#### Phase 3: Sighting, Map, and Family (Week 3)
- [x] **Report Proactive Sighting Screen** — 🟢 *Fully Implemented* (Photo uploads, emoji-based behavior tags, confidence score feedback, and live guiding options)
- [/] **Interactive Active Alerts Map** — 🟡 *Partially Implemented / Stubbed* (A high-fidelity, pure-Dart InteractiveViewer map with pulsing circles, heatmaps, layer toggles, and detail sheets. Google Maps SDK integration is ready but deferred/stubbed due to key configuration requirements)
- [x] **Family Group Management** — 🟢 *Fully Implemented* (Pre-registration list (max 10), editable detail cards, and one-tap auto-prefilled reporting)
- [x] **Attribute Matching Engine** — 🟢 *Fully Implemented* (Algorithmic comparison of clothing/visual attributes on the backend to match sightings with missing reports)

#### Phase 4: Polish & Scale (Week 4)
- [ ] **Melody Audio Beacon** — 🔴 *Not Implemented* (Pre-recorded audio alerts loop at max volume for lost family members)
- [ ] **SMS Escalation (MSG91)** — 🔴 *Not Implemented* (Police notifications and citizen SMS fallback via MSG91 API gateway)
- [ ] **iOS Background BLE Optimization** — 🔴 *Not Implemented* (iOS background capabilities and entitlements configuration)
- [ ] **Multi-Language Localization** — 🔴 *Not Implemented* (Support for 11 regional languages; UI language picker is fully coded but translation file infrastructure is not integrated)
- [ ] **Load & Scale Testing** — 🔴 *Not Implemented* (Locust/K6 simulation for 10K concurrent users and high-throughput WebSockets)
- [ ] **Performance Tuning** — 🔴 *Not Implemented* (Cold start timing, ProGuard compilation, and memory profiling)
- [ ] **Offline Resilience Utilities** — 🔴 *Not Implemented* (Integration of `connectivity_plus` for network state-switching and polling fallbacks)
- [ ] **Analytics Engine** — 🔴 *Not Implemented* (Statistical reporting on reunion metrics, volunteer response, and coverage)

---

### 🖥️ Real-time Crowd Management Dashboard (SentinelView)

- [x] **UI Layout & Pages** — 🟢 *Fully Implemented* (Interactive Next.js screens for live operations, zones, alerts log, and setup layouts)
- [x] **State Management (Zustand)** — 🟢 *Fully Implemented* (Centralized store with type-safe interfaces, local selectors, and optimistic updates)
- [x] **Prisma & Database Migrations** — 🟢 *Fully Implemented* (PostgreSQL schema mapped via Prisma ORM including custom enums and high-performance indexes)
- [x] **Real-time YOLOv8 ML Backend** — 🟢 *Fully Implemented* (FastAPI engine running YOLOv8 crowd detection on active camera feeds to generate density counts)
- [x] **AI Decision & Suggestion Engine (Groq/Llama3)** — 🟢 *Fully Implemented* (Three-tier AI pipeline querying LLM models to generate predictions, crowd rerouting suggestions, and action directives)
- [x] **Internal Coordination API** — 🟢 *Fully Implemented* (Mobile login, task dispatching, and live progress updating for ground coordinators)

---

## File Structure (After Implementation)

```
kumbhraksha/
├── lib/
│   ├── core/
│   │   ├── constants/
│   │   ├── theme/              # Material Design 3 theme
│   │   ├── utils/
│   │   └── extensions/
│   ├── features/
│   │   ├── auth/               # Onboarding & auth
│   │   ├── ble/                # BLE scanning & advertising
│   │   ├── location/            # GPS & location services
│   │   ├── report/              # Missing person report
│   │   ├── alerts/              # Alert feed & notifications
│   │   ├── map/                 # Active alerts map
│   │   ├── sightings/           # Sighting reports
│   │   ├── family/              # Family group management
│   │   └── profile/             # User profile & settings
│   ├── models/                  # Data models (shared)
│   ├── services/                # Services (API, BLE, Location, etc.)
│   ├── repositories/            # Data access layer
│   ├── providers/               # Riverpod providers
│   ├── widgets/                 # Reusable components
│   ├── screens/                 # Full page screens
│   └── main.dart
├── test/
│   ├── unit/
│   ├── integration/
│   └── widget/
├── assets/
│   ├── images/
│   ├── icons/
│   ├── translations/
│   └── fonts/
├── android/
├── ios/
└── pubspec.yaml
```

---

## Next Steps

1. **Review Architecture** → `01-architecture/system-design.md`
2. **Setup Design System** → `02-design-system/material-design-3.md`
3. **Plan Phase 1** → `03-phase1-ble-foundation/00-feature-list.md`
4. **Initialize Project** → Start Flutter project with structure above
5. **Implement Features** → Follow phase-by-phase guides

---

## Notes for Hackathon

- **MVP Focus**: Complete Phase 1 & 2 fully, Phase 3 & 4 MVP
- **Parallel Teams**: 
  - Team A: Flutter mobile app (3-4 devs)
  - Team B: Backend API (2-3 devs)
  - Team C: Dashboard (1-2 devs)
- **Demo Prep**: Pre-load test data, prepare talking points
- **Documentation**: README + architecture diagrams ready by Day 22

---

**Last Updated**: 2026-06-27  
**Version**: 2.0 (Modular Structure)
