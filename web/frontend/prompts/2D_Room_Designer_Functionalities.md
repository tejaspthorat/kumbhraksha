# 2D Room Designer Functionalities

The 2D Room Designer (`page.tsx`) serves as an interactive React-based module for venue layout planning, crowd simulation, and capacity monitoring. Below is a detailed breakdown of its core functionalities:

## 1. Top-Level Metrics & Real-Time Calculations
The dashboard displays aggregated real-time metrics across the entire design layout:
- **Total Area (m²):** Calculates the combined spatial area of all created rooms dynamically.
- **Max Capacity (people):** Dynamically computed based on the total area (assuming a maximum density of 3 people per m²).
- **Simulated Density (p/m²):** Simulates a venue at 70% of its maximum capacity, providing a realistic estimate of the active crowd density spread per square meter.
- **Entry Points:** Displays the total count of entry points added to the venue layout.

## 2. Interactive Toolbar & Controls
The toolbar allows users to build and modify their venue efficiently:
- **Select / Move:** Switch to selection mode to interact with existing elements on the workspace.
- **Add Room:** Instantly spawns a new rectangular room (default size 120x80) on the canvas with randomized X/Y positioning and assigns it a unique ID, Name, and color.
- **Add Entry Point:** Drops a new entry point marker on the canvas for mapping access routes and exit gates.
- **Reset Layout:** Fully resets the canvas to its initial saved state (loaded from the global data store), reverting all unsaved layout changes.

## 3. Room Management Sidebar
A sidebar panel that gives a structured overview of all venue zones:
- **Zone Listing:** Lists all created rooms with color-coded identifiers corresponding to how they appear on the canvas.
- **Selection Synchronization:** Clicking on a room from the list highlights it on the visual canvas and triggers its specific detailed breakdown.
- **Quick Deletion:** Individual trash-bin icons allow for the quick removal of specific rooms. Deleting a room instantly re-calculates the global capacity, total area, and density metrics.

## 4. Interactive Design Canvas
The core visual workplace for venue manipulation:
- **Grid Environment:** Features a scalable grid background to help visualize proportions and align elements correctly.
- **Density Heatmap Coloring:** Rooms automatically adjust their background color tint based on their simulated density level to provide an instant visual cue:
  - **Green (Low Density):** Safe, spread out crowd constraint.
  - **Amber (Medium Density):** Moderate, standard crowd flow (1 - 3 p/m²).
  - **Red (High Density):** Overcrowded, highlighting bottleneck risks (> 3 p/m²).
- **Interactive Visuals:** Selected rooms display an accentuated, animated border with an interactive glowing drop shadow via framer-motion animations.
- **Entry Points Visualizer:** Markers visually indicate exactly where venue access points are plotted on the 2D layout.

## 5. Granular Zone Details
When a specific room is selected inside the canvas or sidebar, a detailed contextual panel appears below the canvas showing isolated metrics:
- **Room Name:** The identifier for the targeted workspace.
- **Zone Area:** The total square meters for that specific room segment.
- **Zone Max Capacity:** The maximum safe occupancy (headcount) tailored solely for that individual zone.
