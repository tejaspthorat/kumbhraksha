# Floor Plan Designer — Implementation Instruction File

**Source reference:** This document is written from the issues and partially implemented features listed in *FloorPlanDesigner_Documentation.md* fileciteturn0file0.

## Goal

Bring the Floor Plan Designer to a usable state where the frontend, store, canvas, minimap, and API all behave as one complete system. The main objective is not only to make the missing features work, but to make them work in a way that is consistent, recoverable, testable, and easy to extend later.

The implementation must focus on four outcomes:

1. The canvas must respond to the selected tool.
2. The store must receive valid data for every created object.
3. The UI must expose the hidden logic already present in the backend/store.
4. The visual state must stay synchronized with persisted data and with the minimap.

---

## Core implementation rules

Before coding any feature, follow these rules:

- Treat the Zustand store as the source of truth for editor state.
- Treat the canvas as the interaction layer, not the business logic layer.
- Every object placed on the canvas must have stable identifiers and enough metadata to be saved and reloaded.
- Every interactive tool must have a visible and predictable interaction flow.
- Every feature added to the UI must have a matching save/load path in the API.
- Every visual state must be renderable again after refresh from API data.

If a feature exists in the store but cannot be triggered from the UI, it is not finished.
If a feature can be triggered from the UI but cannot be persisted and restored, it is not finished.
If a feature is persisted but not drawn on the canvas and reflected in the minimap, it is not finished.

---

## 1. Fix the canvas tool system first

The most important problem is that the canvas does not currently convert tool selection into mouse-driven creation behavior. The store already contains logic for corridors, evacuation routes, assets, and occupancy-related actions, but the canvas does not expose the interaction surface needed to use them.

### Instruction

Refactor `FloorPlanCanvas.tsx` so it behaves like a true mode-based editor.

When the active tool changes, the mouse behavior on the canvas must change immediately.

### Required interaction pattern

Each tool should follow the same mental model:

- **Mouse down** starts the creation or selection action.
- **Mouse move** updates previews, drag states, or temporary shapes.
- **Mouse up** finalizes the action and commits data into the store.

This pattern must be consistent across all drawing tools so the user does not have to learn separate rules for each mode.

### Implementation expectations

- Add tool-aware handlers for `onMouseDown`, `onMouseMove`, and `onMouseUp`.
- Convert pointer coordinates into floor-plan coordinates before storing them.
- Use temporary state for preview rendering where needed.
- Prevent tools from interfering with each other.
- Clear the temporary interaction state when the active tool changes or the user cancels the action.

### Acceptance criteria

- Choosing a tool changes what the next click does.
- The cursor position is correctly translated into canvas coordinates.
- No tool should silently do nothing.
- The canvas should always show feedback while the user is interacting.

---

## 2. Implement corridor drawing as a proper connection workflow

The corridor tool is currently declared in the store, but the canvas does not provide a way to define the start point, end point, or relationship between connected elements.

### Instruction

Treat corridor creation as a two-part or drag-based linking flow between two valid points.

A corridor must always connect meaningful points in the floor plan, not arbitrary screen locations unless the product intentionally supports freeform corridor drawing.

### Required behavior

- The user selects the corridor tool.
- The user clicks a valid origin point.
- The UI shows a preview line or route as the user moves the mouse.
- The user clicks the destination point.
- The corridor is committed to the store with enough metadata to redraw it later.

### Data requirements

A corridor should store:

- unique id
- start position
- end position
- start room or start anchor if applicable
- end room or end anchor if applicable
- visual or routing metadata
- floor or plan association

If corridors are meant to connect rooms, the implementation must resolve room boundaries and anchor points rather than using raw coordinates only. If corridors are freeform, they still need metadata that lets the renderer identify them during reload.

### Validation rules

- Do not create a corridor unless both endpoints are valid.
- Do not allow duplicate accidental creation when the user double-clicks or releases without a valid destination.
- Reject corridors that connect incompatible entities.
- Ensure the corridor remains visible after refresh.

### Acceptance criteria

- Corridor creation is possible from the UI.
- Corridor geometry appears on the canvas immediately after creation.
- Corridors persist through API save/load.
- Corridors render in the minimap.

---

## 3. Implement evacuation routes as point-based paths

The evacuation route model already exists conceptually, but the canvas currently does not gather point sequences from the user.

### Instruction

Implement evacuation routes as a multi-point path editor.

Unlike corridors, evacuation routes should capture a series of points instead of just two endpoints.

### Required behavior

- The user selects the evacuation tool.
- Each click appends a point to the current route.
- The route preview updates after each click.
- The user ends the route with a clear action such as double-click, a confirm button, or an explicit “finish route” control.
- The completed route is saved as an ordered list of points.

