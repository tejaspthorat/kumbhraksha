# 🛕 KumbhRaksha

**AI-powered crowd management & missing-persons network for the Nashik Simhastha Kumbh Mela, Maharashtra.**

The Nashik Simhastha Kumbh Mela is one of the largest peaceful gatherings on Earth, drawing up to **17 million pilgrims a day** to the banks of the sacred Godavari River in Nashik. Managing public safety at this astronomical scale presents two critical challenges:
1. **Crowd Surges & Stampedes:** Rapidly developing bottleneck choke points around bathing ghats (e.g., Ramkund, Panchavati, Tapovan) can turn hazardous in minutes.
2. **Missing Persons:** Thousands of children and elderly individuals get separated from their families daily in a sea of humanity. Without active cellular internet connection or GPS devices, traditional search methods are slow and inefficient.

**KumbhRaksha** tackles both challenges using software and the smartphones people already carry—requiring no proprietary hardware or bracelets. It transforms the Integrated Command & Control Center (ICCC) dashboard into a real-time crowd telemetry hub and links pilgrims' phones into a passive, local, and collaborative missing-persons search network with auto-expanding geofenced cascades.

---

## 📑 Table of Contents
1. [System Architecture](#-system-architecture)
2. [Component Stack Matrix](#-component-stack-matrix)
3. [Deep-Dive Feature Catalog](#-deep-dive-feature-catalog)
   - [Citizen Mobile App (Flutter)](#1-citizen-mobile-app-flutter)
   - [ICCC Dashboard (Next.js)](#2-iccc-dashboard-nextjs)
   - [Core REST API & Real-Time Gateway (Express)](#3-core-rest-api--real-time-gateway-express)
   - [Crowd-Vision AI Service (Flask + YOLOv8)](#4-crowd-vision-ai-service-flask--yolov8)
4. [End-to-End Data Flows & Connections](#-end-to-end-data-flows--connections)
   - [Reactive Missing Person Report (Flow A)](#flow-a-reactive-missing-person-report--alert-cascade)
   - [Proactive Lost-Person Sighting (Flow B)](#flow-b-proactive-lost-person-sighting--triage)
   - [Crowd-Vision Telemetry to ICCC Intervention](#flow-c-crowd-vision-telemetry-to-iccc-intervention)
   - [Passive BLE Witness Encounter Tracking](#flow-d-passive-ble-witness-encounter-tracking)
5. [Database Model & Schema Relations](#-database-model--schema-relations)
6. [Repository Structure](#-repository-structure)
7. [Installation & Local Setup](#-installation--local-setup)
8. [Configuration & Environment Variables](#-configuration--environment-variables)
9. [Geography Context](#-geography-context)

---

## 🏗️ System Architecture

The ecosystem relies on four specialized services that coordinate in real time over WebSockets, Server-Sent Events (SSE), and REST APIs:

```mermaid
flowchart TB
    %% Nodes
    subgraph ClientLayer ["Pilgrim & Staff Devices"]
        MobileApp["📱 Citizen Mobile App<br/>(Flutter)"]
        CoordApp["📱 Mobile Coordinator Client<br/>(REST / WebSockets)"]
    end

    subgraph FrontLayer ["Web Application Gateways"]
        NextFront["🖥️ Next.js Web Frontend<br/>(Landing + Public Forms)"]
        ICCCDash["🖥️ ICCC Dashboard<br/>(Next.js 16 App Router)"]
        NextAPI["🔄 Next.js API Gateway<br/>(/api/[...path])"]
    end

    subgraph ServiceLayer ["Core & Intelligence Services"]
        ExpressBack["⚙️ Express Core API Server<br/>(Express + TypeScript)"]
        SocketServer["🔄 Socket.io Event Bus<br/>(Port 3001)"]
        FlaskYolo["🐍 Crowd-Vision Service<br/>(Flask + YOLOv8 + OpenCV)"]
    end

    subgraph DataLayer ["Database & Cache Infrastructure"]
        Postgres[(Supabase PostgreSQL<br/>+ PostGIS Geospatial)]
        PrismaORM["💎 Prisma ORM Client"]
    end

    subgraph External ["External Networks & Telemetry"]
        CCTV[(Mela CCTV Streams / RTSP)]
        SMS_GW[Twilio / MSG91 SMS Gateway]
        FCM[Firebase Cloud Messaging]
    end

    %% Connections
    MobileApp -- "1. REST Reports & BLE Witnesses" --> ExpressBack
    MobileApp -- "2. WebSocket Alert Stream" --> SocketServer
    CoordApp -- "REST Tasks & Updates" --> ExpressBack
    CoordApp -- "Socket Status Sync" --> SocketServer

    NextFront & ICCCDash --> NextAPI
    NextAPI -- "Proxy with Clerk Auth Context" --> ExpressBack

    ExpressBack --> PrismaORM --> Postgres
    ExpressBack -- "Trigger SMS Cascade" --> SMS_GW
    ExpressBack -- "Push Notifications" --> FCM

    FlaskYolo -- "RTSP Frames" --> CCTV
    FlaskYolo -- "Real-Time Stats & Streams" --> ExpressBack
    ICCCDash -- "Direct Stream Frame & Heatmap" --> ExpressBack

    %% Style
    style ClientLayer fill:#eef2ff,stroke:#3b82f6,stroke-width:2px
    style FrontLayer fill:#f0fdf4,stroke:#22c55e,stroke-width:2px
    style ServiceLayer fill:#fff7ed,stroke:#f97316,stroke-width:2px
    style DataLayer fill:#faf5ff,stroke:#a855f7,stroke-width:2px
```

---

## 📊 Component Stack Matrix

| Directory | Name / Component | Technology Stack | Core Responsibility |
| :--- | :--- | :--- | :--- |
| [`mobile_app/`](file:///c:/Users/Yash%20Avsarmal/Desktop/kumbhraksha/mobile_app) | **Citizen Mobile App** | Flutter · Dart · Provider · SQLite · `flutter_blue_plus` | Pilgrim interface, passive BLE peer discovery logging, report filing, and local geo-targeted alerts. |
| [`web/frontend/`](file:///c:/Users/Yash%20Avsarmal/Desktop/kumbhraksha/web/frontend) | **ICCC Web Dashboard** | Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Leaflet · Clerk | Integrated Command & Control Center operations, interactive maps, sighting triage, AI predictions, and task dispatcher. |
| [`web/backend/`](file:///c:/Users/Yash%20Avsarmal/Desktop/kumbhraksha/web/backend) | **Core Express API** | Node.js · Express · Prisma · PostgreSQL + PostGIS · Socket.io | Core database persistence, Clerk user context mapping, geofenced proximity alerts, SMS integrations, and SSE stream. |
| [`fast-api/`](file:///c:/Users/Yash%20Avsarmal/Desktop/kumbhraksha/fast-api) | **Crowd-Vision AI Service** | Python · Flask · YOLOv8 (Ultralytics) · OpenCV | Real-time object detection, density tier classification, zone metrics extraction, and video frame/heatmap streaming. |
| [`data/`](file:///c:/Users/Yash%20Avsarmal/Desktop/kumbhraksha/data) | **Reference Geography** | KML Parsing scripts & GeoJSON datasets | Geographic definitions for Nashik Mela sectors, bathing ghat coordinates, and 4,000+ CCTV camera positions. |

---

## 🧩 Deep-Dive Feature Catalog

### 1. Citizen Mobile App (Flutter)
A battery-efficient mobile application optimized for high-density, low-connectivity scenarios.
*   **Passive BLE Witness Engine:**
    *   Continuously scans for nearby KumbhRaksha apps broadcasting the service UUID `1234abcd-e567-89ab-cdef-0123456789ab`.
    *   Calculates relative distances using the log-distance path-loss model:  
        $$\text{Distance} = 10^{\frac{\text{txPower} - \text{RSSI}}{10 \cdot n}}$$  
        where reference $\text{txPower} = -59\text{ dBm}$ (at 1 meter) and path loss exponent $n = 2.0$.
    *   Logs encounters locally in SQLite (`BleEncounter` table) storing: `peerUuid`, `rssi`, `estimatedDistance`, `timestamp`, and the device's current `GPS` location.
    *   **Rotating UUID Privacy:** Rotates the device’s BLE broadcast address/payload every 15 minutes (with a 5-minute grace period overlap) to prevent malicious third-party tracking.
    *   **Rolling Window GC:** Automatically flushes SQLite logs older than 2 hours every 10 minutes to minimize local storage usage.
*   **Reactive Missing Reporting (Flow A):**
    *   One-tap reporting with critical identifiers: Name, Age, Gender, **clothing details (highly prioritized)**, physical description, medical conditions (e.g. dementia, autism), last-seen location (auto-GPS or map pin), and last-seen time.
    *   Pre-seeds reports with pre-registered family member profiles.
    *   Calculates and displays the exact count of nearby active Bluetooth witnesses notified when a report is filed.
*   **Proactive Sighting (Flow B):**
    *   "I see someone who looks lost" button always accessible on the dashboard.
    *   Quick camera capture + automatic GPS tag submission.
*   **Geofenced Alert Feed:**
    *   Pulls active alerts from `/api/missing/feed`, sorted by proximity to the pilgrim’s live coordinates.
    *   Establishes real-time connection over WebSockets (fallback to SSE) to prepend new cases without requiring manual pull-to-refresh.
*   **Witness Memory Recall:**
    *   If a missing person’s last-known location matches a pilgrim’s BLE encounter log history, the system displays a guided verification card: *"Did you see Aarav Sharma in a yellow kurta near Ramkund around 15:40?"*

### 2. ICCC Dashboard (Next.js)
A tactical, high-performance command center dashboard built around a unified operations map.
*   **Live Operations Map:**
    *   Leaflet-based canvas showing real-time positions of active missing reports (pulsing red pins), unverified sightings (yellow pins), field coordinators (blue pins), and physical CCTV cameras.
    *   Extrapolates anonymized pilgrim GPS coordinates into a dynamic crowd density heatmap.
*   **Missing Persons Pipeline:**
    *   Interactive Kanban board and search table tracking case progression: `REPORTED` $\rightarrow$ `SEARCHING` $\rightarrow$ `SIGHTING_RECEIVED` $\rightarrow$ `VERIFICATION` $\rightarrow$ `REUNITED` $\rightarrow$ `ESCALATED`.
*   **Alert Broadcast & Auto-Cascade Engine:**
    *   Coordinates the 5-tier timed cascade. The alert radius automatically expands based on the elapsed time since the report was filed:
        
        | Time | Cascade Level | Target Alert Radius | Channels Involved | Actions Taken |
        | :--- | :--- | :--- | :--- | :--- |
        | **0 Min** | Level 0 (Immediate) | $500\text{ m}$ | App Push | ICCC alert sound; nearby CCTV streams are highlighted. |
        | **5 Min** | Level 1 (Priority) | $1,000\text{ m}$ ($1\text{ km}$) | App Push | Alert card promoted to the top of nearby feeds. |
        | **15 Min** | Level 2 (Sector-wide) | $2,000\text{ m}$ ($2\text{ km}$) | App Push + SMS | SMS sent to users in the sector; case escalated to senior officer. |
        | **30 Min** | Level 3 (Mela-wide) | $4,000\text{ m}$ ($4\text{ km}$) | App Push + SMS | Active Mela-wide search (children/elderly); cross-reference hospital database. |
        | **60 Min** | Level 4 (Full Escalation)| $8,000\text{ m}$ ($8\text{ km}$) | Cell Broadcast | Cell broadcast (with admin approval); police case registered. |
    *   Admins can override the cascade at any time (e.g., manually scaling to Level 3 immediately for a missing toddler).
*   **Sighting Triage Queue:**
    *   Aggregates citizen uploads. Uses AI photo comparison side-by-side to show similarity scores against open cases.
    *   One-click triage actions: `Match with Case #X` / `Create New Case` / `Dismiss`.
*   **CCTV Coverage & Blind Spot Analytics:**
    *   Generates a Voronoi diagram based on the coordinates of 4,000+ CCTV cameras to visualize coverage zones.
    *   Highlights blind spots (uncovered areas).
    *   If a person is reported missing in a blind spot, the dashboard flags: *"⚠️ Last seen in Blind Spot - expanding citizen alert radius by 50% & calculating volunteer patrol routes."*
*   **Field Coordinator Task Manager:**
    *   ICCC dispatchers can click any point on the map to create a coordinator task (e.g. *"Clear bottleneck at Gate 3"* or *"Locate Kamla Devi near sector boundary"*).
    *   Pushes notifications and handles status updates (`PENDING` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED` $\rightarrow$ `NEEDS_HELP`) in real-time over Socket.io.
*   **Groq AI Safety Insights:**
    *   Integrates with LLMs over Groq API to analyze live density stats, camera data, and tasks.
    *   Generates predictive alerts, crowd dispersion recommendations, and emergency decisions.
*   **Interactive Venue & Floor Plan Designer:**
    *   Vector room layout tool allowing command center to draw corridors, evacuation routes, entry gates, and structures.
    *   Tracks structural occupancy levels and maps volunteer check-ins.

### 3. Core REST API & Real-Time Gateway (Express)
Acts as the secure database interface and event router.
*   **Next.js Proxy Gateway:** Pre-validates Clerk sessions for frontend dashboard requests, appends user context headers (`x-user-id`, `x-user-email`), and forwards them to the Express server (port 5001). Bypasses auth checks for public and mobile routes.
*   **SSE missing-persons Stream:** Surfaces the `/api/missing/stream` event stream. Dashboard clients connect via SSE to receive instantaneous, low-latency updates on missing reports and sightings.
*   **Tasks & Audits Log:** Maintains immutable event logs (`CoordinatorTaskAuditLog`) tracking task status updates, actor context (coordinator email vs public visitor tokens), IP hashes, and agent headers for audit trails.
*   **PostGIS Proximity Queries:** Performs spatial index queries using standard SQL:
    ```sql
    SELECT * FROM "MissingReport" 
    WHERE ST_DWithin(lastSeenGeo, ST_MakePoint(lat, lng)::geography, alertRadiusMeters);
    ```

### 4. Crowd-Vision AI Service (Flask + YOLOv8)
A real-time Python service performing object detection on camera feeds.
*   **YOLOv8 Object Detection:** Runs inference on video streams (`crowd.mp4` or RTSP camera endpoints) using the lightweight `yolov8n.pt` model.
*   **Density Tier Calculation:** Group counts into density classes:
    *   **Low:** $\le 10$ people detected (Green box overlays)
    *   **Medium:** $11 - 25$ people detected (Yellow box overlays)
    *   **High:** $\ge 26$ people detected (Red box overlays)
*   **Spatial Zone Tracking:** Automatically splits video frames (Left half vs Right half) to calculate specific density shifts between banks (e.g. Ramkund Bank vs Godavari Bank).
*   **Heatmap Generation:** Accumulates coordinates over a rolling 150-frame buffer, projects circle clusters, applies a Gaussian Blur, and alpha-blends it with the raw stream to yield an organic, thermal-style activity overlay.
*   **Stats API:** Exposes endpoints providing current person count, density level, frame JPEG streams, and heatmap output.

---

## 🔄 End-to-End Data Flows & Connections

### Flow A: Reactive Missing Person Report & Alert Cascade
This flow details what happens when a family member files a report:

```
[Family Smartphone] 
       │ (1. POSTs report with photo, clothing description & GPS)
       ▼
[/api/missing/reports] (Express API Backend)
       │
       ├─► [Supabase PostgreSQL] (Saves records & updates index)
       │
       ├─► [SSE /api/missing/stream] (Broadcasts "report:new" event) ──► [ICCC Dashboard] (Alert sound, maps pulse)
       │
       └─► [PostGIS Query Engine] (Finds all CitizenUsers within 500m)
                 │
                 ▼
     [Firebase Cloud Messaging]
                 │
                 ▼
       [Citizen Smartphones] (Flashes push notification to nearby pilgrims)
                 │
                 ▼ (If case remains unresolved...)
     [Timed Cascade Scheduler] (Radius expands: 500m ──► 1km ──► 2km ──► 4km ──► 8km)
                 │
                 └─► [SMS Gateway] (Pushes SMS blasts to sector subscribers)
```

### Flow B: Proactive Lost-Person Sighting & Triage
This flow is triggered when a pilgrim notices a lost child or disoriented elder:

```
[Pilgrim Smartphone] 
       │ (1. Clicks "Looks Lost" - snaps photo & captures GPS)
       ▼
[/api/missing/sightings] (Express API Backend)
       │
       ├─► [Supabase PostgreSQL] (Saves sighting as PENDING)
       │
       └─► [SSE /api/missing/stream] (Broadcasts "sighting:new" event)
                 │
                 ▼
       [ICCC Dashboard] (Appears in Sighting Triage Queue)
                 │
                 ├─► [Groq AI comparison / UI] (Evaluates facial/clothing matching confidence)
                 │
                 └─► [Authority User Triage] 
                           ├─► MATCH: Links to open case ──► Notifies Family & assigned Field Team
                           ├─► DISMISS: False alarm
                           └─► CREATE NEW: Escalates to a new open case
```

### Flow C: Crowd-Vision Telemetry to ICCC Intervention
How real-time video analytics trigger physical crowd routing:

```
[CCTV Video Feed] ──► [Flask YOLOv8 Engine] (Performs detection, counts, & maps heat overlay)
                                │
                                ▼ (If person count exceeds 'High' threshold > 25)
                     [/api/alerts (POST)]
                                │
                                ▼
                       [Express API Backend]
                                │
                                ├─► [SSE Stream] ──► [ICCC Dashboard Map] (Flashing orange safety hazard warnings)
                                │
                                └─► [Groq AI Copilot] (Suggests: "Crowd bottleneck at Ramkund. Deploy 3 coordinators.")
                                          │
                                          ▼
                                 [ICCC Dispatcher]
                                          │ (Creates task: "Clear bottleneck at Ramkund Bank")
                                          ▼
                             [Socket.io Task Update]
                                          │
                                          ▼
                               [Coordinator Mobile App] (Vibrates, coordinates route path, updates status)
```

### Flow D: Passive BLE Witness Encounter Tracking
Detailed peer-to-peer tracking under the hood:

```
[Pilgrim A (Walking)]                         [Pilgrim B (Stationary / Child)]
        │                                                     │
        │ ◄──────────────────[1. BLE Broadcasts]───────────────┤ (Services UUID: 1234abcd...)
        │                                                     │
        ▼
[BLE Scan Discovery] (10s scan, 5s pause)
        │
        ├─► [RSSI / Path-Loss Calculation] (Estimates distance: e.g. 4.2 meters)
        │
        └─► [SQLite database] (Inserts encounter: Peer UUID, distance, GPS location, timestamp)
                 │
                 ▼ (If Pilgrim B is subsequently reported missing...)
        [Express Backend] (Fetches case last seen location + time)
                 │
                 ├─► [PostGIS Proximity Search] (Finds Pilgrim A was near Pilgrim B at 14:15)
                 │
                 ▼
        [Firebase Push Notification] ──► [Pilgrim A Device] (Opens guided: "Do you remember seeing Pilgrim B?")
```

---

## 🗄️ Database Model & Schema Relations

The PostgreSQL database is organized around the following Prisma entities and relationships:

```
      ┌──────────────────┐               ┌──────────────────┐
      │     Profile      │ 1           * │      Event       │
      │ (ICCC Admins)    ├───────────────┤ (Nashik Kumbh)   │
      └──────┬───────────┘               └────────┬─────────┘
             │ 1                                  │ 1
             │                                    │
             │ *                                  │ *
      ┌──────▼───────────┐               ┌────────▼─────────┐
      │      Staff       │ 1           * │ CoordinatorTask  │
      │ (Field Response) ├───────────────┤ (Dispatch Tasks) │
      └──────┬───────────┘               └────────┬─────────┘
             │ 1                                  │ 1
             │                                    │ 1
             │ *                                  ▼
      ┌──────▼───────────┐               ┌──────────────────┐
      │   LocationPing   │               │     GeoFence     │
      │ (Live Coordinates)│              │ (Task Proximity) │
      └──────────────────┘               └──────────────────┘

      ┌──────────────────┐               ┌──────────────────┐
      │  MissingPerson   │ 1           * │  MissingReport   │
      │ (Profile Info)   ├───────────────┤ (Active Case-A)  │
      └──────────────────┘               └──────┬───┬───────┘
                                                │ 1 │ 1
                                                │   │
                                              * │   │ *
      ┌──────────────────┐                      │   └──────────┐
      │     Sighting     │ *                    │              │
      │ (Found Sighting) ├──────────────────────┘              ▼
      └────────▲─────────┘                              ┌──────────────┐
               │ *                                      │ MissingAlert │
      ┌────────┴─────────┐                              │ (Cascade Log)│
      │   CitizenUser    │                              └──────────────┘
      │ (Smartphone node)│
      └──────────────────┘
```

*   **Profile:** Stores Clerks accounts representing Command Center dispatchers.
*   **Event:** Tracks current Mela festival specs, boundaries, and public task settings.
*   **Zone:** Sectors of the venue mapped to physical areas, containing staff assignments, crowd predictions, and density metrics.
*   **Staff & StaffTask:** Directory of on-duty field teams, roles (e.g. `COORDINATOR`, `MEDICAL`, `SECURITY`), coordinates (`LocationPing`), and their internal tasks.
*   **CoordinatorTask:** Real-time jobs dispatched to staff. Triggers automatic notification events and maps to geo-fence boundaries.
*   **MissingPerson:** Central demographic repository of reported individuals (photo, age, medical profile).
*   **MissingReport:** Represents active missing cases (Flow A). Holds geofenced search radii and dynamic cascade state levels.
*   **Sighting:** Citizens sighting reports (Flow B). Can exist independently (`PENDING`) or link to an active `MissingReport`.
*   **CitizenUser:** Represents anonymous pilgrims participating in the search network. Stores latest coordinate updates to verify search witness lists.
*   **CctvLocation:** Master coordinates of CCTV points used to calculate Voronoi coverage profiles and blind spots.

---

## 📁 Repository Structure

```
kumbhraksha/
├── mobile_app/                  # Flutter Citizen App
│   ├── lib/
│   │   ├── core/                # Constants, network client, routing
│   │   ├── data/                # Repository implementations & models
│   │   ├── domain/              # Business logic entities
│   │   ├── presentation/        # Screens (Alert Feed, Reporting, Map)
│   │   └── services/            # BLE Scanning, GPS Location, SQLite
│   └── pubspec.yaml             # Dart packages config
├── web/
│   ├── frontend/                # Next.js 16 ICCC Dashboard
│   │   ├── src/app/             # Pages (analytics, triage, floor designer)
│   │   └── src/components/      # Tactical UI buttons, layout tables, maps
│   ├── backend/                 # Express REST Backend Server
│   │   ├── prisma/              # Schema & database seeding scripts
│   │   └── src/routes/          # API handlers (tasks, missing logs, groq)
│   └── socket/                  # Dynamic Socket.io relay handler
├── fast-api/                    # YOLOv8 Crowd-Vision Python Service
│   ├── app.py                   # Flask server providing streams & stats
│   ├── main.py                  # Standalone YOLO detection & overlay script
│   └── requirements.txt         # Python dependencies
└── data/                        # Real Nashik Kumbh GIS datasets
```

---

## 🚀 Installation & Local Setup

To launch the ecosystem locally, run each component in a separate terminal:

### Prerequisites
*   Node.js (v18+)
*   Flutter SDK (3.11+)
*   Python (3.9+) with CUDA support (optional, for faster YOLO inference)
*   PostgreSQL with PostGIS extension enabled

---

### Step 1: Core API Server (`web/backend`)
1.  Navigate to the backend directory:
    ```bash
    cd web/backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your database URL in `.env`.
4.  Generate the Prisma Client:
    ```bash
    npx prisma generate
    ```
5.  Launch the development server:
    ```bash
    npm run dev
    ```
    *Server will start on:* `http://localhost:5001`

---

### Step 2: ICCC Dashboard (`web/frontend`)
1.  Navigate to the frontend directory:
    ```bash
    cd web/frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up your Clerk key variables and server URL in `.env.local`.
4.  Run the development build:
    ```bash
    npm run dev
    ```
    *Dashboard will start on:* `http://localhost:3000`

---

### Step 3: Crowd-Vision AI Service (`fast-api`)
1.  Navigate to the AI directory:
    ```bash
    cd fast-api
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv .venv
    .venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the Flask app:
    ```bash
    python app.py
    ```
    *AI Service will start on:* `http://localhost:5000`

---

### Step 4: Citizen Mobile App (`mobile_app`)
1.  Navigate to the mobile app directory:
    ```bash
    cd mobile_app
    ```
2.  Get Flutter packages:
    ```bash
    flutter pub get
    ```
3.  Set the API target IP in `lib/core/constants/api_constants.dart` (use `10.0.2.2` for Android Emulators to reach local host).
4.  Launch the app:
    ```bash
    flutter run
    ```

---

## ⚙️ Configuration & Environment Variables

### Core Backend Setup (`web/backend/.env`)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/kumbhraksha?schema=public"
DIRECT_URL="postgresql://postgres:password@localhost:5432/kumbhraksha?schema=public"
JWT_SECRET="your-jwt-signing-secret"
COORDINATOR_INTERNAL_SECRET="shared-secret-between-backend-and-sockets"
```

### Dashboard Setup (`web/frontend/.env.local`)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BACKEND_URL="http://localhost:5001"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
GROQ_API_KEY="gsk_..."
```

---

## 🗺️ Geography Context

All geographical metrics, coordinates, and simulations are grounded in the **real geography of Nashik, Maharashtra**. The Mela area coordinates are centered around **Ramkund, Panchavati**:

*   **Center Coordinate:** `19.995845, 73.797309`
*   **Geospatial Boundaries:** Includes sectors extending from Panchavati bazaar through Godavari banks to Tapovan transit camps.
*   **Mapping Engine:** Uses Leaflet maps configured to load offline-cacheable OpenStreetMap tile layers, protecting system uptime against cell tower network congestion.

---
*Built for pilgrim safety.*
