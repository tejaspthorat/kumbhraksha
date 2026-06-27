# 2D Floor Mapping — Full Feature Implementation Prompt

## Project Context
You are enhancing an existing Next.js + React-based 2D Room Designer into a full-featured
**Interactive Floor Plan & Coordination Platform**. The current system supports:
- Adding rectangular rooms to a canvas with density heatmap coloring
- Entry point markers
- Sidebar room listing with selection sync
- Basic real-time capacity/area metrics

This prompt covers ALL new features and improvements to build on top of this foundation.
Use TailwindCSS + shadcn/ui for UI. Use Framer Motion for animations. Use Zustand for state.
Canvas interactions should be built with raw pointer events (no external canvas libs required).

---

## SECTION 1: Canvas Interaction Overhaul

### 1.1 — Drag-to-Draw Room Creation
Replace the "Add Room" button auto-spawn with a **Draw Mode**:
- When "Draw Room" tool is active, clicking and dragging on the canvas draws a rectangle
- On mouse release, a modal pops up asking for: Room Name, Room Type, Color (optional override)
- Minimum size guard: rooms smaller than 40x40px are discarded with a toast warning
- Room dimensions are derived from pixel dimensions converted to m² using a configurable scale
  (default: 1 grid cell = 1m²)

### 1.2 — Resize Handles
- Selected rooms show 8 resize handles (corners + edge midpoints)
- Dragging a corner handle resizes the room proportionally
- Dragging an edge handle resizes only that axis
- Minimum room size enforced during resize (40x40px)
- Re-calculate area + capacity metrics live during resize

### 1.3 — Zoom & Pan Viewport
- Mouse wheel → zoom in/out (range: 0.3x to 3x), centered on cursor position
- Middle mouse button drag OR Space + drag → pan canvas
- Zoom level indicator in bottom-right corner ("120%")
- "Fit to Screen" button that auto-zooms to fit all rooms in view
- Mini-map thumbnail in bottom-right that shows global layout and current viewport window

### 1.4 — Snap-to-Grid
- Grid cell size configurable (default 20px)
- Toggle "Snap to Grid" from toolbar — when active, rooms snap to nearest grid intersection
  during draw, drag, and resize
- Rooms also snap edges to other room edges within 8px proximity (magnetic snapping)

### 1.5 — Undo / Redo
- Maintain an action history stack (max 50 actions)
- Actions tracked: add room, delete room, move room, resize room, rename room,
  add entry point, delete entry point, draw corridor, assign user
- Ctrl+Z / Ctrl+Shift+Z keyboard shortcuts
- Undo/Redo buttons in toolbar with disabled state when stack is empty

---

## SECTION 2: Room Enhancements

### 2.1 — Room Types
Add a `type` field to each room with the following categories:
- General Area, Meeting Room, Restroom, Kitchen / Pantry, Storage, Emergency Exit,
  Reception / Lobby, Server Room, Open Workspace, Auditorium / Hall

Each type has:
- A default icon rendered in the room center (Lucide icon or emoji fallback)
- A default capacity multiplier override (e.g. Meeting Room = 1.5 p/m², Auditorium = 4 p/m²)
- A color suggestion (user can override)

### 2.2 — Room Annotations / Notes
- Each room has an optional `notes` text field
- In the room detail panel, show a text area for editing notes
- On the canvas, rooms with notes show a small sticky note icon in the top-right corner
- Hovering the icon shows a tooltip with the note text

### 2.3 — Room Connections (Corridors)
- A "Draw Corridor" tool in the toolbar
- Click on Room A edge, then click on Room B edge → draws a corridor line between them
- Corridors have configurable width (0.5m – 3m) and are counted in total area
- Corridors are rendered as filled rectangles or bezier paths between room edges
- Option to mark a corridor as "Primary Path" (green) or "Emergency Route" (red dashed)

### 2.4 — Evacuation Routes
- A separate "Evacuation Route" draw mode
- Draw polyline paths from any room to any entry/exit point
- Route lines are styled red + dashed with arrow direction indicators
- "Evacuation Plan View" toggle that highlights only evacuation routes + exits,
  dims all rooms for clarity

---

## SECTION 3: Multi-Floor Support

### 3.1 — Floor Tabs
- Top of the designer shows floor tabs: "Floor 1", "Floor 2", etc.
- "+" button to add a new floor (prompt for floor name/label, e.g. "Ground Floor", "Mezzanine")
- Each floor maintains its own independent rooms[], entryPoints[], corridors[], assignedUsers[]
- Switching floors persists the current floor's state before loading the selected floor
- Floor tab shows a badge with total room count