### Data requirements

An evacuation route should store:

- unique id
- ordered route points
- floor association
- optional start zone or source room
- optional destination/exit association
- route label or category if needed
- metadata for rendering directionality or severity

### Validation rules

- A route must contain at least two points.
- Points must be stored in correct order.
- The route must survive page refresh and reload.
- The route must be editable later if the design supports editing.

### Acceptance criteria

- Users can draw routes by clicking successive points.
- The drawn path matches the stored path exactly.
- Routes are visible in the canvas and minimap.
- Routes persist through the API and reload correctly.

---

## 4. Implement asset placement with a placement flow, not a hidden store action

Assets such as extinguishers, AEDs, tables, and seating are already defined in the data layer, but the user cannot place them through the UI.

### Instruction

Make asset placement a guided interaction.

The user should choose a category, place an asset, configure its properties, and then confirm placement.

### Required behavior

- Selecting the asset tool opens a placement flow.
- The UI asks for category, icon, and optional label.
- Clicking on the canvas places the asset at the pointer location.
- The asset is created with an id, category, icon, label, and coordinates.
- Asset placement should provide a preview before final confirmation if the UI design supports it.

### Data requirements

Each asset should store:

- unique id
- category
- icon key or icon reference
- coordinates
- label or name
- size or bounds if resizing is supported
- floor association
- optional rotation or status

### Validation rules

- Asset categories must come from the supported category list.
- Unknown icons should fall back to a safe default.
- Assets must not be lost during save/load.
- The asset marker should be drawn in the correct position on the floor plan.

### Acceptance criteria

- Users can add assets from the UI.
- Assets appear at the selected spot.
- Assets are included in saved floor plan data.
- Assets render in the minimap.

---

## 5. Expose role-based check-in and check-out in the interface

The store already contains `assignUser`, `checkInUser`, and `checkOutUser`, but those actions are unreachable in normal UI flow. This breaks occupancy simulation and prevents alert logic from being meaningfully exercised.

### Instruction

Add a visible interaction path for user occupancy changes.

Do not leave this as a hidden store-level capability.

### Required behavior

- Users can be assigned to rooms or zones through the UI.
- Users can be checked in and checked out using contextual actions or a room detail panel.
- A room or zone should display current occupancy status.
- Simulated occupancy should update the heatmap or room color immediately.

### Recommended UI patterns

Use one or more of the following:

- context menu on room click
- room side panel with occupancy actions
- user marker actions
- toolbar quick actions for simulation/testing

### Data requirements

The UI should display:

- room current occupancy
- room capacity
- assigned users
- checked-in users
- checked-out users
- timestamp history if available

### Validation rules

- Do not allow a check-in if the room is already full unless overflow is intentionally supported.
- Do not count a checked-out user as active.
- Recalculate occupancy after every status change.
- Keep occupancy updates consistent across refreshes.

### Acceptance criteria

- A user can be checked in from the UI without manual store editing.
- Room heatmap color changes according to occupancy.
- Occupancy-based alerts can actually trigger during real UI use.
- Reloading preserves the current simulated state.

---

## 6. Make alerts visible, testable, and tied to real interactions

The alert system exists, but it stays mostly theoretical if the UI does not drive occupancy over capacity and does not render meaningful feedback.

### Instruction

Turn alerts into a visible monitoring feature.

An alert should not only exist in state; it must be discoverable, readable, and linked to the event that created it.

### Required behavior

- Display active alerts in a dedicated panel or drawer.
- Show alert type, time, room, threshold, and reason.
- Highlight the related room or entity on the canvas.
- Allow the user to dismiss or acknowledge alerts if that is part of the product design.

### Alert generation rules

- Alerts should trigger when occupancy crosses the configured threshold.
- Duplicate alerts should be controlled so the same event does not spam the list.
- Clearing occupancy should either resolve the alert or mark it as inactive, depending on the desired behavior.
- Threshold logic must be configurable per room or per floor when needed.

### Acceptance criteria

- Alert data can be triggered from normal user actions.
- The UI shows why the alert happened.
- The alert list updates in real time.
- Alerts are persisted or archived according to the app’s intended behavior.

---

## 7. Fix the minimap so it represents the whole layout

The current minimap only accounts for rooms. That makes it misleading because corridors, assets, and entry points are ignored.

### Instruction

Rebuild the minimap drawing logic so it derives from the complete floor plan state.

### Required behavior

The minimap must include:

- rooms
- corridors
- assets
- entry points
- evacuation routes
- any other visible structural entity the user places on the canvas

### Implementation expectations

- Use the same source of truth as the main canvas.
- Calculate bounds from all drawable items, not just rooms.
- Scale every element consistently into minimap coordinates.
- Keep the minimap visually simplified, but not incomplete.

