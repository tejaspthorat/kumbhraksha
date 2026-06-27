# KumbhRaksha Mobile App — Build Checklist

Tracking feature-by-feature implementation of Phase 1 (BLE Foundation + Core Reporting).
State management: **Provider** (per global standards). Architecture: feature-based per `implementation/app/01-architecture`.

Legend: ⬜ todo · 🔄 in progress · ✅ done

---

## Foundation
- ✅ `pubspec.yaml` — dependencies (provider, flutter_blue_plus, geolocator, sqflite, dio, secure_storage, image_picker…)
- ✅ Theme — `color_scheme.dart`, `text_theme.dart` (Inter/Google Fonts), `app_theme.dart` (light + dark M3)
- ✅ Constants — `dimensions.dart`, `durations.dart`, `ble_constants.dart`, `api_constants.dart`, `app_constants.dart`
- ✅ Utils — `distance_calculator.dart`, `validators.dart`, `app_logger.dart`

## Data Models
- ✅ `enums.dart` (status, alert types, languages, clothing option lists)
- ✅ `user.dart`
- ✅ `ble_encounter.dart`
- ✅ `missing_report.dart` (+ `Clothing`)
- ✅ `witness_alert.dart`
- ✅ `sighting.dart`
- ✅ `family_group.dart`

## Services
- ✅ `database_service.dart` (SQLite: encounters, uuid registry, pending reports + indices)
- ✅ `storage_service.dart` (secure storage + shared prefs)
- ✅ `ble_service.dart` (real scanning; advertising stubbed — flutter_blue_plus is central-only)
- ✅ `location_service.dart` (GPS + last-known cache)
- ✅ `api_service.dart` (Dio + auth/refresh/logging interceptors)

## Repositories
- ✅ `encounter_repository.dart` (windowed queries, sync flags, cleanup)
- ✅ `auth_repository.dart` (mock OTP `123456` + real API path)
- ✅ `report_repository.dart` (submit + offline queue)

## State (Provider / ChangeNotifier)
- ✅ `auth_provider.dart`
- ✅ `ble_provider.dart`
- ✅ `report_form_provider.dart`

## Screens (feature by feature)
- ✅ **Splash screen** — animated brand, bootstraps auth, routes onward
- ✅ **Language selection** — 11 languages, native names
- ✅ **Permissions** — explainer cards + runtime request
- ✅ **Phone input** — +91 validation
- ✅ **OTP verification** — auto-submit at 6 digits, resend countdown
- ✅ **Home / Alert feed** — BLE protection banner + witness/area alert cards
- ✅ **Report missing person** — photo, identity, clothing, build, location, time, success sheet
- ✅ **Map** — structured placeholder (full Maps in Phase 3)
- ✅ **Profile** — user, BLE toggle, family/language links, logout
- ✅ **Nav shell** — bottom navigation (Home · Report · Map · Profile)
- ✅ Widget — `witness_alert_card.dart`

## Platform
- ✅ AndroidManifest — BLE/location/foreground-service/camera/notification permissions, app label
- ✅ `minSdk` pinned to 24 (plugin compatibility)
- ⬜ Android foreground BLE service (Kotlin) — deferred (needs peripheral plugin; documented)

## Verification
- ✅ `flutter pub get`
- ✅ `flutter analyze` — No issues found
- ✅ Unit tests (models + distance calc) — 5 passing
- ⛔ `flutter build apk --debug` — BLOCKED: C: drive has only ~80 MB free.
      Gradle cannot unpack/build. Free up several GB, then re-run:
      `$env:JAVA_HOME="C:\Program Files\Java\jdk-18.0.2.1"; flutter build apk --debug`
      (Stale JAVA_HOME also fixed — it pointed at a removed jdk-17.)

---

---

# Phase 2 — Alert System + Feed (Week 2)

## Services
- ✅ `websocket_service.dart` — real-time client; mock emitter (live alerts every 25s) + real connect/reconnect (exponential backoff) using `web_socket_channel`
- ✅ `notification_service.dart` — FCM **stub** (token mgmt + logging; documented swap for `firebase_messaging`)

