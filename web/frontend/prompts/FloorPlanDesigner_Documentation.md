# Floor Plan Designer - Issues & Partially Implemented Features

This document provides a detailed breakdown of the features, tools, and API endpoints within the Floor Plan Designer that are **partially implemented** or **currently not working**.

## 1. Partially Implemented Drawing Tools

The Zustand store (`src/lib/floorPlanStore.ts`) defines several interactive tools, but the primary visual canvas (`src/components/floor-plan/FloorPlanCanvas.tsx`) lacks the required event handlers (mouse down, mouse move, mouse up) to make them functional.

### A. Draw Corridor (`activeTool === 'draw-corridor'`)
- **Status:** Partially Implemented (UI missing)
- **Store & State:** 
  - Defined in `ToolType`.
  - State variables `corridorFromRoomId` and `corridorFromPoint` exist. 
  - Action `addCorridor` exists.
- **Problem:** When the user selects the "draw-corridor" tool, clicking and dragging on the canvas does nothing. The `handleMouseDown` and `handleMouseUp` events in `FloorPlanCanvas.tsx` only process room and entry point creation.
- **Impact:** Users cannot establish pathways between designated zones.

### B. Draw Evacuation Route (`activeTool === 'draw-evacuation'`)
- **Status:** Partially Implemented (UI missing)
- **Store & State:**
  - Defined in `ToolType`.
  - Action `addEvacuationRoute` exists.
- **Problem:** Clicking on the canvas does not capture `(x, y)` coordinate points to build the array of routing points needed for the `EvacuationRoute` model.
- **Impact:** Unable to map emergency escape paths visually on the layout.

### C. Add Asset (`activeTool === 'add-asset'`)
- **Status:** Partially Implemented (UI missing)
- **Store & State:**
  - Defined in `ToolType`.
  - Assets state array, `addAsset`, `updateAsset`, `deleteAsset` actions exist.
  - Configuration `ASSET_CATEGORIES` and `ASSET_ICONS` exist.
- **Problem:** Clicking on the canvas does not trigger an asset placement modal or spawn an asset marker at the cursor's coordinates.
- **Impact:** Fire extinguishers, AEDs, seating, and tables cannot be mapped onto the floor plan.

---

## 2. Incomplete Data Flow & UI Interactivity 

### A. Role-Based Check-in / Check-out Simulation
- **Status:** Partially Implemented
- **Store & State:**
  - `assignUser`, `checkInUser`, and `checkOutUser` functions exist in `floorPlanStore.ts`.
- **Problem:** There are no interactive components or contextual menus on the UI canvas (like right-clicking a room or a user marker) to trigger `checkInUser(userId)`. 
- **Impact:** The system cannot visually simulate live crowd occupancy fluctuations. The dynamic heatmap coloring and alerting thresholds (which rely on simulated active occupancy) stay static.

### B. Alerts & Notifications
- **Status:** Partially Implemented
- **Store & State:**
  - `alertThreshold` defaults to 85% for rooms.
  - The store automatically evaluates occupancy capacity and pushes `AlertEntry` models into the `alerts` array.
- **Problem:** Because `checkInUser` is never invoked by the interface natively, the capacity limits are never breached, and the auto-generated threshold alerts are never effectively tested or visualized in the UI.

### C. Minimap Rendering Shortcomings
- **Status:** Incomplete Visual Sync
- **Code Reference:** Minimap calculation block in `FloorPlanCanvas.tsx`.
- **Problem:** The dynamic Minimap rendering calculates bounds and draws rectangles only for `#rooms`. It completely ignores `corridors`, `assets`, and `entryPoints`.
- **Impact:** The minimap is inaccurate to the full venue layout.

---

## 3. API Endpoints (`/api/floor-plan`)

The API itself (`src/app/api/floor-plan/route.ts`) is fully functional in terms of CRUD operations interacting with Prisma, but it highlights the gap between backend capabilities and frontend tools.

- **`GET /api/floor-plan?id=<planId>`** 
  - Correctly loads all hierarchical relational data including `corridors`, `assets`, and `evacuationRoutes`. 
  - **Issue:** Frontend drops this state visually because the canvas lacks rendering/interactive tools to manipulate the loaded entities.
  
- **`POST /api/floor-plan` & `PUT /api/floor-plan`**
  - Designed to persist the complex Zustand store correctly. It utilizes a reliable `crypto.randomUUID()` map strategy to recreate relationships without collision.
  - **Issue:** The API relies on `roomId`, `floorLevelId`, and point structures that the frontend Tools (due to missing Canvas mouse handlers) cannot currently produce. Therefore, POST metrics for Assets, Corridors, and Escape Routes will perpetually submit empty arrays `[]`.

---

## 4. Multi-Floor / Blueprint Features

### A. Copy Floor Layout
- **Status:** Logic Implemented, UI Button Missing
- **Store & State:** 
  - `copyFloorLayout(fromFloorId, toFloorId)` exists in store state.
- **Problem:** The tool allows cloning a blueprint's rooms from one floor to another, but there is no accessible UI button to call this function in the main dashboard or sidebar.
