# Phase 1: BLE Foundation + Core Reporting (Week 1)

**Goal**: Get BLE scanning/advertising working locally, establish data pipeline to backend, enable first missing person report with witness alert mechanism.

**Duration**: 7 days (Days 1-7)

---

## Features by Day

### Day 1-2: Project Setup & Architecture

| Task | Owner | Est. Hours | Status |
|------|-------|-----------|--------|
| Flutter project initialization | Mobile | 4 | ⬜ |
| Folder structure & pubspec.yaml | Mobile | 3 | ⬜ |
| Material Design 3 theme setup | Mobile | 3 | ⬜ |
| Git setup & branching strategy | Team | 2 | ⬜ |
| **Total** | | **12** | |

**Deliverable**: 
- ✅ Flutter project builds
- ✅ Theme applied to entire app
- ✅ Folder structure matches architecture spec

**Files to Create**:
- `pubspec.yaml` (dependencies locked)
- `lib/core/theme/app_theme.dart`
- `lib/main.dart` (basic setup)
- `lib/core/constants/` (theme, strings, durations)

---

### Day 1-2: Dart Data Models

| Task | Owner | Est. Hours | Status |
|------|-------|-----------|--------|
| User entity & model | Mobile | 2 | ⬜ |
| BLE Encounter entity & model | Mobile | 2 | ⬜ |
| Missing Report entity & model | Mobile | 3 | ⬜ |
| Clothing & Witness Alert models | Mobile | 2 | ⬜ |
| Sighting & Family Group models | Mobile | 2 | ⬜ |
| Enums (status, alert types) | Mobile | 1 | ⬜ |
| **Total** | | **12** | |

**Deliverable**:
- ✅ All models serialize to/from JSON
- ✅ Equality operators implemented
- ✅ Unit tests for serialization (>80% coverage)

**Files to Create**:
- `lib/models/user.dart`
- `lib/models/ble_encounter.dart`
- `lib/models/missing_report.dart`
- `lib/models/witness_alert.dart`
- `lib/models/sighting.dart`
- `lib/models/family_group.dart`
- `lib/models/enums.dart`

**Tests**:
- `test/models/user_test.dart`
- `test/models/missing_report_test.dart`

---

### Day 3-4: BLE Module (Scanning & Advertising)

| Task | Owner | Est. Hours | Status |
|------|-------|-----------|--------|
| BLE permissions handling | Mobile | 2 | ⬜ |
| BLE scanner implementation | Mobile | 4 | ⬜ |
| BLE advertiser implementation | Mobile | 3 | ⬜ |
| RSSI to distance conversion | Mobile | 2 | ⬜ |
| Error handling & retry logic | Mobile | 2 | ⬜ |
| **Total** | | **13** | |

**Deliverable**:
- ✅ BLE scanning finds other devices
- ✅ BLE advertising broadcasts device UUID
- ✅ RSSI → distance conversion accurate
- ✅ Handles Android/iOS permissions
- ✅ Works in foreground on both platforms

**Files to Create**:
- `lib/services/ble_service.dart`
- `lib/features/ble/data/datasources/ble_datasource.dart`
- `lib/features/ble/domain/repositories/ble_repository.dart`
- `lib/core/utils/distance_calculator.dart`

**Tests**:
- `test/services/ble_service_test.dart`
- `test/core/utils/distance_calculator_test.dart`

**Manual Testing**:
- Scan with 2 devices simultaneously
- Verify encounters logged with timestamp & RSSI
- Test on actual Android device (not emulator for best BLE support)

---

### Day 3-4: UUID Rotation System

| Task | Owner | Est. Hours | Status |
|------|-------|-----------|--------|
| Base UUID generation & storage | Mobile | 2 | ⬜ |
| Rotating UUID logic | Mobile | 2 | ⬜ |
| 15-min rotation scheduling | Mobile | 2 | ⬜ |
| Grace period handling | Mobile | 1 | ⬜ |
| **Total** | | **7** | |

**Deliverable**:
- ✅ UUID rotates every 15 minutes
- ✅ Previous UUID kept for 5-min grace period
- ✅ No gaps in advertised UUID
- ✅ UUID registry prepared for upload

**Files to Create**:
- `lib/services/uuid_rotation_service.dart`
- `lib/features/ble/data/datasources/uuid_datasource.dart`

---

### Day 4-5: Local SQLite Database

| Task | Owner | Est. Hours | Status |
|------|-------|-----------|--------|
| SQLite schema definition | Mobile | 2 | ⬜ |
| Database initialization | Mobile | 1 | ⬜ |
| Encounter repository CRUD | Mobile | 3 | ⬜ |
| UUID registry table & methods | Mobile | 2 | ⬜ |
| Automatic cleanup (2-hour window) | Mobile | 2 | ⬜ |
| **Total** | | **10** | |