## Repositories
- ✅ `alerts_repository.dart` — paginated feed (mock 3 pages), respond, submit sighting, submit witness memory

## State (Provider)
- ✅ `alerts_feed_provider.dart` — pagination, pull-to-refresh, live WS inserts, respond, sighting + memory submission

## Screens / Widgets
- ✅ **Home / Alert feed** — refactored to provider: infinite scroll, live "Live/Offline" indicator, pull-to-refresh, end-of-feed states
- ✅ `area_alert_card.dart` — GPS-radius alert card
- ✅ **Confirm sighting** ("I See Them") — photo, who/gender/behaviour, confidence slider, location share, notes
- ✅ **Witness memory** ("I Was There") — time picker, direction selector, notes
- ✅ Wired into `main.dart` composition root + providers

## Verification
- ✅ `flutter analyze` — No issues found
- ✅ Tests — 7 passing (models, distance, **alert card widget tests**)
- ⛔ APK build — still blocked by disk space (see Phase 1 note)

## Phase 2 deferred (need backend/Firebase)
- ⬜ FCM real integration (`firebase_messaging` + `google-services.json`)
- ⬜ Backend: BLE witness matching, PostGIS radius cascade, Socket.io server
  (these are backend-team items; mobile is ready to consume them — flip
  `mockMode: false` on `AlertsRepository` / `WebSocketService`)

---

# Phase 3 — Map + Sightings + Family (Week 3)

## Sightings (proactive)
- ✅ `sighting_repository.dart` — submit + recent (mock match confidence)
- ✅ `sighting_provider.dart`
- ✅ **Report Sighting screen** — photo, quick person-type selector, behaviour
  emoji chips, age/gender, location auto-detect, notes, "I'll guide to help"
  live-location toggle, success sheet with match likelihood

## Active Alerts Map (pure-Dart interactive map)
- ✅ `map_marker.dart` (domain), `map_provider.dart` (markers, layers, user loc)
- ✅ **Active Alerts Map screen** — pan/zoom (InteractiveViewer), **pulsing
  cascade rings**, missing (red) / sighting (amber) / CCTV (indigo) markers,
  **layer toggles** + density heatmap, **user blue dot**, tap → **detail sheet**,
  recenter + "Report sighting" FABs, stylised backdrop (grid + river)
- ✅ `detail_sheet.dart` — marker detail bottom sheet
- ✅ Wired as the Map tab in the nav shell (replaces placeholder)
- ℹ️ Drop-in swap to `google_maps_flutter` once an API key is configured

## Family Group Management
- ✅ `family_repository.dart` (prefs-persisted), `family_provider.dart` (max 10)
- ✅ **Family Group screen** — list, empty state, add/edit/delete, **quick report**
- ✅ **Add/Edit Member screen** — photo, name, age, gender, phone
- ✅ `family_member_card.dart`
- ✅ Quick report pre-fills `ReportFormProvider` → opens report form seeded
- ✅ Profile links: Family group + Report a sighting

## Verification
- ✅ `flutter analyze` — No issues found
- ✅ Tests — 7 passing
- ⛔ APK build — still blocked by disk space

## Phase 3 out of mobile scope (separate apps)
- ⬜ Authority Dashboard (React) — `web/` project, not `mobile_app`
- ⬜ Attribute matching engine — backend; mobile already consumes
  `sighting.matcherConfidence`

---

## Notes / follow-ups
- **BLE advertising**: `flutter_blue_plus` cannot act as a peripheral. To broadcast the
  rotating UUID (and to run the Day-7 Kotlin foreground service), integrate
  `flutter_ble_peripheral`. Scanning is fully functional now.
- **Mock mode**: `AuthRepository` and `ReportRepository` default to `mockMode: true`
  so onboarding + reporting run end-to-end without the backend. Flip to `false` and set
  `ApiConstants.baseUrl` when the API is live.
- **Maps**: Phase 3 — add `google_maps_flutter` + API key.