### Important design note

The minimap does not need to show every pixel of the main canvas, but it must show enough structure that a user can orient themselves correctly.

### Acceptance criteria

- The minimap updates when any drawable entity changes.
- The minimap includes all important shapes.
- The minimap is not misleading because of missing corridors or assets.
- Zooming or panning on the main canvas still keeps the minimap meaningful.

---

## 8. Ensure API payloads match real frontend capabilities

The API routes already support hierarchical floor plan data, but they are only useful if the frontend can actually produce the corresponding structures.

### Instruction

Audit the frontend objects against the API schema and make both sides agree on the same entity shape.

### Required behavior

- Ensure every drawable entity in the store has a corresponding payload shape.
- Ensure loaded API data is normalized back into store state correctly.
- Ensure save operations never send empty placeholders for features that are visibly used in the UI.
- Ensure update operations preserve ids where necessary and regenerate only what should be regenerated.

### Data consistency rules

- Rooms, corridors, assets, entry points, and routes must each round-trip correctly.
- Nested relations must preserve their owning floor or plan.
- Relationships should be represented in a way that the UI can redraw without guessing.
- Do not rely on frontend-only temporary fields in persisted payloads.

### Acceptance criteria

- Reloading a plan shows the same visual layout that was saved.
- API data and store data match entity counts and relationships.
- The backend does not receive empty arrays for features the user actually created.
- Editing one entity does not corrupt related entities.

---

## 9. Make multi-floor operations visible and usable

The store already includes a floor layout copy function, but there is no accessible UI button or workflow to use it.

### Instruction

Expose multi-floor actions in a place that users naturally expect, such as the floor switcher, plan settings panel, or a floor action menu.

### Required behavior

- Allow copying a floor layout from one floor to another from the UI.
- Clearly show which floor is the source and which floor is the destination.
- Warn the user before overwriting existing layout data.
- Preserve identifiers and relationships correctly during duplication.

### Validation rules

- Prevent accidental copying to the wrong floor.
- Ensure cloned rooms and linked entities do not collide with existing ids.
- Keep copied layouts consistent with the visual and stored structure.

### Acceptance criteria

- A user can duplicate a floor layout without direct store calls.
- The copied layout appears immediately in the correct floor context.
- The copy action respects the current floor plan structure.

---

## 10. Organize the implementation by feature ownership

Do not solve everything in one uncontrolled edit. Use a feature-owned structure so each part is easier to maintain.

### Recommended ownership split

- **Canvas interaction layer:** mouse events, previews, selection, drag behavior
- **Store logic:** object creation, updates, validation, alert calculations
- **UI panels and tools:** tool selection, modals, menus, configuration forms
- **Minimap renderer:** full-state visualization
- **API layer:** persistence, load normalization, server-side validation

### Why this matters

When each layer owns a clear part of the workflow, the code becomes easier to debug and future tool additions become much simpler.

---

## 11. Testing instructions

Testing should confirm that the feature is not only coded, but actually usable.

### Must-test scenarios

- Draw a corridor and reload the page.
- Draw an evacuation route with multiple points and reload the page.
- Place an asset and confirm it appears in the correct location after saving.
- Check in users until a threshold alert triggers.
- Check out users and confirm the alert state updates correctly.
- Switch floors and verify the copied floor layout works.
- Verify the minimap updates when new entities are added.

### What to verify in each test

- The action is visible in the UI.
- The state is stored correctly.
- The saved API payload contains the expected data.
- The plan reloads into the same layout.
- The minimap and main canvas match the same plan.

---

## 12. Definition of done

This implementation should be considered complete only when all of the following are true:

- Every declared tool can be used from the UI.
- Every placed entity is saved and reloaded correctly.
- The minimap shows the complete layout.
- Occupancy simulation can trigger alerts from real user actions.
- Floor copying is available from the interface.
- The UI no longer contains hidden features that exist only in the store.
- The API payload, store state, and canvas rendering stay consistent.

---

## Suggested build order

Use this order to reduce integration risk:

1. Fix the canvas event system.
2. Implement corridor and evacuation route interactions.
3. Implement asset placement.
4. Expose occupancy actions in the UI.
5. Connect alerts to visible feedback.
6. Expand the minimap to all entities.
7. Expose multi-floor copy actions.
8. Verify save/load parity with the API.
9. Run end-to-end functional checks.

---

## Final instruction

Do not treat these as isolated bug fixes. Treat them as one product completion effort.

Every missing UI interaction should be wired to the store.
Every store action should be reachable from the interface.
Every saved structure should be visible when the plan is reopened.
Every visible entity should appear in the minimap.
Every threshold or occupancy rule should be testable by an actual user action.