### 3.2 — Floor Settings
- Each floor has a settings popover: floor name, default scale (m² per grid cell), background
  color or image upload (e.g. import an existing floor plan image as a background layer)
- "Copy Layout from Floor X" utility to duplicate rooms from another floor

---

## SECTION 4: User Assignment & Coordination

### 4.1 — User Directory
- A "Users" panel (slide-over or sidebar tab) listing all team members
- User object: { id, name, role, avatar (initials fallback), email, status: 'available' | 'assigned' | 'checked-in' }
- Users are managed globally across all floors
- Roles: Coordinator, Security, Staff, Medical, Technician, Volunteer
- Each role has a distinct color badge

### 4.2 — Assign Users to Rooms
- In the room detail panel, show an "Assigned Users" section
- Searchable dropdown to pick and assign users from the directory
- A user can be assigned to ONLY ONE room at a time (re-assigning auto-removes from old room)
- Assigned users appear as avatar chips inside the room on the canvas (stacked if >3, show "+N")
- Sidebar room list shows a small avatar stack for rooms with assigned users

### 4.3 — Occupancy Check-In
- In the room detail panel, each assigned user has a "Check In" toggle button
- Checked-in users increment the room's `currentOccupancy` counter
- Canvas room shows a live "X / Y capacity" occupancy bar beneath the room label
  - Green fill if < 60%, Amber if 60–85%, Red if > 85%
- Global metrics panel updates: "Currently Checked In: X people" across all rooms

### 4.4 — User Search & Location
- Global search bar (Cmd+K shortcut) to search users by name
- Results show which floor + room they are assigned to
- Clicking a result navigates to that floor and highlights the room on canvas

---

## SECTION 5: Alerts & Threshold System

### 5.1 — Capacity Alerts
- Each room supports a custom `alertThreshold` (default 85% of max capacity)
- When currentOccupancy exceeds threshold, show:
  - Red pulse animation on the room in canvas
  - Toast notification: "[Room Name] is at X% capacity"
  - Alert badge on the room in the sidebar list

### 5.2 — Alert History Log
- A collapsible "Alert Log" panel at the bottom of the page
- Logs all threshold breach events with: timestamp, room name, floor, occupancy%
- Entries are color-coded: warning (amber), critical (red)
- "Clear Log" button

---

## SECTION 6: Asset / Furniture Placement

### 6.1 — Asset Library
- A collapsible "Assets" drawer in the toolbar
- Asset categories: Seating (Chair, Sofa, Bench), Tables (Round, Rectangular, Conference),
  Facilities (Podium, Stage, Whiteboard, TV Screen, Plant), Safety (Fire Extinguisher, AED)
- Each asset is a small SVG icon with a configurable size

### 6.2 — Placing & Managing Assets
- Drag asset from library → drop onto canvas (must be inside a room boundary, warn if outside)
- Assets can be selected, moved, rotated (90° increments), and deleted
- Assets do NOT affect capacity calculations by default, but can optionally reduce available area
  (e.g. a conference table reduces available standing area)
- Room detail panel shows an "Assets in this room" count

---

## SECTION 7: Layout Management

### 7.1 — Named Layout Snapshots
- "Save Layout" button → prompt for snapshot name → saves current full state to a snapshots array
- "Load Layout" dropdown → lists all saved snapshots with timestamp
- "Delete Snapshot" option per entry
- Snapshots are persisted to localStorage (and optionally synced to MongoDB if backend is available)

### 7.2 — Export
- "Export" button with options:
  - **PNG** — renders the canvas using html-to-canvas or a canvas render loop, exports as image
  - **PDF** — wraps PNG in a jsPDF document with metadata header (event name, date, total capacity)
  - **JSON** — exports the raw layout JSON for import/backup
- Import: accept a JSON file to restore a full layout

---

## SECTION 8: UI & UX Polish

### 8.1 — Toolbar Layout
Left vertical toolbar with tool groups separated by dividers:
- **Cursor Tools:** Select/Move, Draw Room, Draw Corridor, Draw Evacuation Route
- **Add Items:** Add Entry Point, Add Asset (opens asset drawer)
- **View:** Toggle Grid, Toggle Snap, Toggle Heatmap, Toggle Evacuation View
- **Actions:** Undo, Redo, Fit to Screen
- **Export / Save** in top-right header