**Deliverable**:
- ✅ Encounters stored locally with indices
- ✅ 2-hour rolling window maintained
- ✅ Query methods: getEncountersInWindow, getUnsyncedEncounters
- ✅ UUID history stored for upload
- ✅ Cleanup job runs every 10 minutes

**Files to Create**:
- `lib/services/database_service.dart`
- `lib/features/ble/data/repositories/encounter_repository.dart`

**Tests**:
- `test/repositories/encounter_repository_test.dart` (integration test)

---

### Day 4-5: GPS & Location Service

| Task | Owner | Est. Hours | Status |
|------|-------|-----------|--------|
| Permission requests (Android/iOS) | Mobile | 2 | ⬜ |
| Background location tracking | Mobile | 3 | ⬜ |
| Location caching in SharedPreferences | Mobile | 1 | ⬜ |
| **Total** | | **6** | |

**Deliverable**:
- ✅ Current location available for report
- ✅ Permissions flow works on both platforms
- ✅ Last known location cached on app start
- ✅ Updates every 30s on >10m change

**Files to Create**:
- `lib/services/location_service.dart`
- `lib/features/location/domain/repositories/location_repository.dart`

---

### Day 5-6: Backend API Integration

| Task | Owner | Est. Hours | Status |
|------|-------|-----------|--------|
| HTTP client setup (Dio) | Mobile | 2 | ⬜ |
| Auth endpoints (register, verify OTP) | Mobile | 3 | ⬜ |
| User endpoints (profile, FCM token) | Mobile | 2 | ⬜ |
| Report submission endpoint | Mobile | 3 | ⬜ |
| Error handling & interceptors | Mobile | 2 | ⬜ |
| **Total** | | **12** | |

**Deliverable**:
- ✅ API service ready for all endpoints
- ✅ Auth tokens stored in secure storage
- ✅ Automatic token refresh on 401
- ✅ Exponential backoff for 5xx errors
- ✅ All requests logged (dev only)

**Files to Create**:
- `lib/services/api_service.dart`
- `lib/services/storage_service.dart`
- `lib/features/auth/data/datasources/auth_remote_datasource.dart`
- `lib/features/auth/data/repositories/auth_repository.dart`

---

### Day 5-6: Onboarding Screen

| Task | Owner | Est. Hours | Status |
|------|-------|-----------|--------|
| Onboarding UI layout (Material 3) | Mobile | 3 | ⬜ |
| Permission request cards | Mobile | 2 | ⬜ |
| Language selector | Mobile | 2 | ⬜ |
| Phone input form | Mobile | 2 | ⬜ |
| OTP input & verification | Mobile | 3 | ⬜ |
| Navigation to Home screen | Mobile | 1 | ⬜ |
| **Total** | | **13** | |

**Deliverable**:
- ✅ All permission flows work
- ✅ Phone validation (Indian format)
- ✅ OTP countdown timer
- ✅ User account created on backend
- ✅ Auth token securely stored

**Files to Create**:
- `lib/features/auth/presentation/screens/onboarding_screen.dart`
- `lib/features/auth/presentation/screens/language_selection_screen.dart`
- `lib/features/auth/presentation/screens/phone_input_screen.dart`
- `lib/features/auth/presentation/screens/otp_verification_screen.dart`

**UI Tests**:
- Form validation
- Permission requests
- OTP input (auto-submit on 6 digits)

---

### Day 6-7: Report Missing Person Screen

| Task | Owner | Est. Hours | Status |
|------|-------|-----------|--------|
| Report form layout (Material 3) | Mobile | 3 | ⬜ |
| Photo capture & selection | Mobile | 2 | ⬜ |
| Clothing description dropdowns | Mobile | 2 | ⬜ |
| Location picker (current or map) | Mobile | 2 | ⬜ |
| Time picker (quick buttons + custom) | Mobile | 2 | ⬜ |
| Form state management (Riverpod) | Mobile | 3 | ⬜ |
| Report submission to backend | Mobile | 2 | ⬜ |
| Error handling & validation | Mobile | 2 | ⬜ |
| **Total** | | **18** | |

**Deliverable**:
- ✅ All form fields collect required data
- ✅ Photo upload to cloud storage works
- ✅ BLE encounter log attached to report
- ✅ Success message shows witness count
- ✅ Form validates before submission

**Files to Create**:
- `lib/features/report/presentation/screens/report_missing_person_screen.dart`
- `lib/features/report/presentation/widgets/photo_picker_widget.dart`
- `lib/features/report/presentation/widgets/clothing_selector_widget.dart`
- `lib/features/report/presentation/widgets/location_picker_widget.dart`
- `lib/features/report/presentation/providers/report_form_provider.dart`

**Manual Testing**:
- Report submission with all fields
- Photo upload and compression
- Form reset after successful submission

---

### Day 6-7: Backend API & PostgreSQL

| Task | Owner | Est. Hours | Status |
|------|-------|-----------|--------|
| PostgreSQL schema migration | Backend | 2 | ⬜ |
| Auth endpoints (Node.js) | Backend | 4 | ⬜ |
| Report submission endpoint | Backend | 4 | ⬜ |
| BLE witness matching logic | Backend | 4 | ⬜ |
| Error handling & validation | Backend | 2 | ⬜ |
| **Total** | | **16** | |

