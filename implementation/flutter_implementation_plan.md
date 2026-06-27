# KumbhRaksha — Flutter App Implementation Plan (Detailed)

> **Target**: Build a complete Flutter app for iOS/Android with BLE proximity witness alerts for missing person search at Kumbh Mela.
> **Duration**: 4 weeks (28 days)
> **Stack**: Flutter/Dart, Firebase (FCM), PostgreSQL + PostGIS, React Dashboard

---

## Overview: 4 Implementation Phases

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: BLE Foundation + Core Reporting (Week 1)          │
│ Days 1-7 | Core infrastructure + first report flow         │
├─────────────────────────────────────────────────────────────┤
│ PHASE 2: Alert System + Feed (Week 2)                      │
│ Days 8-14 | Dual alerts (BLE + GPS) + home feed            │
├─────────────────────────────────────────────────────────────┤
│ PHASE 3: Sightings + Map + Dashboard (Week 3)              │
│ Days 15-21 | Full citizen + authority interfaces           │
├─────────────────────────────────────────────────────────────┤
│ PHASE 4: Polish + Scale (Week 4)                           │
│ Days 22-28 | Performance, iOS optimization, load testing   │
└─────────────────────────────────────────────────────────────┘
```

---

# PHASE 1: BLE Foundation + Core Reporting (Week 1)

**Goal**: Get BLE scanning/advertising working locally, establish data pipeline to backend, enable first missing person report with witness alert mechanism.

## 1.1 Project Setup & Architecture

### Task 1.1.1: Flutter Project Initialization

**Objective**: Create a production-ready Flutter project structure

- [ ] Initialize Flutter project: `flutter create kumbhraksha --org com.kumbhraksha`
- [ ] Set up folder structure:
  - [ ] `lib/core/` — constants, utilities, theme, error handling
  - [ ] `lib/services/` — BLE, GPS, SQLite, API, FCM services
  - [ ] `lib/screens/` — all UI screens (onboarding, home, report, map, etc.)
  - [ ] `lib/models/` — Dart data models (User, Report, Encounter, Alert, etc.)
  - [ ] `lib/widgets/` — reusable components
  - [ ] `lib/providers/` — state management (Riverpod or Provider)
  - [ ] `assets/` — images, icons, animations
- [ ] Configure pubspec.yaml with dependencies:
  - [ ] `flutter_blue_plus` or `flutter_ble_lib` — BLE operations
  - [ ] `sqflite` — local SQLite database
  - [ ] `dio` — HTTP client for API calls
  - [ ] `riverpod` or `provider` — state management
  - [ ] `geolocator` — GPS/location services
  - [ ] `firebase_messaging` — FCM push notifications
  - [ ] `google_maps_flutter` — map display
  - [ ] `camera` — photo capture for sightings
  - [ ] `image_picker` — photo gallery access
  - [ ] `intl` — localization (Hindi, English, regional languages)
  - [ ] `hive` or `shared_preferences` — simple KV storage for auth tokens
- [ ] Set up git repository and version control
- [ ] Create README with setup instructions

**Estimated Time**: 1 day

---

### Task 1.1.2: Dart Data Models

**Objective**: Define all core data classes that will be used throughout the app

Create `lib/models/`:

- [ ] **User Model**
  - [ ] `user_id` (UUID)
  - [ ] `phone_number` (String, unique)
  - [ ] `language_preference` (String: 'hindi', 'english', etc.)
  - [ ] `fcm_token` (String)
  - [ ] `ble_rotating_uuid` (String, changes every 15 min)
  - [ ] `is_onboarded` (bool)
  - [ ] `created_at` (DateTime)
  - [ ] Serialization methods (toJson, fromJson)

- [ ] **BLE Encounter Model**
  - [ ] `id` (UUID)
  - [ ] `encountered_uuid` (String)
  - [ ] `rssi` (int) — signal strength
  - [ ] `timestamp` (DateTime)
  - [ ] `my_location` (LatLng or [lat, lng])
  - [ ] `distance_estimate` (double) — calculated from RSSI
  - [ ] Serialization methods

- [ ] **Missing Report Model**
  - [ ] `id` (UUID)
  - [ ] `reporter_id` (UUID)
  - [ ] `person_name` (String)
  - [ ] `person_age` (int)
  - [ ] `person_gender` (String)
  - [ ] `photo_url` (String?)
  - [ ] Clothing (separate sub-object):
    - [ ] `top_color` (String)
    - [ ] `top_type` (String)
    - [ ] `bottom_color` (String)
    - [ ] `bottom_type` (String)
    - [ ] `footwear` (String)
    - [ ] `extras` (String?)
  - [ ] `build` (String)
  - [ ] `distinguishing_features` (String?)
  - [ ] `language_spoken` (String)
  - [ ] `medical_conditions` (String?)
  - [ ] `last_seen_location` (LatLng)
  - [ ] `last_seen_time` (DateTime)
  - [ ] `reported_at` (DateTime)
  - [ ] `status` (String: 'reported', 'escalated', 'resolved')
  - [ ] `cascade_level` (int, 1-5)
  - [ ] `alert_radius_meters` (int)
  - [ ] Serialization methods

- [ ] **Witness Alert Model**
  - [ ] `id` (UUID)
  - [ ] `missing_report_id` (UUID)
  - [ ] `witness_user_id` (UUID)
  - [ ] `alert_type` (String: 'ble_witness', 'gps_radius')
  - [ ] `alert_text` (String)
  - [ ] `created_at` (DateTime)
  - [ ] `user_responded` (bool)
  - [ ] `response_text` (String?)
  - [ ] Serialization methods

- [ ] **Sighting Model**
  - [ ] `id` (UUID)
  - [ ] `spotter_user_id` (UUID)
  - [ ] `missing_report_id` (UUID?) — may be null if reported before person is missing
  - [ ] `person_type` (String: 'child', 'adult', 'elderly')
  - [ ] `approx_age` (int?)
  - [ ] `gender` (String)
  - [ ] `behavior` (String: 'crying', 'confused', 'standing_alone', 'wandering')
  - [ ] `photo_url` (String)
  - [ ] `location` (LatLng)
  - [ ] `notes` (String?)
  - [ ] `created_at` (DateTime)
  - [ ] `matcher_confidence` (double, 0-1) — how well it matches reports
  - [ ] Serialization methods

- [ ] **Family Group Model**
  - [ ] `id` (UUID)
  - [ ] `owner_user_id` (UUID)
  - [ ] `members` (List<FamilyMember>)
  - [ ] `group_name` (String?)
  - [ ] `created_at` (DateTime)

- [ ] **Family Member Model**
  - [ ] `id` (UUID)
  - [ ] `name` (String)
  - [ ] `age` (int)
  - [ ] `relation_to_owner` (String: 'self', 'parent', 'child', 'spouse', etc.)
  - [ ] `has_app` (bool) — whether they have the app installed
  - [ ] `photo_url` (String?)
  - [ ] `user_id` (UUID?) — if they have the app
  - [ ] Clothing/appearance fields (for pre-filling report)

**Estimated Time**: 1.5 days

---

## 1.2 BLE Module (Scanning & Advertising)

### Task 1.2.1: BLE Service Setup

**Objective**: Implement core BLE scanning and advertising with local logging

Create `lib/services/ble_service.dart`:

- [ ] **BLE Initialization**
  - [ ] Check platform (iOS/Android)
  - [ ] Request BLE permissions (iOS CoreBluetooth, Android ACCESS_FINE_LOCATION)
  - [ ] Initialize BLE library (flutter_blue_plus or flutter_ble_lib)
  - [ ] Set Kumbh Raksha service UUID constant (e.g., "1234abcd-e567-89ab-cdef-0123456789ab")

- [ ] **BLE Advertiser**
  - [ ] Start BLE advertising with:
    - [ ] Service UUID: Kumbh Raksha UUID
    - [ ] Rotating device ID (changes every 15 minutes)
    - [ ] Custom payload (optional: version, app state)
  - [ ] Advertise in background (Android foreground service, iOS background mode)
  - [ ] Interval: 4 seconds (balance between discovery and battery)

- [ ] **BLE Scanner**
  - [ ] Start BLE scanning filtered by Kumbh Raksha service UUID
  - [ ] Use LowPower scan mode
  - [ ] For each discovered device:
    - [ ] Extract UUID
    - [ ] Extract RSSI (signal strength)
    - [ ] Timestamp the encounter
    - [ ] Log to local SQLite (via EncounterRepository)
  - [ ] Retain a rolling 2-hour window of encounters

- [ ] **RSSI to Distance Conversion**
  - [ ] Implement calibration formula: distance = 10^((txPower - rssi) / (10 * n))
  - [ ] Use default txPower = -59 dBm
  - [ ] Use path loss exponent n = 2.0
  - [ ] Add method: `double estimateDistance(int rssi)`

- [ ] **Error Handling**
  - [ ] Handle BLE not available
  - [ ] Handle permission denials (show permission request UI)
  - [ ] Handle scan timeout/failures gracefully
  - [ ] Retry logic with exponential backoff

**Estimated Time**: 2 days

---

### Task 1.2.2: BLE Rotating UUID System

**Objective**: Implement privacy-preserving rotating device identifiers

Create `lib/services/uuid_rotation_service.dart`:

- [ ] **UUID Generation**
  - [ ] Generate a base device UUID on app install (stored in secure storage)
  - [ ] Create rotating UUIDs: hash(base_uuid + date_part + time_part)
  - [ ] Rotation interval: 15 minutes
  - [ ] Store current + next UUID in memory

- [ ] **UUID Rotation Logic**
  - [ ] Schedule rotation every 15 minutes
  - [ ] When time reaches rotation point:
    - [ ] Current becomes Previous
    - [ ] Next becomes Current
    - [ ] Generate new Next
    - [ ] Update BLE advertiser with new UUID
  - [ ] Keep previous UUID for a grace period (5 min) to handle lag

- [ ] **UUID Registry Upload** (on report only)
  - [ ] Prepare list of all UUIDs used in last 30 minutes
  - [ ] Include: `uuid`, `valid_from`, `valid_until`, `fcm_token`
  - [ ] Encrypt before sending to server
  - [ ] Server stores to `ble_uuid_registry` table

**Estimated Time**: 1 day

---

## 1.3 Local Database (SQLite)

### Task 1.3.1: SQLite Schema & Repository

**Objective**: Create local persistent storage for BLE encounters

Create `lib/repositories/encounter_repository.dart` and database helper:

- [ ] **SQLite Database Setup**
  - [ ] Initialize sqflite database: `kumbhraksha.db`
  - [ ] Version: 1 (for migrations)
  - [ ] Create tables:

    ```sql
    CREATE TABLE encounters (
      id TEXT PRIMARY KEY,
      encountered_uuid TEXT NOT NULL,
      rssi INTEGER NOT NULL,
      timestamp DATETIME NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      distance_estimate REAL,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE INDEX idx_timestamp ON encounters(timestamp);
    CREATE INDEX idx_uuid ON encounters(encountered_uuid);
    ```

  - [ ] Create table for BLE UUID rotation history:
    ```sql
    CREATE TABLE my_ble_uuids (
      id INTEGER PRIMARY KEY,
      rotating_uuid TEXT NOT NULL,
      valid_from DATETIME NOT NULL,
      valid_until DATETIME NOT NULL,
      is_current BOOLEAN DEFAULT FALSE
    );
    ```

  - [ ] Create table for user data (cached):
    ```sql
    CREATE TABLE user_cache (
      user_id TEXT PRIMARY KEY,
      phone_number TEXT,
      fcm_token TEXT,
      language_preference TEXT,
      is_onboarded BOOLEAN,
      created_at DATETIME
    );
    ```

- [ ] **EncounterRepository Methods**
  - [ ] `addEncounter(Encounter)` — insert new BLE encounter
  - [ ] `getEncountersInWindow(minutesBack)` — get last N minutes of encounters
  - [ ] `deleteOldEncounters(olderThan)` — clean up 2-hour-old data
  - [ ] `getUnsyncedEncounters()` — for upload on report
  - [ ] `markEncountersAsSynced(ids)` — after successful upload
  - [ ] `getPendingEncountersCount()` — for UI indicator

- [ ] **Automatic Cleanup**
  - [ ] Every 10 minutes: delete encounters older than 2 hours
  - [ ] Logging: track cleanup events

**Estimated Time**: 1.5 days

---

## 1.4 GPS & Location Service

### Task 1.4.1: Location Tracking Service

**Objective**: Capture and store user location for alerts and reports

Create `lib/services/location_service.dart`:

- [ ] **Location Permissions**
  - [ ] Request `ACCESS_FINE_LOCATION` (Android) / Location Always (iOS)
  - [ ] Handle permission denial gracefully
  - [ ] Show educational UI: "We need your location to alert you about nearby missing persons"

- [ ] **Background Location Tracking**
  - [ ] Use geolocator package
  - [ ] Mode: Significant change (not continuous polling)
  - [ ] Minimum accuracy: 10 meters
  - [ ] Update frequency: every 30 seconds when location changes by >10m
  - [ ] Store location in memory (for current radius alerts)

- [ ] **Location for Reports**
  - [ ] Provide current location at time of report
  - [ ] Allow manual pin on map instead
  - [ ] Store as [latitude, longitude, timestamp]

- [ ] **Location Caching**
  - [ ] Cache last known location in SharedPreferences
  - [ ] Update on every location change
  - [ ] Retrieve on app start (for immediate use)

**Estimated Time**: 1 day

---

## 1.5 Backend API Integration (Phase 1)

### Task 1.5.1: API Client Setup

**Objective**: Build robust HTTP client for all backend communication

Create `lib/services/api_service.dart`:

- [ ] **HTTP Client Configuration**
  - [ ] Use Dio package
  - [ ] Base URL: configurable (dev/staging/prod)
  - [ ] Timeouts: 30s for regular, 60s for uploads
  - [ ] Interceptors:
    - [ ] Add auth token to all requests
    - [ ] Log all requests/responses (only in dev)
    - [ ] Handle 401 (expired token) → refresh & retry
    - [ ] Exponential backoff for 5xx errors

- [ ] **Authentication Endpoints**
  - [ ] `POST /auth/register` — phone number + language
    - [ ] Input: phone, language_preference
    - [ ] Output: user_id, fcm_token, auth_token
    - [ ] Store token in secure storage
  - [ ] `POST /auth/verify-otp` — OTP verification
    - [ ] Input: phone, otp
    - [ ] Output: verified token
  - [ ] `POST /auth/refresh-token` — refresh expired auth

- [ ] **User Endpoints (Phase 1)**
  - [ ] `GET /user/profile` — get current user data
  - [ ] `POST /user/update-fcm-token` — update FCM token
  - [ ] `POST /user/update-uuid-registry` — upload rotating UUIDs

- [ ] **Report Submission Endpoint**
  - [ ] `POST /reports/missing` — submit missing person report
    - [ ] Input: full report object + BLE encounter log
    - [ ] Multipart: photo file + JSON data
    - [ ] Output: report_id, witness count
  - [ ] Response handling: success, validation errors, network errors

**Estimated Time**: 1.5 days

---

## 1.6 Backend: PostgreSQL Schema & API

### Task 1.6.1: Database Schema (Backend)

**Objective**: Design and deploy PostgreSQL schema for production data

Create migrations for backend:

- [ ] **Core Tables**

  ```sql
  CREATE TABLE app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    language_preference VARCHAR(10) DEFAULT 'hindi',
    fcm_token TEXT,
    is_onboarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE ble_uuid_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    rotating_uuid VARCHAR(36) NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    fcm_token TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE missing_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES app_users(id),
    person_name VARCHAR(100) NOT NULL,
    person_age INTEGER,
    person_gender VARCHAR(10),
    photo_url TEXT,
    -- Structured clothing
    clothing_top_color VARCHAR(30),
    clothing_top_type VARCHAR(30),
    clothing_bottom_color VARCHAR(30),
    clothing_bottom_type VARCHAR(30),
    clothing_footwear VARCHAR(30),
    clothing_extras TEXT,
    -- Physical description
    build VARCHAR(20),
    distinguishing_features TEXT,
    language_spoken VARCHAR(30),
    medical_conditions TEXT,
    -- Location & time
    last_seen_location GEOMETRY(Point, 4326),
    last_seen_time TIMESTAMP NOT NULL,
    reported_at TIMESTAMP DEFAULT NOW(),
    -- Status tracking
    status VARCHAR(20) DEFAULT 'reported',
    cascade_level INTEGER DEFAULT 1,
    alert_radius_meters INTEGER DEFAULT 500,
    assigned_officer_id UUID,
    resolved_at TIMESTAMP,
    resolution_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE ble_encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES app_users(id),
    missing_report_id UUID REFERENCES missing_reports(id),
    encountered_uuid VARCHAR(36) NOT NULL,
    rssi INTEGER,
    encounter_time TIMESTAMP NOT NULL,
    encounter_location GEOMETRY(Point, 4326),
    distance_estimate REAL,
    witness_user_id UUID REFERENCES app_users(id),
    alert_sent BOOLEAN DEFAULT FALSE,
    witness_responded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE witness_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    missing_report_id UUID REFERENCES missing_reports(id),
    witness_user_id UUID REFERENCES app_users(id),
    alert_type VARCHAR(20), -- 'ble_witness', 'gps_radius'
    alert_text TEXT,
    notified_at TIMESTAMP,
    user_responded BOOLEAN DEFAULT FALSE,
    response_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- Indexes for performance
  CREATE INDEX idx_missing_reports_status ON missing_reports(status);
  CREATE INDEX idx_missing_reports_location ON missing_reports USING GIST(last_seen_location);
  CREATE INDEX idx_ble_encounters_report ON ble_encounters(missing_report_id);
  CREATE INDEX idx_witness_alerts_report ON witness_alerts(missing_report_id);
  CREATE INDEX idx_ble_uuid_registry_uuid ON ble_uuid_registry(rotating_uuid);
  ```

- [ ] Run migrations in target database (dev first, then staging)
- [ ] Verify indexes are created
- [ ] Set up PostGIS extension if not already present

**Estimated Time**: 1 day

---

### Task 1.6.2: Backend API Endpoints (Node.js/Express, Phase 1)

**Objective**: Build API endpoints for registration, reporting, and witness matching

Create backend service:

- [ ] **Authentication Endpoints**
  - [ ] `POST /api/auth/register`
    - [ ] Validate phone number (Indian format)
    - [ ] Generate OTP, send via SMS (MSG91)
    - [ ] Return temp token for OTP verification
  - [ ] `POST /api/auth/verify-otp`
    - [ ] Verify OTP against temp token
    - [ ] Create/update user in DB
    - [ ] Return auth JWT token + user_id
  - [ ] `POST /api/auth/refresh`
    - [ ] Validate refresh token
    - [ ] Issue new JWT

- [ ] **Report Submission**
  - [ ] `POST /api/reports/missing` (authenticated)
    - [ ] Receive multipart form: JSON report + photo file + BLE encounters
    - [ ] Validate required fields
    - [ ] Upload photo to S3/Cloudinary
    - [ ] Save report to `missing_reports` table
    - [ ] Process BLE encounters:
      - [ ] For each encounter UUID, query `ble_uuid_registry`
      - [ ] Find which user owned that UUID at that time
      - [ ] Create entries in `witness_alerts` table
      - [ ] Return list of matched witnesses
    - [ ] Trigger witness alert notifications (Phase 2)
    - [ ] Return: `{ reportId, witnessCount, alerts_sent }`

- [ ] **User Profile**
  - [ ] `GET /api/user/profile` (authenticated)
    - [ ] Return current user data
  - [ ] `POST /api/user/update-fcm`
    - [ ] Update FCM token for this user
  - [ ] `POST /api/user/register-uuids` (authenticated)
    - [ ] Receive array of BLE UUID registrations
    - [ ] Store to `ble_uuid_registry` table
    - [ ] Each entry valid for 15 minutes

- [ ] **Error Handling**
  - [ ] Standardized error responses: `{ code, message, details }`
  - [ ] HTTP status codes: 400 (validation), 401 (auth), 500 (server)
  - [ ] Logging: all errors logged to server (for debugging)

**Estimated Time**: 2 days

---

## 1.7 Android Foreground Service

### Task 1.7.1: Foreground Service for Background BLE

**Objective**: Keep BLE scanning alive even when app is backgrounded

Create `android/app/src/main/kotlin/com/kumbhraksha/BleService.kt`:

- [ ] **Service Implementation**
  - [ ] Extend `Service` class
  - [ ] Override `onStartCommand()` — return `START_STICKY`
  - [ ] Create persistent notification: "🛡️ KumbhRaksha is protecting pilgrims"
  - [ ] Start foreground service: `startForeground(NOTIFICATION_ID, notification)`
  - [ ] Register in AndroidManifest.xml with:
    - [ ] `android.permission.BLUETOOTH_SCAN`
    - [ ] `android.permission.ACCESS_FINE_LOCATION`
    - [ ] `android.permission.FOREGROUND_SERVICE`

- [ ] **BLE Operation in Service**
  - [ ] Initialize BLE scanner (reuse BLE service logic)
  - [ ] Keep scanner running indefinitely
  - [ ] Log encounters to local SQLite
  - [ ] Handle service destruction (clean shutdown)

- [ ] **Service Lifecycle**
  - [ ] Start on app launch (from MainActivity)
  - [ ] Restart if killed (sticky service)
  - [ ] Stop on user logout
  - [ ] Graceful shutdown on app uninstall

- [ ] **Battery & Performance**
  - [ ] Use WakeLock sparingly (only for critical operations)
  - [ ] Document battery impact (expect ~3-5% per day)

**Estimated Time**: 1.5 days

---

## 1.8 Onboarding Screen

### Task 1.8.1: Onboarding UI & Flow

**Objective**: First-launch experience with permissions and language selection

Create `lib/screens/onboarding_screen.dart`:

- [ ] **Screen Layout**
  - [ ] Logo + title: "🙏 KumbhRaksha — Protecting Every Pilgrim"
  - [ ] Explanation text (2-3 sentences about purpose)
  - [ ] Permission request cards (Location, Bluetooth, Notifications):
    - [ ] Icon + permission name
    - [ ] Brief explanation
    - [ ] "Why we need this" link (opens bottom sheet)
  - [ ] Language selector dropdown (Hindi default, with English + 8 regional options)
  - [ ] "Enable & Protect 🛡️" button (enables all permissions)

- [ ] **Permission Handling**
  - [ ] Request Location (FINE_LOCATION)
  - [ ] Request Bluetooth (BLUETOOTH_SCAN, BLUETOOTH_CONNECT)
  - [ ] Request Notifications (POST_NOTIFICATIONS on Android 13+)
  - [ ] Show system permission dialogs
  - [ ] Handle denial (show retry UI, explain why needed)

- [ ] **Phone Number Input**
  - [ ] After permissions granted, show phone input form
  - [ ] Input: phone number in Indian format (+91 or 10-digit)
  - [ ] Validation: format check
  - [ ] Button: "Get OTP"

- [ ] **OTP Verification**
  - [ ] Call `POST /api/auth/register` to send OTP
  - [ ] Show OTP input screen (6 digits)
  - [ ] Auto-submit when 6 digits entered
  - [ ] Countdown timer (2 minutes, "Resend OTP" button)
  - [ ] Call `POST /api/auth/verify-otp` to verify
  - [ ] On success: save auth token, mark `is_onboarded = true`

- [ ] **Completion**
  - [ ] Navigate to Home screen
  - [ ] Start BLE scanning in background

**Estimated Time**: 2 days

---

## 1.9 Report Missing Person Screen

### Task 1.9.1: Report Form UI & Submission

**Objective**: Structured form for reporting a missing person with all required details

Create `lib/screens/report_missing_person_screen.dart`:

- [ ] **Photo Capture/Selection**
  - [ ] Button: "📸 Take Photo" (opens camera)
  - [ ] Button: "📷 From Gallery" (opens image picker)
  - [ ] Display selected photo preview
  - [ ] "Skip for now" option
  - [ ] Compress photo before upload

- [ ] **Name & Demographics**
  - [ ] Text field: Person name
  - [ ] Number field: Age
  - [ ] Dropdown: Gender (M, F, Other)
  - [ ] All required fields marked with *

- [ ] **Clothing Description (Structured)**
  - [ ] Top color dropdown (Red, Blue, Green, Yellow, Orange, Purple, White, Black, etc.)
  - [ ] Top type dropdown (T-shirt, Kurta, Saree, Shirt, Vest, etc.)
  - [ ] Bottom color dropdown
  - [ ] Bottom type dropdown (Pants, Shorts, Dhoti, Saree, Skirt, etc.)
  - [ ] Footwear dropdown (Slippers, Shoes, Barefoot, etc.)
  - [ ] Text field: Extras (jewelry, marks, tattoos, etc.)

- [ ] **Physical Description**
  - [ ] Build dropdown (Thin, Average, Heavy, Muscular)
  - [ ] Text field: Distinguishing features (scars, birthmarks, etc.)
  - [ ] Dropdown: Language spoken (Hindi, English, Regional)
  - [ ] Text field: Medical conditions (needs medication, hearing impaired, etc.)

- [ ] **Location & Time**
  - [ ] Current location button: "Use my current location"
  - [ ] Map button: "Pin on map" (opens map for manual selection)
  - [ ] Display selected location as text (lat/lng)
  - [ ] Quick time buttons:
    - [ ] "Just now" (0 min ago)
    - [ ] "15 min ago"
    - [ ] "30 min ago"
    - [ ] "1 hour ago"
    - [ ] Custom time picker
  - [ ] Store as exact DateTime

- [ ] **Contact & Relation**
  - [ ] Phone number: auto-filled from user profile
  - [ ] Relation dropdown (Parent, Spouse, Sibling, Friend, etc.)

- [ ] **BLE Log Disclosure**
  - [ ] Info box: "Your BLE contact log (last 2 hours) will be shared to find witnesses"
  - [ ] This educates user about privacy implications

- [ ] **Submission**
  - [ ] Button: "🚨 Submit Report"
  - [ ] Validation: all required fields filled
  - [ ] Show loading spinner during upload
  - [ ] On success: show "Report submitted! X witnesses notified"
  - [ ] Navigation to Home screen
  - [ ] On error: show error message with retry option

- [ ] **State Management**
  - [ ] Use Riverpod/Provider to manage form state
  - [ ] Persist form data during screen transitions
  - [ ] Draft save (optional): save incomplete form to local storage

**Estimated Time**: 2 days

---

## 1.10 Testing (Phase 1)

### Task 1.10.1: Unit & Integration Tests

**Objective**: Ensure core components work correctly

- [ ] **Unit Tests**
  - [ ] BLE RSSI to distance conversion
  - [ ] UUID rotation logic
  - [ ] Data model serialization (toJson/fromJson)
  - [ ] Location validation
  - [ ] API client interceptors
  - [ ] Test coverage: ≥80% of core logic

- [ ] **Integration Tests**
  - [ ] SQLite CRUD operations
  - [ ] BLE encounter logging flow
  - [ ] API registration & OTP verification
  - [ ] Report submission with photo upload
  - [ ] Error handling for network failures

- [ ] **Manual Testing**
  - [ ] Test on Android device (API 26+)
  - [ ] Test on iOS device (if available)
  - [ ] Verify BLE scanning in foreground & background
  - [ ] Verify all permissions requested correctly
  - [ ] Test report submission with real backend

**Estimated Time**: 1.5 days

---

## PHASE 1 CHECKLIST

- [ ] Flutter project initialized with folder structure
- [ ] All Dart data models created with serialization
- [ ] BLE scanning & advertising module working
- [ ] UUID rotation system implemented
- [ ] SQLite database schema and repositories created
- [ ] Location service integrated
- [ ] API client with auth token handling
- [ ] Backend PostgreSQL schema deployed
- [ ] Backend auth endpoints working (register, verify OTP)
- [ ] Backend report submission endpoint working
- [ ] Android foreground service running BLE in background
- [ ] Onboarding screen complete with permissions
- [ ] Report missing person screen with full form
- [ ] Photo upload to cloud storage working
- [ ] Tests written and passing
- [ ] App builds and runs on Android
- [ ] Manual end-to-end test: register → report → backend receives data

**Phase 1 Duration**: 7 days

---

# PHASE 2: Alert System + Feed (Week 2)

**Goal**: Implement dual alert mechanism (BLE witness + GPS radius), FCM push notifications, home feed UI, and alert cascade automation.

## 2.1 FCM Integration

### Task 2.1.1: Firebase Cloud Messaging Setup

**Objective**: Enable push notifications from backend to devices

- [ ] **Firebase Project Setup**
  - [ ] Create Firebase project (or use existing)
  - [ ] Add Android app: get `google-services.json`
  - [ ] Add iOS app: get `GoogleService-Info.plist`
  - [ ] Enable FCM service

- [ ] **Flutter Integration**
  - [ ] Add `firebase_messaging` to pubspec.yaml
  - [ ] Initialize Firebase in main.dart:
    ```dart
    await Firebase.initializeApp();
    final fcm = FirebaseMessaging.instance;
    final token = await fcm.getToken();
    ```
  - [ ] Request notification permissions (iOS)
  - [ ] Handle token refresh (save new token to backend)
  - [ ] Create token update listener in user service

- [ ] **Notification Handling**
  - [ ] Handle foreground notifications
  - [ ] Handle background notifications (using onBackgroundMessage)
  - [ ] Parse notification payload (report_id, alert_type, etc.)
  - [ ] Navigate to appropriate screen when notification tapped

- [ ] **Android Configuration**
  - [ ] Update AndroidManifest.xml with FCM receivers
  - [ ] Configure notification channels (high priority for witness alerts)
  - [ ] Set notification sound/vibration patterns

**Estimated Time**: 1.5 days

---

### Task 2.1.2: Backend FCM Integration

**Objective**: Send witness alerts via FCM from backend

Create backend service: `services/notification_service.js`:

- [ ] **FCM Admin SDK Setup**
  - [ ] Initialize Firebase Admin SDK with service account key
  - [ ] Create function: `sendWitnessAlert(userId, report, alertText)`

- [ ] **Witness Alert Messages**
  - [ ] Title: "🚨 WITNESS ALERT"
  - [ ] Body: "You were near [person] at [time]. Did you see a [description]?"
  - [ ] Data payload:
    ```json
    {
      "type": "witness_alert",
      "report_id": "...",
      "missing_person_name": "...",
      "alert_type": "ble_witness"
    }
    ```

- [ ] **GPS Radius Alert Messages**
  - [ ] Title: "🔍 AREA ALERT"
  - [ ] Body: "[Person] is missing near you. [Description]."
  - [ ] Data payload:
    ```json
    {
      "type": "area_alert",
      "report_id": "...",
      "alert_type": "gps_radius"
    }
    ```

- [ ] **Error Handling**
  - [ ] Handle invalid FCM tokens (remove from DB)
  - [ ] Retry failed sends (with exponential backoff)
  - [ ] Log all sends for audit trail

**Estimated Time**: 1 day

---

## 2.2 Dual Alert Engine

### Task 2.2.1: Witness Alert (BLE Matching)

**Objective**: Identify users who were near reporter and send witness alerts

Create backend service: `services/alert_engine.js`:

- [ ] **Algorithm: BLE Witness Matching**
  - [ ] When report is submitted:
    1. Extract BLE encounters from upload (list of UUIDs + timestamps)
    2. For each encounter UUID:
       - Query `ble_uuid_registry` to find user_id
       - Create `witness_alert` entry
       - Mark for notification
    3. Batch notify all witnesses via FCM
  - [ ] Database query logic:
    ```sql
    SELECT user_id, fcm_token
    FROM ble_uuid_registry
    WHERE rotating_uuid = $1
      AND valid_from <= $2
      AND valid_until >= $2
    LIMIT 1;
    ```

- [ ] **Witness Alert Creation**
  - [ ] Insert to `witness_alerts` table:
    - [ ] report_id
    - [ ] witness_user_id
    - [ ] alert_type: "ble_witness"
    - [ ] alert_text: formatted message
    - [ ] notified_at: NOW()
  - [ ] Track notifications sent count

- [ ] **Deduplication**
  - [ ] If same witness appears multiple times in encounter log (strong RSSI), send only once
  - [ ] Check for existing alerts to same user for same report (don't re-alert)

**Estimated Time**: 1.5 days

---

### Task 2.2.2: GPS Radius Alert (Area Alert)

**Objective**: Alert all app users within radius of last seen location

Create backend service: `services/gps_alert_service.js`:

- [ ] **Cascade Algorithm**
  - [ ] On report submission, set initial cascade_level = 1, alert_radius_meters = 500
  - [ ] Query users within 500m of last seen location:
    ```sql
    SELECT user_id, fcm_token, location
    FROM user_locations
    WHERE ST_DWithin(
      location::geography,
      ST_MakePoint($1, $2)::geography,
      500  -- 500 meters
    )
    AND location_updated_at > NOW() - INTERVAL '5 minutes'
    AND user_id != $3; -- exclude reporter
    ```
  - [ ] Create `witness_alerts` for each user (alert_type: "gps_radius")
  - [ ] Send FCM to all

- [ ] **Radius Expansion Schedule**
  - [ ] Initial: 500m, Level 1 (0 min)
  - [ ] Level 2: 1000m (5 min delay)
  - [ ] Level 3: 2000m (10 min delay)
  - [ ] Level 4: 5000m (20 min delay)
  - [ ] Level 5: 10000m (30 min delay)
  - [ ] Store schedule in `missing_reports.cascade_level` and timestamps
  - [ ] Job/cron task: every minute, check if any reports need cascade expansion

- [ ] **User Location Tracking**
  - [ ] Need to store user locations in backend for radius queries
  - [ ] Create table: `user_locations(user_id, location, updated_at)`
  - [ ] App sends location updates periodically (every 30s on location change)
  - [ ] Endpoint: `POST /api/user/update-location { latitude, longitude }`

**Estimated Time**: 2 days

---

## 2.3 Home Screen & Alert Feed

### Task 2.3.1: Home Screen UI

**Objective**: Display alert feed with witness and area alerts

Create `lib/screens/home_screen.dart`:

- [ ] **Top Bar**
  - [ ] Current location/sector (auto-detected from GPS)
  - [ ] Status indicator: "BLE: On", "GPS: On", "Notifications: On"

- [ ] **Alert Feed**
  - [ ] Fetch alerts from backend: `GET /api/alerts/feed` (authenticated)
  - [ ] Sort and display alerts:
    1. **Witness Alerts** (BLE-matched) — pinned to top, highlighted with ⚡ icon
    2. **Area Alerts** (GPS radius) — standard cards, sorted by distance
  - [ ] Pull-to-refresh
  - [ ] Pagination/infinite scroll for older alerts

- [ ] **Witness Alert Card**
  - [ ] Person photo (if available)
  - [ ] Person details: name, age, clothing, gender
  - [ ] "You were 8m from them at 2:10 PM near [location]"
  - [ ] "Missing since: 12 min ago"
  - [ ] Two action buttons:
    - [ ] "👁️ I See Them" → opens confirmation flow
    - [ ] "📍 I Was There" → opens witness memory form
  - [ ] Highlight color: bright yellow/orange

- [ ] **Area Alert Card**
  - [ ] Similar to witness but less highlighted
  - [ ] "350m from you"
  - [ ] "Last seen 25 minutes ago"
  - [ ] Action buttons:
    - [ ] "👁️ I See Them"
    - [ ] "📍 Get Directions" (optional)

- [ ] **Sighting Card** (for unmatched sightings)
  - [ ] Sighting photo
  - [ ] "Unknown child ~4yr, crying, red kurta"
  - [ ] "Reported 8 min ago, 120m from you"
  - [ ] Action: "🏃 Guide to Help"

- [ ] **Bottom Navigation**
  - [ ] 🏠 Home (active)
  - [ ] 🗺️ Map
  - [ ] ➕ Report
  - [ ] 👤 Profile

- [ ] **State Management**
  - [ ] Use Riverpod for alert feed state
  - [ ] Real-time updates via WebSocket (Phase 2.4)

**Estimated Time**: 2 days

---

## 2.4 WebSocket Real-Time Updates

### Task 2.4.1: WebSocket Connection

**Objective**: Receive live alert updates without polling

Create `lib/services/realtime_service.dart`:

- [ ] **WebSocket Setup**
  - [ ] Use `web_socket_channel` package
  - [ ] Connect to backend WebSocket: `wss://api.kumbhraksha.com/alerts`
  - [ ] Send auth token in first message
  - [ ] Reconnect logic: exponential backoff (1s, 2s, 4s, 8s, max 30s)

- [ ] **Event Handling**
  - [ ] Listen for events:
    - [ ] `new_alert` — new witness or area alert for this user
    - [ ] `alert_update` — existing alert status change
    - [ ] `report_resolved` — report marked as resolved
  - [ ] Parse event JSON:
    ```json
    {
      "type": "new_alert",
      "payload": { "id": "...", "report_id": "...", "type": "ble_witness", ... }
    }
    ```

- [ ] **UI Updates**
  - [ ] When new_alert received:
    - [ ] Add to top of alert feed (in-memory)
    - [ ] Show toast notification
    - [ ] Play sound (unless muted)
  - [ ] Invalidate alert feed cache to refresh from server

- [ ] **Connection Management**
  - [ ] Auto-connect on app start
  - [ ] Auto-disconnect on app pause
  - [ ] Reconnect on app resume
  - [ ] Graceful shutdown on logout

**Estimated Time**: 1 day

---

### Task 2.4.2: Backend WebSocket Server

**Objective**: Broadcast alerts to connected users in real-time

Create backend service: `services/websocket_server.js`:

- [ ] **Socket.io Setup**
  - [ ] Initialize Socket.io on Express server
  - [ ] Namespace: `/alerts`
  - [ ] Authentication: verify JWT on connection

- [ ] **Alert Broadcasting**
  - [ ] When witness alert created:
    ```javascript
    io.to(witness_user_id).emit('new_alert', { type: 'ble_witness', ... });
    ```
  - [ ] When area alert created:
    ```javascript
    // Broadcast to all users within radius (already have their location)
    const users = await getUsersInRadius(location, radius);
    for (const user of users) {
      io.to(user.id).emit('new_alert', { type: 'gps_radius', ... });
    }
    ```

- [ ] **Rooms & Filtering**
  - [ ] Create room for each user: `user:{user_id}`
  - [ ] Join room on connection
  - [ ] Broadcast to room when alert created
  - [ ] Leave room on disconnect

- [ ] **Error Handling**
  - [ ] Handle connection drops
  - [ ] Handle invalid tokens
  - [ ] Graceful message queue for offline users (optional)

**Estimated Time**: 1.5 days

---

## 2.5 "I See Them" Confirmation Flow

### Task 2.5.1: Sighting Confirmation UI

**Objective**: Allow users to confirm they see a missing person and provide photo/location

Create `lib/screens/confirm_sighting_screen.dart`:

- [ ] **Header**
  - [ ] Display missing person details (from alert)
  - [ ] Name, age, clothing, description
  - [ ] "Are you seeing this person?"

- [ ] **Photo Capture**
  - [ ] Live camera view
  - [ ] Button: "📸 Take Confirmation Photo"
  - [ ] Capture photo, display preview
  - [ ] "Change Photo" button for retake

- [ ] **Confidence Level**
  - [ ] Buttons: "😐 Maybe", "😊 Likely", "✅ Definitely Them"
  - [ ] Store selected confidence level

- [ ] **Stay with Them?**
  - [ ] Checkbox: "I can stay with them"
  - [ ] If yes: explain that app will share live GPS with family/authorities
  - [ ] Button: "📞 Call Family (Masked Number)" (if available)

- [ ] **Submission**
  - [ ] Button: "✅ Submit Confirmation"
  - [ ] Show loading indicator
  - [ ] Upload photo to cloud storage
  - [ ] Submit sighting to backend: `POST /api/sightings`
  - [ ] On success: show "Thank you! Family & authorities have been notified"
  - [ ] If "stay with them" checked: start live location sharing

- [ ] **Live Location Sharing** (if opted-in)
  - [ ] Start periodic location updates (every 10 seconds)
  - [ ] Send to backend: `POST /api/sightings/{id}/location-update`
  - [ ] Show UI: "📍 Sharing live location... [stop button]"
  - [ ] Auto-stop after 1 hour or user taps stop

**Estimated Time**: 2 days

---

## 2.6 "I Was There" Witness Memory Form

### Task 2.6.1: Witness Recall UI

**Objective**: Collect memories from witnesses about the missing person

Create `lib/screens/I_was_there_screen.dart`:

- [ ] **Context Display**
  - [ ] Person details: photo, name, age, clothing
  - [ ] "You were near them at 2:10 PM near Ghat 5"
  - [ ] Time since then

- [ ] **Witness Memory Questions**
  - [ ] "Do you remember seeing them?" [Yes/No/Not sure]
  - [ ] If yes:
    - [ ] "When did you last see them?" [time picker]
    - [ ] "Where did you see them?" [map picker]
    - [ ] "Which direction did they go?" [compass/direction picker]
    - [ ] "Did they seem lost/confused?" [Yes/No]
    - [ ] "Were they with anyone?" [Yes/No, if yes → describe]
    - [ ] "Any other details?" [text area]
  - [ ] If no/not sure: "Thank you for checking!"

- [ ] **Submission**
  - [ ] Button: "✅ Submit Memory"
  - [ ] Send to backend: `POST /api/witness-reports`
  - [ ] On success: "Thank you! This helps the search"

**Estimated Time**: 1 day

---

## 2.7 Alert Cascade Automation (Backend Cron Job)

### Task 2.7.1: Radius Expansion Scheduler

**Objective**: Automatically expand alert radius at timed intervals

Create backend job: `jobs/cascade_scheduler.js`:

- [ ] **Cron Job Setup**
  - [ ] Run every 1 minute
  - [ ] Query all active reports (status = 'reported')
  - [ ] For each report, check if cascade needs expansion

- [ ] **Cascade Logic**
  ```javascript
  const cascadeSchedule = [
    { level: 1, radius: 500, delayMinutes: 0 },
    { level: 2, radius: 1000, delayMinutes: 5 },
    { level: 3, radius: 2000, delayMinutes: 10 },
    { level: 4, radius: 5000, delayMinutes: 20 },
    { level: 5, radius: 10000, delayMinutes: 30 }
  ];
  
  // Check if time to expand
  const minutesSinceReport = (now - report.reported_at) / 60000;
  const nextCascade = cascadeSchedule.find(c => c.delayMinutes <= minutesSinceReport && c.level > report.cascade_level);
  
  if (nextCascade) {
    // Update report cascade level
    // Find new users in expanded radius
    // Send new alerts
    // Broadcast via WebSocket
  }
  ```

- [ ] **Database Updates**
  - [ ] Update `missing_reports.cascade_level`
  - [ ] Update `missing_reports.alert_radius_meters`
  - [ ] Create new `witness_alerts` entries for newly-in-range users
  - [ ] Track expansion history for dashboard

**Estimated Time**: 1 day

---

## 2.8 Backend API Endpoints (Phase 2 Additions)

### Task 2.8.1: Alert Endpoints

- [ ] `GET /api/alerts/feed` (authenticated)
  - [ ] Return paginated list of alerts for current user
  - [ ] Sorted: witness alerts first, then area alerts by time
  - [ ] Include report details (photo, description)
  - [ ] Filter: only unresolved reports

- [ ] `POST /api/alerts/{id}/response` (authenticated)
  - [ ] Record user's response to witness alert
  - [ ] Input: alert_id, response (seen/not_seen/unsure), notes
  - [ ] Update `witness_alerts.user_responded = true`

- [ ] `POST /api/sightings` (authenticated)
  - [ ] Submit a sighting (photo + description)
  - [ ] Input: multipart form with photo, description, confidence
  - [ ] Multipart: photo file + metadata
  - [ ] Return: sighting_id

- [ ] `POST /api/sightings/{id}/location-update` (authenticated)
  - [ ] Update live location of spotter
  - [ ] Input: { latitude, longitude, timestamp }
  - [ ] Broadcast to authority dashboard via WebSocket

- [ ] `POST /api/witness-reports` (authenticated)
  - [ ] Submit witness memory/recall
  - [ ] Input: { alert_id, memory_text, direction, location, etc. }
  - [ ] Store to witness_alerts record

- [ ] `POST /api/user/update-location` (authenticated)
  - [ ] Update user's current location (for GPS radius matching)
  - [ ] Input: { latitude, longitude }
  - [ ] Update `user_locations` table
  - [ ] Called periodically by app (every 30s)

- [ ] `GET /api/reports/{id}` (authenticated)
  - [ ] Get full details of a specific missing report
  - [ ] Return: person details, photo, alerts count, sightings, cascade status

**Estimated Time**: 1.5 days

---

## 2.9 Testing (Phase 2)

### Task 2.9.1: Integration & E2E Tests

- [ ] **Backend Tests**
  - [ ] Test BLE witness matching logic
  - [ ] Test GPS radius query
  - [ ] Test cascade expansion
  - [ ] Test FCM notification sending
  - [ ] Test WebSocket broadcasting

- [ ] **Frontend Tests**
  - [ ] Test alert feed rendering
  - [ ] Test WebSocket connection/reconnection
  - [ ] Test sighting submission with photo
  - [ ] Test live location sharing

- [ ] **E2E Scenarios**
  - [ ] User1 goes missing → User2 (who was near) gets witness alert → responds
  - [ ] GPS radius expansion: 500m → 1000m → check new users alerted
  - [ ] Sighting reported → appears in feed of nearby users → confirmation photo submitted
  - [ ] WebSocket: new alert sent → received in real-time on client

**Estimated Time**: 2 days

---

## PHASE 2 CHECKLIST

- [ ] Firebase project created with FCM enabled
- [ ] firebase_messaging integrated in Flutter app
- [ ] FCM token requested and sent to backend
- [ ] Notification channels configured (Android)
- [ ] Backend FCM Admin SDK initialized
- [ ] Witness alert matching algorithm implemented
- [ ] GPS radius alert algorithm implemented
- [ ] Cascade scheduler cron job running
- [ ] WebSocket connection working (Socket.io)
- [ ] Real-time alert updates received on client
- [ ] Home screen showing alert feed
- [ ] Witness and area alert cards displaying correctly
- [ ] "I See Them" confirmation flow working
- [ ] "I Was There" witness memory form working
- [ ] Sighting submission working
- [ ] Live location sharing working
- [ ] All new API endpoints tested and working
- [ ] E2E tests passing
- [ ] App builds and runs on Android/iOS
- [ ] Manual test: report → witness gets alert in real-time → responds → feedback loop

**Phase 2 Duration**: 7 days

---

# PHASE 3: Sightings + Map + Dashboard (Week 3)

**Goal**: Implement proactive sighting reports, active alerts map with layers, authority dashboard with case management, and family group pre-registration.

## 3.1 Report Sighting Screen (Proactive Flow)

### Task 3.1.1: Sighting Report UI

**Objective**: Allow users to report someone who looks lost (even if not yet reported as missing)

Create `lib/screens/report_sighting_screen.dart`:

- [ ] **Photo Capture**
  - [ ] Camera view with "📸 Capture Photo" button
  - [ ] Display photo preview
  - [ ] Retake option

- [ ] **Person Quick Classification**
  - [ ] Buttons: "👶 Child", "👨 Adult", "👵 Elderly", "♿ Disabled"
  - [ ] Select one (or multiple if group)
  - [ ] Gender: [M] [F] [Other]
  - [ ] Approx age: number field or age range

- [ ] **Behavior/Status**
  - [ ] Emoji buttons:
    - [ ] "😢 Crying"
    - [ ] "😶 Confused"
    - [ ] "🧍 Standing alone"
    - [ ] "🚶 Wandering"
    - [ ] "😟 Distressed"
  - [ ] Multi-select allowed

- [ ] **Location**
  - [ ] Auto-detected GPS location
  - [ ] Show location name if available
  - [ ] "Pin on map" to adjust

- [ ] **Notes (Optional)**
  - [ ] Text area: "Describe anything else..."
  - [ ] Examples: "Elderly woman, white saree, near tea stall, speaking Tamil"

- [ ] **Submission**
  - [ ] Button: "📤 Submit Sighting"
  - [ ] Show loading
  - [ ] Send to backend: `POST /api/sightings`
  - [ ] On success: "Thank you! Authorities & nearby citizens have been notified"
  - [ ] Show option: "🏃 I'll guide to help" → start live location sharing

- [ ] **Safety Notice**
  - [ ] Text: "💡 Stay with them if safe. Authorities will be alerted."

**Estimated Time**: 1.5 days

---

## 3.2 Active Alerts Map

### Task 3.2.1: Map Screen with Layers

**Objective**: Display active cases, sightings, and optional CCTV/crowd density on map

Create `lib/screens/active_alerts_map_screen.dart`:

- [ ] **Map Setup**
  - [ ] Use `google_maps_flutter`
  - [ ] Center on current user location
  - [ ] Add zoom controls
  - [ ] Track user location in real-time

- [ ] **Layers (Toggle Buttons at Top)**
  - [ ] ✅ Missing persons (enabled by default)
  - [ ] ✅ Sightings (enabled by default)
  - [ ] ☐ CCTV cameras (disabled by default)
  - [ ] ☐ Crowd density (disabled by default)

- [ ] **Missing Person Markers**
  - [ ] 🔴 Red circle at last seen location
  - [ ] Animated pulsing/expanding rings (500m, 1000m, etc.)
  - [ ] Marker title: person name
  - [ ] Tap marker → show detail card (bottom sheet)

- [ ] **Detail Card**
  - [ ] Photo + description
  - [ ] "Missing since: 15 min ago"
  - [ ] "Alert radius: 1000m (Level 2)"
  - [ ] Action buttons: "👁️ I See Them", "📍 Get Directions"

- [ ] **Sighting Markers**
  - [ ] 🟡 Yellow circle at sighting location
  - [ ] Tap → show: photo, description, time
  - [ ] Action: "📞 Contact spotter"

- [ ] **CCTV Camera Markers** (optional)
  - [ ] 📷 Camera icons
  - [ ] Loaded from CCTV dataset
  - [ ] Tap → show camera ID, coverage area
  - [ ] Link to authority dashboard for live feed

- [ ] **Crowd Density Heatmap** (optional)
  - [ ] Show as colored overlay
  - [ ] Red = high density, Blue = low density
  - [ ] Updated from app user location distribution

- [ ] **User Location**
  - [ ] 🔵 Blue dot for user
  - [ ] Center map on user with button

**Estimated Time**: 2 days

---

## 3.3 Authority Dashboard (Web)

**Objective**: Build React dashboard for authorities to manage cases, view witness lists, control alerts

Note: This is a significant component. For hackathon, a MVP dashboard is sufficient.

### Task 3.3.1: Dashboard Setup

Create `dashboard/` folder (separate React app):

- [ ] **Tech Stack**
  - [ ] Create React app with TypeScript
  - [ ] State management: Redux or Zustand
  - [ ] UI library: Material-UI or Tailwind
  - [ ] Maps: Google Maps or Mapbox
  - [ ] Real-time: Socket.io client
  - [ ] Tables: TanStack Table (React Table)

- [ ] **Authentication**
  - [ ] Officer login with credentials
  - [ ] JWT token-based auth
  - [ ] Role-based access (officer, supervisor, admin)
  - [ ] Logout

**Estimated Time**: 1 day

---

### Task 3.3.2: Dashboard Views

**View 1: Live Operations Map**

- [ ] Display map with all active cases
- [ ] 🔴 Red markers for missing persons (last seen location)
- [ ] 🟡 Yellow markers for sightings
- [ ] 📍 Blue markers for responders/spotters sharing live location
- [ ] Expand search radius rings animated
- [ ] Tap marker → detail panel

**View 2: Case Management Table**

- [ ] Table of active cases with columns:
  - [ ] Case ID
  - [ ] Person name (link to detail)
  - [ ] Time since reported
  - [ ] Current radius
  - [ ] Witness alerts sent
  - [ ] Sightings
  - [ ] Status (reported, escalated, resolved)
  - [ ] Assigned officer

- [ ] Detail panel (slide-out):
  - [ ] Full report details (photo, clothing, medical)
  - [ ] Witness list:
    - [ ] User name/phone
    - [ ] Alert type (BLE or GPS)
    - [ ] Response status (✅ responded, ⏳ no response, ❌ didn't see)
    - [ ] Response text if given
  - [ ] Sightings list:
    - [ ] Photo, location, time, confidence
    - [ ] Spotter info + contact
  - [ ] Timeline of actions
  - [ ] Action buttons: escalate, cancel, mark resolved

**View 3: Alert Controls**

- [ ] For selected case:
  - [ ] Manual radius adjustment (slider: 500m - 10km)
  - [ ] Manual broadcast: draw radius on map, send alert
  - [ ] SMS escalation: send SMS to local police
  - [ ] Email escalation: notify supervisors
- [ ] View BLE encounter graph:
  - [ ] Visual graph showing devices near reporter at time of separation
  - [ ] Node = device, edge = encountered
  - [ ] Hover → show witness info

**View 4: Analytics (Optional)**

- [ ] Charts:
  - [ ] Cases by hour
  - [ ] Average reunion time
  - [ ] Witness response rate
  - [ ] Most common separation locations

**Estimated Time**: 3 days

---

### Task 3.3.3: Dashboard Backend Endpoints

- [ ] `GET /api/dashboard/cases` (authenticated, officer role)
  - [ ] Return all active cases with summary
  - [ ] Paginated, sortable
  - [ ] Include: case ID, person name, reported time, radius, witness count

- [ ] `GET /api/dashboard/cases/{id}` (authenticated, officer role)
  - [ ] Return full case details
  - [ ] Include: report, witnesses (with responses), sightings, timeline

- [ ] `PUT /api/dashboard/cases/{id}` (authenticated, officer role)
  - [ ] Update case status, assigned officer
  - [ ] Input: { status, assigned_officer_id, notes }

- [ ] `POST /api/dashboard/cases/{id}/broadcast` (authenticated, officer role)
  - [ ] Manual area broadcast
  - [ ] Input: { location, radius, custom_message }
  - [ ] Send alerts to all users in radius

- [ ] `POST /api/dashboard/cases/{id}/escalate` (authenticated, officer role)
  - [ ] Send SMS/email escalation
  - [ ] Input: { method, message }

- [ ] `GET /api/dashboard/map-data` (authenticated, officer role)
  - [ ] Return live map data: all cases, sightings, responders
  - [ ] GeoJSON format for easy map rendering
  - [ ] Real-time via WebSocket

**Estimated Time**: 1.5 days

---

## 3.4 Family Group Registration

### Task 3.4.1: Family Group Management Screen

**Objective**: Allow users to pre-register family members (especially those without app)

Create `lib/screens/family_group_screen.dart`:

- [ ] **Header**
  - [ ] "👨‍👩‍👧‍👦 My Family Group"
  - [ ] Count: "4 members"

- [ ] **Family List**
  - [ ] Card for each family member:
    - [ ] Photo (if available)
    - [ ] Name, age, relation
    - [ ] Status: "📱 Has App" or "❌ No App"
    - [ ] Buttons: "Edit", "Delete"

- [ ] **Add Family Member**
  - [ ] Button: "➕ Add Family Member"
  - [ ] Opens form:
    - [ ] Name (required)
    - [ ] Age (required)
    - [ ] Relation (dropdown)
    - [ ] Gender
    - [ ] Photo (camera/gallery)
    - [ ] Clothing description (optional, pre-fill for quick report)
    - [ ] Medical conditions (optional)
    - [ ] Phone number (if they have app, to auto-link)
    - [ ] Button: "✅ Save"

- [ ] **Live Location Sharing** (for family with app)
  - [ ] Toggle: "See [name]'s location"
  - [ ] If enabled: show on map in real-time
  - [ ] Needs consent from family member (app-side toggle)

- [ ] **Audio Beacon** (optional, advanced)
  - [ ] Dropdown: "Choose a sound your family recognizes"
  - [ ] Options: Melody 1, Melody 2, etc.
  - [ ] Text: "If someone goes missing, nearby searchers' phones will play this"

**Estimated Time**: 2 days

---

### Task 3.4.2: Quick Report from Family Group

**Objective**: One-tap report for pre-registered family members

Modify `lib/screens/report_missing_person_screen.dart`:

- [ ] **Quick Report Button** (at top)
  - [ ] Show family members with no app (static)
  - [ ] Tap member → opens pre-filled report form
  - [ ] All fields (name, age, clothing, etc.) auto-filled from registration
  - [ ] User only needs to:
    - [ ] Confirm location (or override)
    - [ ] Confirm time (or override)
    - [ ] Add any new details
    - [ ] Submit
  - [ ] This should take <30 seconds for panicked parents

**Estimated Time**: 1 day

---

## 3.5 Attribute Matching Engine (Backend)

### Task 3.5.1: Clothing & Description Matching

**Objective**: Match sightings to missing person reports based on clothing/description

Create backend service: `services/attribute_matcher.js`:

- [ ] **Matching Algorithm**
  - [ ] When sighting submitted, query all active missing reports
  - [ ] For each report, calculate similarity score:
    - [ ] Top color match: +0.15
    - [ ] Top type match: +0.15
    - [ ] Bottom color match: +0.15
    - [ ] Bottom type match: +0.15
    - [ ] Footwear match: +0.10
    - [ ] Age proximity (within 3 years): +0.10
    - [ ] Gender match: +0.10
    - [ ] Behavior match (crying, wandering, etc.): +0.10
  - [ ] Total score: 0-1.0
  - [ ] Threshold: >0.5 = match, suggest to authorities

- [ ] **Matching Result Storage**
  - [ ] Add `matcher_confidence` to sightings table
  - [ ] Add `matched_report_ids` to sightings (array of likely matches)
  - [ ] Broadcast matches to authority dashboard

- [ ] **Witness Feedback Loop**
  - [ ] When witness responds to alert (saw/didn't see), update match confidence
  - [ ] If multiple witnesses say "didn't see" for sighting with high match score, lower confidence
  - [ ] Refine matching accuracy over time

**Estimated Time**: 1.5 days

---

## 3.6 Backend Sighting Endpoints

- [ ] `POST /api/sightings` (authenticated)
  - [ ] Submit new sighting
  - [ ] Input: multipart form with photo, person_type, age, gender, behavior, location, notes
  - [ ] Return: sighting_id
  - [ ] Trigger attribute matching
  - [ ] Send alerts to nearby users (GPS radius query)
  - [ ] Broadcast to authority dashboard

- [ ] `GET /api/sightings?report_id={id}` (authenticated)
  - [ ] Get all sightings for a report
  - [ ] Include confidence score

- [ ] `POST /api/sightings/{id}/location-update` (authenticated)
  - [ ] Update live location of spotter
  - [ ] Broadcast to dashboard

- [ ] `GET /api/family-groups` (authenticated)
  - [ ] Get family group for current user

- [ ] `POST /api/family-groups/members` (authenticated)
  - [ ] Add family member
  - [ ] Input: { name, age, relation, photo, clothing, medical_conditions }

- [ ] `PUT /api/family-groups/members/{id}` (authenticated)
  - [ ] Update family member

- [ ] `DELETE /api/family-groups/members/{id}` (authenticated)
  - [ ] Delete family member

**Estimated Time**: 1.5 days

---

## 3.7 Testing (Phase 3)

- [ ] **Map Rendering**
  - [ ] Verify markers display correctly
  - [ ] Verify layers toggle on/off
  - [ ] Test zoom/pan interactions
  
- [ ] **Attribute Matching**
  - [ ] Test matching algorithm with various sighting/report combinations
  - [ ] Verify confidence scores calculated correctly
  - [ ] Test witness feedback improves matching

- [ ] **Family Group**
  - [ ] Test adding/editing/deleting members
  - [ ] Test quick report pre-fills correctly
  - [ ] Test live location sharing

- [ ] **Dashboard**
  - [ ] Test case table loads and displays correctly
  - [ ] Test detail panel shows all witness info
  - [ ] Test manual broadcast sends alerts

**Estimated Time**: 2 days

---

## PHASE 3 CHECKLIST

- [ ] Report sighting screen complete
- [ ] Sighting submission working with photo upload
- [ ] Active alerts map displaying correctly
- [ ] Map layers (missing, sightings, CCTV, density) toggling
- [ ] Missing person pulsing rings animated
- [ ] Sighting markers appearing in real-time
- [ ] Authority dashboard created (React app)
- [ ] Dashboard authentication working
- [ ] Case management table displaying all cases
- [ ] Case detail panel with witness list
- [ ] Alert controls (radius adjustment, manual broadcast)
- [ ] BLE encounter graph visible in dashboard
- [ ] Attribute matching algorithm working
- [ ] Sightings being matched to reports
- [ ] Family group registration screen complete
- [ ] Quick report from family group working
- [ ] Family members pre-filling report correctly
- [ ] All Phase 3 API endpoints working
- [ ] Dashboard backend endpoints working
- [ ] WebSocket broadcasting case updates to dashboard
- [ ] E2E test: sighting reported → matched to report → authorities notified

**Phase 3 Duration**: 7 days

---

# PHASE 4: Polish + Scale (Week 4)

**Goal**: Audio beacon feature, analytics, performance optimization, iOS background optimization, load testing, offline resilience.

## 4.1 Audio Beacon Feature

### Task 4.1.1: Audio Beacon Implementation

**Objective**: Lost person hears unique family melody and moves toward sound

**Mobile App:**

- [ ] **Beacon Selection (during family group setup)**
  - [ ] UI: pick from 5 pre-recorded melodies
  - [ ] Play sample sound for selection
  - [ ] Store chosen melody ID
  - [ ] Sync to backend

- [ ] **Beacon Activation (from dashboard)**
  - [ ] Officer triggers beacon for a case
  - [ ] All app users within 2km receive notification: "Audio beacon active"
  - [ ] App starts playing chosen melody (looping, loud)
  - [ ] Notification: "🔔 Follow this sound to help [person]"
  - [ ] User can tap "Stop" to stop sound

- [ ] **Beacon Broadcasting**
  - [ ] Use `just_audio` or `audioplayers` package
  - [ ] Play in foreground (even if app minimized, use audio focus)
  - [ ] Volume: maximum by default
  - [ ] Loop continuously until stopped

**Backend:**

- [ ] `POST /api/dashboard/cases/{id}/activate-beacon` (authenticated, officer)
  - [ ] Input: case_id
  - [ ] Broadcast to all users near last seen location:
    ```json
    {
      "type": "beacon_activated",
      "case_id": "...",
      "melody_id": "...",
      "location": {...}
    }
    ```
  - [ ] Via WebSocket + FCM

**Estimated Time**: 1.5 days

---

## 4.2 Analytics Dashboard (Optional for Hackathon)

### Task 4.2.1: Analytics Queries & Display

**Objective**: Track metrics to improve search effectiveness

Backend queries:

- [ ] Cases by hour (histogram)
- [ ] Average time to reunion (days)
- [ ] Witness response rate (%)
- [ ] BLE witness effectiveness (what % of reunited cases had BLE alerts)
- [ ] GPS radius expansion effectiveness
- [ ] Most common separation zones (heatmap)
- [ ] Age distribution of missing persons

React dashboard:

- [ ] Create `/analytics` page
- [ ] Charts: line chart (cases over time), bar chart (by zone), pie (by age group)
- [ ] Exportable reports (CSV, PDF)

**Estimated Time**: 2 days

---

## 4.3 SMS Escalation

### Task 4.3.1: SMS Integration (MSG91)

**Objective**: Send SMS to local police/authorities for critical cases

Backend:

- [ ] `services/sms_service.js`
  - [ ] Initialize MSG91 API client
  - [ ] Function: `sendEscalationSMS(caseId, recipientPhone, message)`
  - [ ] Template: "[URGENT] Missing [person] at [location]. Report: [link]. — KumbhRaksha"

- [ ] Officer can trigger: "Send SMS Escalation"
  - [ ] Dashboard provides form: recipient phone, custom message
  - [ ] Endpoint: `POST /api/dashboard/cases/{id}/send-sms`
  - [ ] Cost: track SMS count for billing

**Estimated Time**: 1 day

---

## 4.4 iOS Background BLE Optimization

### Task 4.4.1: iOS Specific Configuration

**Objective**: Enable background BLE scanning on iOS (trickier than Android)

iOS implementation:

- [ ] **Background Modes** (in Xcode)
  - [ ] Enable: "Acts as a Bluetooth LE peripheral"
  - [ ] Enable: "Acts as a Bluetooth LE central"
  - [ ] Enable: "Location updates"

- [ ] **Entitlements**
  - [ ] Add `com.apple.developer.networking.ble` with appropriate values

- [ ] **BLE Configuration**
  - [ ] Use `flutter_blue_plus` (good iOS support)
  - [ ] Set `FBPShowPowerAlert = true` (show alert if BLE off)
  - [ ] Handle BLE state changes
  - [ ] Note: iOS limits background scanning to a list of service UUIDs

- [ ] **User Education**
  - [ ] Onboarding: "For best results, keep the app running in background"
  - [ ] Explain: iOS suspends background tasks more aggressively
  - [ ] Suggest: add app to battery optimization whitelist

- [ ] **Testing**
  - [ ] Test BLE scanning when app is backgrounded (not force-killed)
  - [ ] Test after device sleep
  - [ ] Measure battery impact on iOS device

**Estimated Time**: 2 days

---

## 4.5 Load Testing

### Task 4.5.1: Load Test Scenario

**Objective**: Verify backend can handle scale: 10K concurrent app users, 100+ active cases

Use load testing tool: K6, JMeter, or Locust

Scenarios:

- [ ] **Concurrent BLE Scanning**
  - [ ] Simulate 10K devices advertising BLE UUIDs
  - [ ] Each device broadcasts every 4 seconds
  - [ ] Verify server can handle incoming scan data (if logging server-side)

- [ ] **Report Submission Spike**
  - [ ] 100 simultaneous missing person reports
  - [ ] Each with BLE encounter log (100-200 encounters)
  - [ ] Verify witness matching & alert sending completes in <10s

- [ ] **Cascade Expansion**
  - [ ] 100 active reports with radius expansion every 5 min
  - [ ] Each expansion queries users in radius & sends FCM
  - [ ] Verify FCM API handles 1000s of messages/minute

- [ ] **WebSocket Broadcast**
  - [ ] 10K connected clients
  - [ ] Send alert to 500 of them
  - [ ] Measure latency: <100ms

- [ ] **GPS Location Updates**
  - [ ] 10K users sending location every 30s
  - [ ] Server processes location, updates user_locations table
  - [ ] Verify PostGIS queries still responsive

Load test targets:

- [ ] API response times: p95 <500ms
- [ ] FCM send latency: <5s
- [ ] WebSocket delivery: <100ms
- [ ] Database query times: <100ms

**Estimated Time**: 2 days

---

## 4.6 Offline Resilience

### Task 4.6.1: Queue & Retry Offline Operations

**Objective**: App continues functioning without internet; syncs when reconnected

Mobile app:

- [ ] **Offline Detection**
  - [ ] Use `connectivity_plus` package
  - [ ] Listen to connectivity changes
  - [ ] Show UI indicator: "Offline — will sync when online"

- [ ] **Report Queue**
  - [ ] If user submits report while offline:
    - [ ] Save to local SQLite: `pending_reports` table
    - [ ] Show: "Report saved. Will submit when online."
    - [ ] When internet returns: auto-submit to backend
    - [ ] Retry with exponential backoff

- [ ] **Location Update Queue**
  - [ ] If location updates fail:
    - [ ] Queue them locally
    - [ ] When online, batch-upload last known location
    - [ ] Don't queue all; just keep last few

- [ ] **Alert Sync**
  - [ ] If can't connect to WebSocket:
    - [ ] Fallback to polling (every 10s)
    - [ ] When reconnected, fetch missed alerts via API
    - [ ] Resume WebSocket connection

**Estimated Time**: 1.5 days

---

## 4.7 Performance Optimization

### Task 4.7.1: App Performance Tuning

- [ ] **Build Size**
  - [ ] Measure APK/IPA size
  - [ ] Goal: <50MB
  - [ ] Remove unused dependencies
  - [ ] Enable ProGuard/R8 on Android

- [ ] **App Startup Time**
  - [ ] Measure cold start: <3s
  - [ ] Lazy-load screens not needed at startup
  - [ ] Cache user data from previous session

- [ ] **Home Screen Performance**
  - [ ] Alert feed rendering: 60 FPS
  - [ ] Virtualize long lists (use ListView with lazy loading)
  - [ ] Cache alert cards

- [ ] **Memory Usage**
  - [ ] Monitor for memory leaks in BLE service
  - [ ] Dispose of resources properly (stop scanners, close databases)
  - [ ] Limit SQLite queries (paginate)

- [ ] **Battery Optimization**
  - [ ] Verify BLE scanning doesn't exceed 10% battery per day
  - [ ] Test on actual devices
  - [ ] Use battery profile on iOS/Android dev tools

**Estimated Time**: 2 days

---

## 4.8 Localization

### Task 4.8.1: Multi-Language Support

**Objective**: Support Hindi (default), English, and 8 regional languages

Mobile app:

- [ ] **Use `intl` + `easy_localization` packages**
  - [ ] Create JSON files for each language:
    - [ ] `assets/translations/en.json`
    - [ ] `assets/translations/hi.json`
    - [ ] `assets/translations/ta.json` (Tamil)
    - [ ] `assets/translations/te.json` (Telugu)
    - [ ] ... (8 total)

  - [ ] Example structure:
    ```json
    {
      "onboarding": {
        "title": "🙏 KumbhRaksha",
        "subtitle": "Protecting Every Pilgrim"
      },
      "alerts": {
        "witness_alert": "You were near them"
      }
    }
    ```

- [ ] **Text Replacement**
  - [ ] Replace all hardcoded strings with localized keys
  - [ ] Format: `tr('onboarding.title')`

- [ ] **RTL Support** (for Hindi/other scripts)
  - [ ] Flutter handles automatically, but test text direction
  - [ ] Test on devices set to Hindi language

- [ ] **Testing**
  - [ ] Test each language on actual device
  - [ ] Verify text doesn't overflow
  - [ ] Test date/time formatting per locale

**Estimated Time**: 1.5 days

---

## 4.9 Documentation & Deployment

### Task 4.9.1: App Documentation

- [ ] **README.md**
  - [ ] Setup instructions (Flutter, Android, iOS)
  - [ ] Building from source
  - [ ] Running tests
  - [ ] Architecture overview

- [ ] **API Documentation**
  - [ ] OpenAPI/Swagger spec for all backend endpoints
  - [ ] Example requests/responses
  - [ ] Authentication flow

- [ ] **Deployment Guide**
  - [ ] Android: build signed APK, release on Play Store
  - [ ] iOS: build signed IPA, release on App Store
  - [ ] Backend: deployment to production server

**Estimated Time**: 1 day

---

## 4.10 Final Testing & QA

### Task 4.10.1: Comprehensive Testing

- [ ] **Functional Testing**
  - [ ] All screens and flows tested on Android + iOS
  - [ ] All API endpoints tested
  - [ ] All error cases handled
  - [ ] Permissions flow correct

- [ ] **UI/UX Testing**
  - [ ] Test on various screen sizes (small phones, tablets)
  - [ ] Test on low-end devices (Android 6, 2GB RAM)
  - [ ] Verify accessibility (text contrast, button sizes)

- [ ] **Security Testing**
  - [ ] Verify auth tokens not leaked in logs
  - [ ] Verify sensitive data encrypted in local storage
  - [ ] Test against injection attacks (API inputs validated)

- [ ] **Regression Testing**
  - [ ] Run all unit/integration tests
  - [ ] Run E2E tests
  - [ ] Manual smoke test of critical flows

**Estimated Time**: 2 days

---

## PHASE 4 CHECKLIST

- [ ] Audio beacon feature working
- [ ] Family melody selection and playback
- [ ] Beacon triggered from dashboard and played on devices
- [ ] SMS escalation integrated (MSG91 or similar)
- [ ] iOS background BLE optimized
- [ ] Onboarding educates about iOS limitations
- [ ] Load testing completed: 10K concurrent users supported
- [ ] API response times: p95 <500ms
- [ ] Offline report queue working
- [ ] Offline sync triggering when online
- [ ] App startup time: <3s
- [ ] Alert feed rendering at 60 FPS
- [ ] APK/IPA size: <50MB
- [ ] Battery impact: <10%/day
- [ ] All UI strings localized to 9 languages
- [ ] Hindi & regional language support working
- [ ] Documentation complete
- [ ] Deployment guides written
- [ ] All unit/integration tests passing
- [ ] E2E tests passing on Android + iOS
- [ ] Security audit completed
- [ ] Manual QA testing on 3+ devices
- [ ] App ready for Play Store / App Store submission

**Phase 4 Duration**: 7 days

---

# Summary Timeline

```
Week 1 (Phase 1): BLE + Reporting         Days 1-7
  - ✅ BLE scanning/advertising
  - ✅ SQLite local storage
  - ✅ Onboarding & permissions
  - ✅ Report missing person form
  - ✅ Backend API + PostgreSQL

Week 2 (Phase 2): Alerts + Feed           Days 8-14
  - ✅ FCM push notifications
  - ✅ Witness alert matching (BLE)
  - ✅ GPS radius alerts + cascade
  - ✅ Home feed UI
  - ✅ Real-time WebSocket updates

Week 3 (Phase 3): Map + Dashboard         Days 15-21
  - ✅ Report sighting (proactive)
  - ✅ Active alerts map with layers
  - ✅ Authority dashboard (web)
  - ✅ Case management
  - ✅ Family group pre-registration
  - ✅ Attribute matching engine

Week 4 (Phase 4): Polish + Scale          Days 22-28
  - ✅ Audio beacon
  - ✅ SMS escalation
  - ✅ iOS background optimization
  - ✅ Load testing (10K users)
  - ✅ Offline resilience
  - ✅ Localization (9 languages)
  - ✅ Performance tuning
  - ✅ Final QA & deployment
```

---

# Technical Stack Summary

## Mobile App (Flutter)
- **Language**: Dart
- **Framework**: Flutter 3.x
- **State Management**: Riverpod or Provider
- **Local Database**: SQLite (via sqflite)
- **BLE**: flutter_blue_plus
- **Location**: geolocator
- **Push Notifications**: firebase_messaging
- **Maps**: google_maps_flutter
- **Camera**: camera, image_picker
- **HTTP Client**: dio
- **Localization**: easy_localization

## Backend (Node.js)
- **Framework**: Express.js
- **Database**: PostgreSQL + PostGIS extension
- **Real-time**: Socket.io (WebSocket)
- **Push Notifications**: Firebase Admin SDK
- **File Storage**: AWS S3 or Cloudinary
- **SMS**: MSG91 or similar service
- **Job Scheduler**: node-schedule or Bull (Redis queue)

## Dashboard (React)
- **Framework**: React 18+
- **Language**: TypeScript
- **State Management**: Redux or Zustand
- **UI Library**: Material-UI or Tailwind
- **Maps**: google-maps-react
- **Tables**: TanStack Table
- **Real-time**: Socket.io client
- **Build**: Vite or Create React App

## Infrastructure
- **Hosting**: AWS EC2 or equivalent
- **Database**: AWS RDS PostgreSQL
- **File Storage**: AWS S3
- **Push Notifications**: Firebase
- **SMS**: MSG91 API
- **Maps**: Google Maps API
- **DNS/CDN**: CloudFlare (optional)

---

# Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| BLE not discoverable in crowded areas | Combine with GPS radius alerts; BLE is supplement, not primary |
| iOS BLE background scanning limitations | Document in onboarding; offer GPS-only fallback; educate users |
| High data consumption (location + BLE) | Optimize update frequencies; test on real networks |
| False positive sightings | Attribute matching + witness feedback loop to refine |
| Low witness response rate | Make alerts prominent, use sound/vibration; educate in onboarding |
| Backend bottleneck on large-scale | Load test early; optimize queries; scale horizontally |
| Privacy concerns (BLE logging, location) | All data consent-based; BLE logs deleted after 2 hours; only uploaded on report |
| Authority dashboard not ready for live use | MVP sufficient for hackathon; polish UI/UX in Phase 4 |
| App crashes due to memory leaks | Early testing on low-end devices; use profiling tools |

---

# Success Metrics (Hackathon)

1. **Functional MVP**: All 4 phases complete, app runs on Android
2. **BLE Working**: Scanning/advertising/logging works locally
3. **End-to-End Flow**: Register → Report → Witness alert → Response (manual backend test)
4. **UI Polish**: Home feed, report form, map all usable and intuitive
5. **Authority Dashboard**: Basic case management view functional
6. **Documentation**: Clear README and setup instructions for judges

---

# Notes for Hackathon Execution

- **Day 1-2**: Focus on BLE + local storage. Don't worry about backend initially.
- **Day 3-4**: Get backend API and onboarding working. Test end-to-end.
- **Day 5-7**: Home feed + real-time alerts (WebSocket).
- **Day 8-11**: Map, sightings, family groups.
- **Day 12-14**: Authority dashboard MVP.
- **Day 15-21**: Polish, optimization, load testing.
- **Day 22-28**: Final testing, documentation, demo prep.

**For Demo**:
- Prepare pre-loaded test data (2-3 active cases)
- Have 2 phones ready to demonstrate witness alert flow
- Show dashboard with live case updates
- Highlight BLE + GPS dual-alert mechanism
- Emphasize family pre-registration one-tap report

---

This plan is comprehensive but flexible. Adjust timelines based on team size and availability. The core innovation (BLE witness alerts) should be prioritized over polish features (audio beacon, analytics) for a hackathon deadline.