### 8.2 — Right Panel (Context-Aware)
The right panel is context-sensitive based on selection:
- **Nothing selected:** Global metrics dashboard (total area, capacity, check-in count, alert count)
- **Room selected:** Room editor (name, type, color, area, capacity, threshold, notes, assigned users,
  asset count, evacuation route status)
- **User selected (from search):** User detail card (name, role, assigned floor+room, check-in status)
- **Corridor selected:** Corridor editor (width, type: primary/emergency, connected rooms)

### 8.3 — Keyboard Shortcuts
- `V` → Select/Move tool
- `R` → Draw Room tool
- `C` → Draw Corridor tool
- `E` → Add Entry Point
- `Delete` / `Backspace` → Delete selected element
- `Escape` → Deselect / cancel current draw
- `Ctrl+Z` / `Ctrl+Shift+Z` → Undo / Redo
- `Ctrl+S` → Save snapshot
- `Cmd+K` → Open user search
- `Space + Drag` → Pan canvas
- `G` → Toggle grid
- `H` → Toggle heatmap

### 8.4 — Onboarding Empty State
When the canvas is empty, show a centered guide overlay:
- Icon + message: "Start by drawing your first room"
- Animated arrow pointing to the "Draw Room" tool in the toolbar
- "Load Example Layout" button that loads a pre-built demo layout

---

## SECTION 9: Data Model
```typescript
interface Room {
  id: string
  name: string
  type: RoomType
  x: number
  y: number
  width: number
  height: number
  color: string
  notes?: string
  alertThreshold: number         // percentage (0-100)
  currentOccupancy: number
  assignedUserIds: string[]
  assetIds: string[]
  floorId: string
}

interface Floor {
  id: string
  name: string
  order: number
  scale: number                  // m² per grid cell
  backgroundImage?: string
  rooms: Room[]
  entryPoints: EntryPoint[]
  corridors: Corridor[]
}

interface User {
  id: string
  name: string
  role: UserRole
  email?: string
  status: 'available' | 'assigned' | 'checked-in'
  assignedRoomId?: string
  assignedFloorId?: string
}

interface Corridor {
  id: string
  fromRoomId: string
  toRoomId: string
  width: number
  type: 'primary' | 'emergency' | 'general'
  floorId: string
}

interface Asset {
  id: string
  type: AssetType
  x: number
  y: number
  rotation: number
  roomId: string
  reducesArea: boolean
  areaReduction: number          // m²
}

interface LayoutSnapshot {
  id: string
  name: string
  createdAt: string
  floors: Floor[]
  users: User[]
}
```

---

## SECTION 10: State Management (Zustand)

Create a single `useFloorStore` Zustand store with the following slices:
- `floors[]`, `activeFloorId`, `users[]`
- `selectedElementId`, `selectedElementType` ('room' | 'corridor' | 'entry' | 'asset')
- `activeTool`: 'select' | 'draw-room' | 'draw-corridor' | 'draw-evacuation' | 'add-entry' | 'add-asset'
- `snapToGrid: boolean`, `showGrid: boolean`, `showHeatmap: boolean`, `showEvacuationView: boolean`
- `viewport: { x, y, scale }`
- `history: LayoutSnapshot[]`, `historyIndex: number`
- `alerts: AlertEntry[]`
- `snapshots: NamedSnapshot[]`

Expose actions:
- `addRoom(floorId, room)`, `updateRoom(id, partial)`, `deleteRoom(id)`
- `assignUser(userId, roomId, floorId)`, `checkInUser(userId)`, `checkOutUser(userId)`
- `addCorridor(...)`, `deleteCorridor(id)`
- `pushHistory()`, `undo()`, `redo()`
- `setViewport(partial)`, `fitToScreen()`
- `saveSnapshot(name)`, `loadSnapshot(id)`
- `exportPNG()`, `exportPDF()`, `exportJSON()`, `importJSON(data)`

---

## Implementation Notes
- Use `react-use` for keyboard shortcut hooks
- Canvas pointer events should use `useRef` on the canvas wrapper div; transform the pointer
  position by `viewport.x`, `viewport.y`, `viewport.scale` before any coordinate math
- All canvas rendering is DOM-based (absolutely positioned divs), NOT `<canvas>` element
- Framer Motion `layoutId` for smooth room selection transitions
- shadcn `Sheet` for slide-over panels (Users panel, Asset drawer, Alert log)
- shadcn `Tabs` for floor switcher
- shadcn `Command` for Cmd+K user search
- `html2canvas` + `jsPDF` for export
- Persist full state to `localStorage` with a debounced `useEffect` (500ms)