**Deliverable**:
- ✅ PostgreSQL schema deployed
- ✅ Auth endpoints: register, verify-otp, refresh
- ✅ Report endpoint accepts form + BLE log
- ✅ Witness matching implemented
- ✅ All errors return proper status codes

**Backend Files**:
- `db/migrations/001_initial_schema.sql`
- `routes/auth.js`
- `routes/reports.js`
- `services/witness_matcher.js`

---

### Day 7: Android Foreground Service

| Task | Owner | Est. Hours | Status |
|------|-------|-----------|--------|
| Kotlin service implementation | Mobile | 4 | ⬜ |
| Persistent notification | Mobile | 2 | ⬜ |
| Background BLE scanning | Mobile | 2 | ⬜ |
| AndroidManifest.xml config | Mobile | 1 | ⬜ |
| **Total** | | **9** | |

**Deliverable**:
- ✅ BLE scanning continues when app backgrounded
- ✅ Persistent notification always visible
- ✅ Service restarts if killed (sticky)
- ✅ Works on Android 8+ (foreground service)

**Files to Create**:
- `android/app/src/main/kotlin/com/kumbhraksha/BleService.kt`
- Update `AndroidManifest.xml`

---

### Day 7: Integration Testing & Manual QA

| Task | Owner | Est. Hours | Status |
|------|-------|-----------|--------|
| Unit tests (models, utils) | Mobile | 4 | ⬜ |
| Integration tests (DB, API) | Mobile | 4 | ⬜ |
| Manual end-to-end test | Mobile/Backend | 3 | ⬜ |
| Bug fixes & polish | Mobile | 3 | ⬜ |
| **Total** | | **14** | |

**Deliverable**:
- ✅ Unit test coverage: >80%
- ✅ All critical flows have integration tests
- ✅ Manual test: Register → Report → Receive witness alert
- ✅ App builds on Android (>=API 26)

---

## Phase 1 Completion Checklist

### Frontend (Flutter)
- [ ] Project initialized with Material Design 3 theme
- [ ] All data models created with serialization
- [ ] BLE scanning & advertising working (foreground)
- [ ] UUID rotation system functioning
- [ ] SQLite database with indices
- [ ] GPS location tracking
- [ ] Onboarding flow complete (permissions + auth)
- [ ] Report missing person form complete
- [ ] Android foreground service running BLE (background)
- [ ] Photo upload to cloud storage
- [ ] Forms validate correctly
- [ ] App builds & runs on Android

### Backend (Node.js/Express)
- [ ] PostgreSQL schema deployed
- [ ] Auth endpoints working
- [ ] Report submission endpoint working
- [ ] BLE witness matching logic
- [ ] Error handling & logging
- [ ] Database indices created

### Testing
- [ ] Unit test coverage: ≥80%
- [ ] Integration tests pass
- [ ] Manual E2E test: Register → Report → Witness match
- [ ] App builds on real Android device
- [ ] BLE scanning verified on device (not emulator)

### Documentation
- [ ] API documentation (endpoints, payloads)
- [ ] Architecture overview
- [ ] Setup instructions (Flutter project)
- [ ] Backend deployment guide

---

## Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| BLE devices discovered | 2+ test devices | ⬜ |
| Report submission success rate | 100% | ⬜ |
| Witness matching accuracy | Match UUIDs correctly | ⬜ |
| App startup time | <3 seconds | ⬜ |
| Database query latency | <100ms | ⬜ |
| API response time (p95) | <500ms | ⬜ |

---

## Risk Mitigation

| Risk | Mitigation | Status |
|------|-----------|--------|
| BLE not working on emulator | Test on real Android device from Day 3 | ⬜ |
| iOS BLE limitations | Focus on Android MVP; iOS in Phase 4 | ⬜ |
| Photo upload failure | Use Cloudinary (simple SDK integration) | ⬜ |
| Permission flow confusing | Show clear "why we need this" UI | ⬜ |
| Database slow with many encounters | Add indices; implement cleanup job | ⬜ |
| Backend not ready for mobile | Mock API responses in Flutter for testing | ⬜ |

---

## Communication & Handoff

### Daily Stand-ups (15 min, 9 AM)
- Mobile team: BLE progress, blockers
- Backend team: API readiness, schema updates
- Demo: Latest working features

### Handoff Points
- **Day 3 end**: Backend confirms API contract with Mobile
- **Day 5 end**: Backend API endpoints ready for integration
- **Day 7 end**: Full end-to-end test (Register → Report → Alert)

### Slack Channels
- `#mobile-dev` — Flutter issues
- `#backend-dev` — Node.js issues
- `#ble-testing` — BLE device issues
- `#general` — Daily standups

---

**Last Updated**: 2026-06-27  
**Version**: 1.0
