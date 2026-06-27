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

- ✅ BLE scanning/advertising working locally
- ✅ End-to-end flow: Register → Report → Witness Alert → Response
- ✅ Home feed with real-time alerts (WebSocket)
- ✅ Map with active cases and sightings
- ✅ Authority dashboard MVP (case management)
- ✅ Builds & runs on Android (iOS optional)
- ✅ Documentation & demo-ready

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
