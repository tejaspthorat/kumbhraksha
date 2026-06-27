# Kumbhraksha API Documentation

This document describes the API routes exposed by the Node.js Express backend and how they are consumed by the Next.js frontend (acting as a Gateway) and mobile clients.

---

## 1. Architectural Overview & Ports

- **Next.js Frontend**: Runs on `http://localhost:3000`.
- **Express Backend**: Runs on `http://localhost:5001`.
- **API Gateway**: A Next.js catch-all route at `/api/[...path]/route.ts` intercepts all frontend API calls.
  - For dashboard routes, it verifies the Clerk session, appends user context headers (`x-user-id`, `x-user-email`, `x-user-name`), and proxies the request to the Express server.
  - For public and mobile routes, it bypasses Clerk validation and forwards requests directly.

---

## 2. Authentication Methods

| Auth Type | Header Name / Format | Description | Target Routes |
| :--- | :--- | :--- | :--- |
| **Clerk Gateway Context** | `x-user-id`, `x-user-email`, `x-user-name` | Injected by Next.js Gateway after Clerk auth check. | Admin / Dashboard endpoints |
| **Mobile JWT** | `Authorization: Bearer <token>` | Issued on successful login. Signed with `JWT_SECRET`. | Mobile endpoints |
| **Internal Secret** | `x-coordinator-internal-secret` | Shared secret to allow server-to-server notifications. | Real-time socket events |
| **Public Access** | None (Rate Limited) | Open endpoints protected by Cloudflare Turnstile CAPTCHA. | Public coordinator task creation |

---

## 3. API Catalog

### 3.1. Dashboard & Core Management

#### GET `/api/dashboard`
- **Auth**: Admin Clerk
- **Description**: Returns all metrics, zones, staff, devices, camera lists, alerts, and forecasts for the dashboard.
- **Response (200 OK)**:
  ```json
  {
    "profileId": "user_...",
    "rooms": [],
    "entries": [],
    "suggestions": [],
    "alerts": [],
    "cameras": [],
    "devices": [],
    "staff": [],
    "tasks": [],
    "zones": []
  }
  ```

#### GET `/api/events`
- **Auth**: Admin Clerk
- **Description**: Lists events belonging to the admin's profile.
- **Response (200 OK)**: `Event[]` (Prisma schema type)

#### GET/POST/PUT/DELETE `/api/floor-plan`
- **Auth**: Admin Clerk
- **Description**: Standard CRUD operations for managing venue floor plans, entry points, evacuation routes, and corridors.

#### POST `/api/groq`
- **Auth**: Admin Clerk
- **Description**: Processes crowd safety analysis requests (predictions, suggestions, decisions) using Groq AI.
- **Request Body**:
  ```json
  {
    "type": "predictions" | "suggestions" | "decisions",
    "payload": { ... }
  }
  ```

---

### 3.2. Coordinator Tasks

#### GET `/api/coordinator-tasks`
- **Auth**: Admin Clerk
- **Query Params**: `eventId`, `assignedToId`, `status`, `limit` (max 100)
- **Description**: Lists coordinator tasks matching the filters.

#### POST `/api/coordinator-tasks`
- **Auth**: Admin Clerk
- **Description**: Creates a new task for a coordinator. Automatically emits a socket event to update the coordinator's app.
- **Request Body**:
  ```json
  {
    "title": "Clear Gate A",
    "description": "High density detected near entrance",
    "priority": "HIGH",
    "assignedToId": 42,
    "eventId": "event-1",
    "locationLat": 25.1234,
    "locationLng": 81.5678,
    "locationLabel": "Main Gate",
    "deadline": "2026-06-27T18:00:00Z"
  }
  ```

---

### 3.3. Mobile Coordinator App

#### POST `/api/mobile/login`
- **Auth**: None (Public)
- **Description**: Authenticates coordinator staff credentials and returns a mobile JWT.
- **Request Body**:
  ```json
  {
    "email": "coordinator@kumbh.gov.in",
    "password": "secure_password"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "staff": { "id": 1, "name": "Rajesh Kumar", "email": "..." }
  }
  ```

#### GET `/api/mobile/tasks`
- **Auth**: Mobile JWT
- **Description**: Fetches tasks assigned to the authenticated coordinator, ordered by priority and deadline.

#### PATCH `/api/mobile/tasks/:id/status`
- **Auth**: Mobile JWT
- **Description**: Coordinator updates task status (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `NEEDS_HELP`). Notifies socket server.
- **Request Body**:
  ```json
  {
    "status": "COMPLETED",
    "note": "Crowd successfully dispersed."
  }
  ```

---

### 3.4. Public Submissions (Citizen Form)

#### POST `/api/public/coordinator-tasks`
- **Auth**: Captcha (Turnstile) + Rate Limited
- **Description**: Allows public visitors to report issues/create coordinator tasks.
- **Request Body**:
  ```json
  {
    "title": "Lost Item / Overcrowding at Gate 4",
    "description": "Details...",
    "priority": "MEDIUM",
    "eventId": "event-uuid",
    "assignedToId": 2,
    "publicCreatorName": "Anonymous",
    "publicCreatorEmail": "citizen@gmail.com",
    "turnstileToken": "XXXXXX"
  }
  ```
- **Response (201 Created)**: Returns the task detail, an `editorToken`, and a unique `editUrl` to modify the task later.

#### GET/PATCH `/api/public/coordinator-tasks/:taskId`
- **Auth**: Public + Token verified in headers (`x-task-editor-token`) or query param (`?token=...`)
- **Description**: Returns or updates the public coordinator task if the client possesses the correct editor token.

---

### 3.5. Missing Persons Tracking

#### GET `/api/missing/feed`
- **Query Params**: `lat`, `lng`
- **Description**: Returns active missing person reports sorted by geospatial proximity to the coordinator's location.

#### GET/POST `/api/missing/reports`
- **Description**: Lists all reports or creates a new missing person report.

#### GET/PATCH `/api/missing/reports/:id`
- **Description**: Retrieves a report or updates its status (e.g., `REUNITED`).

#### GET/POST `/api/missing/sightings`
- **Description**: Returns sightings or registers a new sighting (spotter name, photo, coordinates).

#### PATCH `/api/missing/sightings/:id`
- **Description**: Triages a sighting (`match`, `dismiss`, or `new` report).

---

## 4. Consumption Examples in Next.js Frontend

Because the Next.js gateway maps relative routes seamlessly, your frontend fetch code remains simple:

### Example: Loading Dashboard Data
```typescript
async function fetchDashboard() {
  const response = await fetch('/api/dashboard');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard');
  }
  return await response.json();
}
```

### Example: Creating a Coordinator Task
```typescript
async function createTask(taskData: any) {
  const response = await fetch('/api/coordinator-tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  });
  return await response.json();
}
```
*Note: Clerk authentication cookies (`__session`) are automatically sent by the browser and parsed by the Next.js Gateway.*
