# Phase 2: Alert System + Feed (Week 2)

**Goal**: Implement dual alert mechanism (BLE witness + GPS radius), FCM push notifications, home feed UI, and real-time WebSocket updates.

**Duration**: 7 days (Days 8-14)

---

## Key Features

### Feature 1: Firebase Cloud Messaging (FCM)
- **Owner**: Mobile + Backend team
- **Duration**: Days 8-9 (3 days)
- **Task List**:
  - [ ] Firebase project setup
  - [ ] `google-services.json` + `GoogleService-Info.plist`
  - [ ] `firebase_messaging` integration
  - [ ] FCM token management
  - [ ] Notification handling (foreground, background)
  - [ ] Android notification channels

### Feature 2: BLE Witness Alert Matching
- **Owner**: Backend
- **Duration**: Days 9-10 (2 days)
- **Task List**:
  - [ ] BLE UUID registry queries
  - [ ] Witness matching algorithm
  - [ ] Deduplication logic
  - [ ] API endpoint: POST `/api/alerts/match-ble`

### Feature 3: GPS Radius Alert (Cascade)
- **Owner**: Backend
- **Duration**: Days 10-11 (2 days)
- **Task List**:
  - [ ] Radius expansion schedule (500m → 10km)
  - [ ] PostGIS queries (ST_DWithin)
  - [ ] Cascade scheduler (cron job)
  - [ ] API endpoint: POST `/api/alerts/broadcast-area`

### Feature 4: Home Screen & Alert Feed
- **Owner**: Mobile
- **Duration**: Days 11-12 (2 days)
- **Task List**:
  - [ ] Home screen layout (Material Design 3)
  - [ ] Alert feed list (paginated)
  - [ ] Witness alert card widget
  - [ ] Area alert card widget
  - [ ] Pull-to-refresh
  - [ ] Bottom navigation bar

### Feature 5: WebSocket Real-Time Updates
- **Owner**: Backend + Mobile
- **Duration**: Days 12-13 (2 days)
- **Task List**:
  - [ ] Socket.io server setup
  - [ ] Authentication (JWT)
  - [ ] Event broadcasting
  - [ ] Flutter WebSocket client
  - [ ] Reconnection logic
  - [ ] Error handling

### Feature 6: "I See Them" Confirmation Flow
- **Owner**: Mobile
- **Duration**: Days 13-14 (1 day)
- **Task List**:
  - [ ] Confirmation screen UI
  - [ ] Photo capture with confidence slider
  - [ ] Optional location sharing
  - [ ] Sighting submission endpoint

### Feature 7: "I Was There" Witness Memory Form
- **Owner**: Mobile
- **Duration**: Day 14 (0.5 days)
- **Task List**:
  - [ ] Memory form UI
  - [ ] Time picker
  - [ ] Location memory recall
  - [ ] Direction selector
  - [ ] Witness report submission

### Feature 8: Testing & Integration
- **Owner**: Mobile + Backend
- **Duration**: Day 14 (1 day)
- **Task List**:
  - [ ] Integration tests (API + Database)
  - [ ] Widget tests (UI components)
  - [ ] End-to-end test (Report → Alert → Response)
  - [ ] Manual testing on device

---

## Success Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| Witness alert delivery | <5 seconds from report | Via FCM |
| WebSocket latency | <100ms | For live updates |
| Alert feed FPS | 60 FPS | List rendering |
| API response time (p95) | <500ms | Report & match endpoints |
| FCM delivery rate | >99% | Monitored via Firebase |

---

## File Structure Created

```
lib/features/
├── alerts/
│   ├── data/
│   │   ├── datasources/
│   │   │   ├── alerts_remote_datasource.dart
│   │   │   ├── alerts_local_datasource.dart
│   │   │   └── websocket_datasource.dart
│   │   ├── models/
│   │   │   └── witness_alert_model.dart
│   │   └── repositories/
│   │       └── alerts_repository.dart
│   ├── domain/
│   │   ├── entities/
│   │   │   └── witness_alert_entity.dart
│   │   ├── repositories/
│   │   │   └── alerts_repository.dart
│   │   └── usecases/
│   │       ├── fetch_alerts_usecase.dart
│   │       └── respond_to_alert_usecase.dart
│   └── presentation/
│       ├── providers/
│       │   ├── alerts_feed_provider.dart
│       │   └── websocket_provider.dart
│       ├── screens/
│       │   ├── home_screen.dart
│       │   ├── confirm_sighting_screen.dart
│       │   └── witness_memory_screen.dart
│       ├── widgets/
│       │   ├── witness_alert_card.dart
│       │   ├── area_alert_card.dart
│       │   └── bottom_navigation_widget.dart
│       └── state/
│           └── alerts_state.dart

lib/services/
├── notification_service.dart       # FCM handling
└── websocket_service.dart          # Real-time updates
```

---

## Implementation Checklist

### Backend
- [ ] Firebase Admin SDK initialized
- [ ] FCM token update endpoint
- [ ] BLE witness matching logic
- [ ] GPS radius query with PostGIS
- [ ] Cascade scheduler running
- [ ] Socket.io server with authentication
- [ ] Alert broadcast endpoints
- [ ] Error handling & logging
- [ ] Load testing with 1000+ concurrent alerts

### Mobile
- [ ] Firebase initialization
- [ ] FCM token management
- [ ] Notification handler
- [ ] Home screen with bottom nav
- [ ] Alert feed (paginated, infinite scroll)
- [ ] Witness alert card (Material Design 3)
- [ ] Area alert card
- [ ] WebSocket connection (with reconnect)
- [ ] Confirmation flow (I See Them)
- [ ] Witness memory form
- [ ] Pull-to-refresh
- [ ] Loading states & error handling

### Testing
- [ ] Backend: BLE matching algorithm tests
- [ ] Backend: PostGIS query tests
- [ ] Mobile: Widget tests for alert cards
- [ ] Mobile: Integration tests (Repo + API)
- [ ] E2E: Full flow from report to witness response
- [ ] Manual: 2+ devices testing

---

## Phase 2 Completion Checklist

- [ ] Firebase project fully configured
- [ ] FCM notifications sent & received on devices
- [ ] Home screen displays alert feed
- [ ] Alert feed updates via WebSocket in real-time
- [ ] Witness alerts match BLE encounters from report
- [ ] GPS radius alerts expand on schedule
- [ ] "I See Them" sighting submission works
- [ ] "I Was There" witness memory form works
- [ ] All alerts paginated and performant (60 FPS)
- [ ] Notification permissions requested correctly
- [ ] Tests: >80% coverage on critical paths
- [ ] Manual test: Report → Witness receives alert → Responds → Data syncs

---

## Notes

- **Backend dependency**: Phase 1 must be complete (report submission)
- **Frontend dependency**: Phase 1 onboarding & auth must work
- **Critical path**: Get FCM working by Day 9, WebSocket by Day 12
- **Risk**: FCM token management; ensure tokens sync correctly

---

**Last Updated**: 2026-06-27
