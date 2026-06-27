import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

// ─── Enums & Constants ─────────────────────────────────────────────────────

export const ROOM_TYPES = [
  'General Area',
  'Meeting Room',
  'Restroom',
  'Kitchen / Pantry',
  'Storage',
  'Emergency Exit',
  'Reception / Lobby',
  'Server Room',
  'Open Workspace',
  'Auditorium / Hall',
] as const;

export type RoomType = (typeof ROOM_TYPES)[number];

export const ROOM_TYPE_CONFIG: Record<
  RoomType,
  { icon: string; capacityMultiplier: number; defaultColor: string }
> = {
  'General Area':      { icon: '🏢', capacityMultiplier: 2,   defaultColor: '#378ADD' },
  'Meeting Room':      { icon: '💼', capacityMultiplier: 1.5, defaultColor: '#378ADD' },
  'Restroom':          { icon: '🚻', capacityMultiplier: 1,   defaultColor: '#888780' },
  'Kitchen / Pantry':  { icon: '🍽️', capacityMultiplier: 1.2, defaultColor: '#BA7517' },
  'Storage':           { icon: '📦', capacityMultiplier: 0.5, defaultColor: '#888780' },
  'Emergency Exit':    { icon: '🚪', capacityMultiplier: 3,   defaultColor: '#E24B4A' },
  'Reception / Lobby': { icon: '🏛️', capacityMultiplier: 1.5, defaultColor: '#1D9E75' },
  'Server Room':       { icon: '🖥️', capacityMultiplier: 0.3, defaultColor: '#534AB7' },
  'Open Workspace':    { icon: '🏗️', capacityMultiplier: 2.5, defaultColor: '#088395' },
  'Auditorium / Hall': { icon: '🎭', capacityMultiplier: 4,   defaultColor: '#E24B4A' },
};

export const USER_ROLES = [
  'Coordinator',
  'Security',
  'Staff',
  'Medical',
  'Technician',
  'Volunteer',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  Coordinator: { bg: '#EEEDFE', text: '#3C3489' },
  Security:    { bg: '#E1F5EE', text: '#085041' },
  Staff:       { bg: '#E6F1FB', text: '#0C447C' },
  Medical:     { bg: '#FCEBEB', text: '#791F1F' },
  Technician:  { bg: '#FAEEDA', text: '#633806' },
  Volunteer:   { bg: '#FAECE7', text: '#712B13' },
};

export const ASSET_CATEGORIES = {
  Seating:    ['Chair', 'Sofa', 'Bench'],
  Tables:     ['Round Table', 'Rectangular Table', 'Conference Table'],
  Facilities: ['Podium', 'Stage', 'Whiteboard', 'TV Screen', 'Plant'],
  Safety:     ['Fire Extinguisher', 'AED'],
} as const;

export type AssetType = string;

export const ASSET_ICONS: Record<string, string> = {
  Chair: '🪑', Sofa: '🛋️', Bench: '🪑',
  'Round Table': '⭕', 'Rectangular Table': '▬', 'Conference Table': '🗂️',
  Podium: '🎙️', Stage: '🎭', Whiteboard: '📋', 'TV Screen': '📺', Plant: '🌿',
  'Fire Extinguisher': '🧯', AED: '❤️‍🩹',
};

export type ToolType =
  | 'select'
  | 'draw-room'
  | 'draw-corridor'
  | 'draw-evacuation'
  | 'add-entry'
  | 'add-asset'
  | 'pan';

export type ElementType = 'room' | 'corridor' | 'entry' | 'asset' | null;

// ─── Data Models ───────────────────────────────────────────────────────────

export interface FloorRoom {
  id: string;
  name: string;
  type: RoomType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  notes?: string;
  capacity: number;
  alertThreshold: number;
  currentOccupancy: number;
  assignedUserIds: string[];
  assetIds: string[];
  floorId: string;
}

export interface Floor {
  id: string;
  name: string;
  order: number;
  scale: number;
  backgroundImage?: string;
  rooms: FloorRoom[];
  entryPoints: FloorEntryPoint[];
  corridors: Corridor[];
  evacuationRoutes: EvacuationRoute[];
}

export interface FloorUser {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  status: 'available' | 'assigned' | 'checked-in';
  assignedRoomId?: string;
  assignedFloorId?: string;
}

export interface Corridor {
  id: string;
  fromRoomId: string;
  toRoomId: string;
  width: number;
  type: 'primary' | 'emergency' | 'general';
  floorId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface FloorEntryPoint {
  id: string;
  x: number;
  y: number;
  label?: string;
}

export interface FloorAsset {
  id: string;
  type: AssetType;
  x: number;
  y: number;
  rotation: number;
  roomId: string;
  floorId: string;
  reducesArea: boolean;
  areaReduction: number;
}

export interface EvacuationRoute {
  id: string;
  points: { x: number; y: number }[];
  floorId: string;
}

export interface AlertEntry {
  id: string;
  timestamp: string;
  roomName: string;
  floorName: string;
  occupancyPercent: number;
  level: 'warning' | 'critical';
}

export interface LayoutSnapshot {
  id: string;
  name: string;
  createdAt: string;
  floors: Floor[];
  users: FloorUser[];
  assets: FloorAsset[];
  currentPlanId?: string | null;
  note?: string;
  totalCapacity?: number;
  totalCheckedIn?: number;
  totalAlerts?: number;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

// ─── History entry ─────────────────────────────────────────────────────────

interface HistoryEntry {
  floors: Floor[];
  users: FloorUser[];
  assets: FloorAsset[];
}

// ─── Store State ───────────────────────────────────────────────────────────

export interface FloorPlanState {
  // Data
  floors: Floor[];
  activeFloorId: string;
  users: FloorUser[];
  assets: FloorAsset[];

  // Selection
  selectedElementId: string | null;
  selectedElementType: ElementType;

  // Tools
  activeTool: ToolType;

  // View toggles
  snapToGrid: boolean;
  showGrid: boolean;
  showHeatmap: boolean;
  showEvacuationView: boolean;
  gridSize: number;

  // Viewport
  viewport: Viewport;

  // History (undo/redo)
  history: HistoryEntry[];
  historyIndex: number;

  // Alerts
  alerts: AlertEntry[];

  snapshots: LayoutSnapshot[];
  
  // Global Metadata
  note: string;
  totalCapacity: number;
  totalCheckedIn: number;
  totalAlerts: number;

  // Drawing state (transient)
  isDrawing: boolean;
  drawStart: { x: number; y: number } | null;
  drawCurrent: { x: number; y: number } | null;

  // Corridor drawing state
  corridorFromRoomId: string | null;
  corridorFromPoint: { x: number; y: number } | null;

  // ─── Actions ──────────────────────────────────────────────────────
  // Floors
  addFloor: (name: string) => string;
  setActiveFloor: (id: string) => void;
  updateFloor: (id: string, patch: Partial<Floor>) => void;
  deleteFloor: (id: string) => void;
  copyFloorLayout: (fromFloorId: string, toFloorId: string) => void;

  // Rooms
  addRoom: (floorId: string, room: FloorRoom) => void;
  updateRoom: (id: string, patch: Partial<FloorRoom>) => void;
  deleteRoom: (id: string) => void;

  // Entry Points
  addEntryPoint: (floorId: string, point: FloorEntryPoint) => void;
  deleteEntryPoint: (floorId: string, pointId: string) => void;

  // Corridors
  addCorridor: (floorId: string, corridor: Corridor) => void;
  deleteCorridor: (floorId: string, corridorId: string) => void;

  // Evacuation Routes
  addEvacuationRoute: (floorId: string, route: EvacuationRoute) => void;
  deleteEvacuationRoute: (floorId: string, routeId: string) => void;

  // Assets
  addAsset: (asset: FloorAsset) => void;
  updateAsset: (id: string, patch: Partial<FloorAsset>) => void;
  deleteAsset: (id: string) => void;

  // Users
  addUser: (user: FloorUser) => void;
  updateUser: (id: string, patch: Partial<FloorUser>) => void;
  deleteUser: (id: string) => void;
  assignUser: (userId: string, roomId: string, floorId: string) => void;
  unassignUser: (userId: string) => void;
  checkInUser: (userId: string) => void;
  checkOutUser: (userId: string) => void;

  // Selection
  selectElement: (id: string | null, type: ElementType) => void;
  clearSelection: () => void;

  // Tools
  setActiveTool: (tool: ToolType) => void;

  // View
  toggleSnapToGrid: () => void;
  toggleGrid: () => void;
  toggleHeatmap: () => void;
  toggleEvacuationView: () => void;

  // Viewport
  setViewport: (patch: Partial<Viewport>) => void;
  fitToScreen: (canvasWidth: number, canvasHeight: number) => void;

  // History
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Alerts
  addAlert: (alert: AlertEntry) => void;
  clearAlerts: () => void;

  // Snapshots
  saveSnapshot: (name: string) => void;
  loadSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;
  
  // Global Metadata
  setNote: (note: string) => void;
  setGlobalMetrics: (metrics: { totalCapacity?: number; totalCheckedIn?: number; totalAlerts?: number }) => void;

  // Import/Export helpers
  getExportData: () => LayoutSnapshot;
  importData: (data: LayoutSnapshot) => void;

  // Drawing
  setDrawing: (isDrawing: boolean) => void;
  setDrawStart: (point: { x: number; y: number } | null) => void;
  setDrawCurrent: (point: { x: number; y: number } | null) => void;
  setCorridorFrom: (roomId: string | null, point: { x: number; y: number } | null) => void;

  // Persistence
  loadFromStorage: () => void;

  // Database persistence
  currentPlanId: string | null;
  isSaving: boolean;
  saveToDatabase: (options?: { id?: string; name?: string; description?: string }) => Promise<void>;
  loadFromDatabase: (planId: string) => Promise<void>;
  setCurrentPlanId: (id: string | null) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const MAX_HISTORY = 50;

const defaultFloor: Floor = {
  id: 'floor-1',
  name: 'Ground Floor',
  order: 1,
  scale: 1,
  rooms: [],
  entryPoints: [],
  corridors: [],
  evacuationRoutes: [],
};

// ─── LocalStorage persistence ──────────────────────────────────────────────

let saveTimer: ReturnType<typeof setTimeout> | null = null;
const STORAGE_KEY = 'floorPlanState';

function persistToStorage(state: FloorPlanState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const data = {
        floors: state.floors,
        users: state.users,
        assets: state.assets,
        snapshots: state.snapshots,
        activeFloorId: state.activeFloorId,
        currentPlanId: state.currentPlanId,
        note: state.note,
        totalCapacity: state.totalCapacity,
        totalCheckedIn: state.totalCheckedIn,
        totalAlerts: state.totalAlerts,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // silent fail
    }
  }, 500);
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const useFloorPlanStore = create<FloorPlanState>((set, get) => ({
  // Initial state
  floors: [defaultFloor],
  activeFloorId: 'floor-1',
  users: [],
  assets: [],
  selectedElementId: null,
  selectedElementType: null,
  activeTool: 'select',
  snapToGrid: true,
  showGrid: true,
  showHeatmap: true,
  showEvacuationView: false,
  gridSize: 20,
  viewport: { x: 0, y: 0, scale: 1 },
  history: [],
  historyIndex: -1,
  alerts: [],
  snapshots: [],
  note: '',
  totalCapacity: 0,
  totalCheckedIn: 0,
  totalAlerts: 0,
  isDrawing: false,
  drawStart: null,
  drawCurrent: null,
  corridorFromRoomId: null,
  corridorFromPoint: null,
  currentPlanId: null,
  isSaving: false,

  // ─── Floor Actions ──────────────────────────────────────────────

  addFloor: (name) => {
    const state = get();
    state.pushHistory();
    const id = 'floor-' + uid();
    const newFloor: Floor = {
      id,
      name,
      order: state.floors.length + 1,
      scale: 1,
      rooms: [],
      entryPoints: [],
      corridors: [],
      evacuationRoutes: [],
    };
    set((s) => {
      const next = { floors: [...s.floors, newFloor], activeFloorId: id };
      persistToStorage({ ...s, ...next });
      return next;
    });
    return id;
  },

  setActiveFloor: (id) => set({ activeFloorId: id, selectedElementId: null, selectedElementType: null }),

  updateFloor: (id, patch) =>
    set((s) => {
      const next = { floors: s.floors.map((f) => (f.id === id ? { ...f, ...patch } : f)) };
      persistToStorage({ ...s, ...next });
      return next;
    }),

  deleteFloor: (id) => {
    const state = get();
    if (state.floors.length <= 1) return;
    state.pushHistory();
    set((s) => {
      const remaining = s.floors.filter((f) => f.id !== id);
      const next = {
        floors: remaining,
        activeFloorId: s.activeFloorId === id ? remaining[0].id : s.activeFloorId,
      };
      persistToStorage({ ...s, ...next });
      return next;
    });
  },

  copyFloorLayout: (fromFloorId, toFloorId) => {
    const state = get();
    state.pushHistory();
    const source = state.floors.find((f) => f.id === fromFloorId);
    if (!source) return;
    set((s) => {
      const next = {
        floors: s.floors.map((f) => {
          if (f.id !== toFloorId) return f;
          return {
            ...f,
            rooms: source.rooms.map((r) => ({ ...r, id: uid(), floorId: toFloorId })),
            entryPoints: source.entryPoints.map((e) => ({ ...e, id: uid() })),
            corridors: [],
            evacuationRoutes: [],
          };
        }),
      };
      persistToStorage({ ...s, ...next });
      return next;
    });
  },

  // ─── Room Actions ───────────────────────────────────────────────

  addRoom: (floorId, room) => {
    const state = get();
    state.pushHistory();
    set((s) => {
      const next = {
        floors: s.floors.map((f) => {
          if (f.id !== floorId) return f;
          return { ...f, rooms: [...f.rooms, { ...room, capacity: room.capacity || 0 }] };
        }),
      };
      persistToStorage({ ...s, ...next });
      return next;
    });
  },

  updateRoom: (id, patch) =>
    set((s) => {
      const next = {
        floors: s.floors.map((f) => ({
          ...f,
          rooms: f.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      };
      persistToStorage({ ...s, ...next });
      return next;
    }),

  deleteRoom: (id) => {
    const state = get();
    state.pushHistory();
    set((s) => {
      const next = {
        floors: s.floors.map((f) => ({
          ...f,
          rooms: f.rooms.filter((r) => r.id !== id),
          corridors: f.corridors.filter((c) => c.fromRoomId !== id && c.toRoomId !== id),
        })),
        users: s.users.map((u) =>
          u.assignedRoomId === id ? { ...u, assignedRoomId: undefined, assignedFloorId: undefined, status: 'available' as const } : u
        ),
        selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
        selectedElementType: s.selectedElementId === id ? null : s.selectedElementType,
      };
      persistToStorage({ ...s, ...next });
      return next;
    });
  },

  // ─── Entry Points ──────────────────────────────────────────────

  addEntryPoint: (floorId, point) => {
    const state = get();
    state.pushHistory();
    set((s) => {
      const next = {
        floors: s.floors.map((f) => {
          if (f.id !== floorId) return f;
          return { ...f, entryPoints: [...f.entryPoints, point] };
        }),
      };
      persistToStorage({ ...s, ...next });
      return next;
    });
  },

  deleteEntryPoint: (floorId, pointId) => {
    const state = get();
    state.pushHistory();
    set((s) => {
      const next = {
        floors: s.floors.map((f) => {
          if (f.id !== floorId) return f;
          return { ...f, entryPoints: f.entryPoints.filter((e) => e.id !== pointId) };
        }),
      };
      persistToStorage({ ...s, ...next });
      return next;
    });
  },

  // ─── Corridors ─────────────────────────────────────────────────

  addCorridor: (floorId, corridor) => {
    const state = get();
    state.pushHistory();
    set((s) => {
      const next = {
        floors: s.floors.map((f) => {
          if (f.id !== floorId) return f;
          return { ...f, corridors: [...f.corridors, corridor] };
        }),
      };
      persistToStorage({ ...s, ...next });
      return next;
    });
  },

  deleteCorridor: (floorId, corridorId) => {
    const state = get();
    state.pushHistory();
    set((s) => {
      const next = {
        floors: s.floors.map((f) => {
          if (f.id !== floorId) return f;
          return { ...f, corridors: f.corridors.filter((c) => c.id !== corridorId) };
        }),
      };
      persistToStorage({ ...s, ...next });
      return next;
    });
  },

  // ─── Evacuation Routes ─────────────────────────────────────────

  addEvacuationRoute: (floorId, route) => {
    const state = get();
    state.pushHistory();
    set((s) => {
      const next = {
        floors: s.floors.map((f) => {
          if (f.id !== floorId) return f;
          return { ...f, evacuationRoutes: [...f.evacuationRoutes, route] };
        }),
      };
      persistToStorage({ ...s, ...next });
      return next;
    });
  },

  deleteEvacuationRoute: (floorId, routeId) => {
    const state = get();
    state.pushHistory();
    set((s) => {
      const next = {
        floors: s.floors.map((f) => {
          if (f.id !== floorId) return f;
          return { ...f, evacuationRoutes: f.evacuationRoutes.filter((r) => r.id !== routeId) };
        }),
      };
      persistToStorage({ ...s, ...next });
      return next;
    });
  },

  // ─── Assets ────────────────────────────────────────────────────

  addAsset: (asset) => {
    const state = get();
    state.pushHistory();
    set((s) => {
      const next = { assets: [...s.assets, asset] };
      persistToStorage({ ...s, ...next });
      return next;
    });
  },

  updateAsset: (id, patch) =>
    set((s) => {
      const next = { assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) };
      persistToStorage({ ...s, ...next });
      return next;
    }),

  deleteAsset: (id) => {
    const state = get();
    state.pushHistory();
    set((s) => {
      const next = { assets: s.assets.filter((a) => a.id !== id) };
      persistToStorage({ ...s, ...next });
      return next;
    });
  },

  // ─── User Actions ──────────────────────────────────────────────

  addUser: (user) =>
    set((s) => {
      const next = { users: [...s.users, user] };
      persistToStorage({ ...s, ...next });
      return next;
    }),

  updateUser: (id, patch) =>
    set((s) => {
      const next = { users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) };
      persistToStorage({ ...s, ...next });
      return next;
    }),

  deleteUser: (id) =>
    set((s) => {
      const next = { users: s.users.filter((u) => u.id !== id) };
      persistToStorage({ ...s, ...next });
      return next;
    }),

  assignUser: (userId, roomId, floorId) =>
    set((s) => {
      const next = {
        users: s.users.map((u) => {
          if (u.id === userId) return { ...u, assignedRoomId: roomId, assignedFloorId: floorId, status: 'assigned' as const };
          // If this room was already assigned to another user at max, don't auto-remove
          return u;
        }),
        floors: s.floors.map((f) => ({
          ...f,
          rooms: f.rooms.map((r) => {
            if (r.id === roomId && !r.assignedUserIds.includes(userId)) {
              return { ...r, assignedUserIds: [...r.assignedUserIds, userId] };
            }
            // If user was previously assigned elsewhere, remove from old room
            const oldUser = s.users.find((u) => u.id === userId);
            if (oldUser?.assignedRoomId === r.id && r.id !== roomId) {
              return { ...r, assignedUserIds: r.assignedUserIds.filter((uid) => uid !== userId) };
            }
            return r;
          }),
        })),
      };
      persistToStorage({ ...s, ...next });
      return next;
    }),

  unassignUser: (userId) =>
    set((s) => {
      const user = s.users.find((u) => u.id === userId);
      const next = {
        users: s.users.map((u) =>
          u.id === userId ? { ...u, assignedRoomId: undefined, assignedFloorId: undefined, status: 'available' as const } : u
        ),
        floors: user?.assignedRoomId
          ? s.floors.map((f) => ({
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === user.assignedRoomId
                  ? { ...r, assignedUserIds: r.assignedUserIds.filter((id) => id !== userId), currentOccupancy: Math.max(0, r.currentOccupancy - (user.status === 'checked-in' ? 1 : 0)) }
                  : r
              ),
            }))
          : s.floors,
      };
      persistToStorage({ ...s, ...next });
      return next;
    }),

  checkInUser: (userId) => {
    set((s) => {
      const user = s.users.find((u) => u.id === userId);
      if (!user || !user.assignedRoomId) return s;
      const next = {
        users: s.users.map((u) => (u.id === userId ? { ...u, status: 'checked-in' as const } : u)),
        floors: s.floors.map((f) => ({
          ...f,
          rooms: f.rooms.map((r) => {
            if (r.id !== user.assignedRoomId) return r;
            const newOcc = r.currentOccupancy + 1;
            return { ...r, currentOccupancy: newOcc };
          }),
        })),
      };
      persistToStorage({ ...s, ...next });
      // Check capacity alerts
      const state = { ...s, ...next };
      state.floors.forEach((f) => {
        f.rooms.forEach((r) => {
          const maxCap = Math.floor(
            ((r.width * r.height) / 10000) * (ROOM_TYPE_CONFIG[r.type]?.capacityMultiplier ?? 2) * 100
          );
          const pct = maxCap > 0 ? (r.currentOccupancy / maxCap) * 100 : 0;
          if (pct >= r.alertThreshold) {
            const alert: AlertEntry = {
              id: uid(),
              timestamp: new Date().toISOString(),
              roomName: r.name,
              floorName: f.name,
              occupancyPercent: Math.round(pct),
              level: pct >= 90 ? 'critical' : 'warning',
            };
            set((ss) => ({ alerts: [alert, ...ss.alerts] }));
          }
        });
      });
      return next;
    });
  },

  checkOutUser: (userId) =>
    set((s) => {
      const user = s.users.find((u) => u.id === userId);
      if (!user || !user.assignedRoomId) return s;
      const next = {
        users: s.users.map((u) =>
          u.id === userId ? { ...u, status: 'assigned' as const } : u
        ),
        floors: s.floors.map((f) => ({
          ...f,
          rooms: f.rooms.map((r) =>
            r.id === user.assignedRoomId
              ? { ...r, currentOccupancy: Math.max(0, r.currentOccupancy - 1) }
              : r
          ),
        })),
      };
      persistToStorage({ ...s, ...next });
      return next;
    }),

  // ─── Selection ─────────────────────────────────────────────────

  selectElement: (id, type) => set({ selectedElementId: id, selectedElementType: type }),
  clearSelection: () => set({ selectedElementId: null, selectedElementType: null }),

  // ─── Tools ─────────────────────────────────────────────────────

  setActiveTool: (tool) =>
    set({
      activeTool: tool,
      selectedElementId: null,
      selectedElementType: null,
      isDrawing: false,
      drawStart: null,
      drawCurrent: null,
      corridorFromRoomId: null,
      corridorFromPoint: null,
    }),

  // ─── View Toggles ──────────────────────────────────────────────

  toggleSnapToGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleHeatmap: () => set((s) => ({ showHeatmap: !s.showHeatmap })),
  toggleEvacuationView: () => set((s) => ({ showEvacuationView: !s.showEvacuationView })),

  // ─── Viewport ──────────────────────────────────────────────────

  setViewport: (patch) => set((s) => ({ viewport: { ...s.viewport, ...patch } })),

  fitToScreen: (canvasWidth, canvasHeight) => {
    const state = get();
    const floor = state.floors.find((f) => f.id === state.activeFloorId);
    if (!floor || floor.rooms.length === 0) {
      set({ viewport: { x: 0, y: 0, scale: 1 } });
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const r of floor.rooms) {
      minX = Math.min(minX, r.x);
      minY = Math.min(minY, r.y);
      maxX = Math.max(maxX, r.x + r.width);
      maxY = Math.max(maxY, r.y + r.height);
    }
    const contentW = maxX - minX + 80;
    const contentH = maxY - minY + 80;
    const scale = Math.min(canvasWidth / contentW, canvasHeight / contentH, 3);
    const clampedScale = Math.max(0.3, Math.min(3, scale));
    set({
      viewport: {
        x: (canvasWidth - contentW * clampedScale) / 2 - minX * clampedScale + 40 * clampedScale,
        y: (canvasHeight - contentH * clampedScale) / 2 - minY * clampedScale + 40 * clampedScale,
        scale: clampedScale,
      },
    });
  },

  // ─── History (Undo/Redo) ───────────────────────────────────────

  pushHistory: () =>
    set((s) => {
      const entry: HistoryEntry = {
        floors: JSON.parse(JSON.stringify(s.floors)),
        users: JSON.parse(JSON.stringify(s.users)),
        assets: JSON.parse(JSON.stringify(s.assets)),
      };
      const newHistory = s.history.slice(0, s.historyIndex + 1);
      newHistory.push(entry);
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      return { history: newHistory, historyIndex: newHistory.length - 1 };
    }),

  undo: () => {
    const s = get();
    if (s.historyIndex < 0) return;
    const entry = s.history[s.historyIndex];
    set({
      floors: JSON.parse(JSON.stringify(entry.floors)),
      users: JSON.parse(JSON.stringify(entry.users)),
      assets: JSON.parse(JSON.stringify(entry.assets)),
      historyIndex: s.historyIndex - 1,
      selectedElementId: null,
      selectedElementType: null,
    });
    persistToStorage(get());
  },

  redo: () => {
    const s = get();
    if (s.historyIndex >= s.history.length - 1) return;
    const entry = s.history[s.historyIndex + 2] ?? s.history[s.historyIndex + 1];
    if (!entry) return;
    set({
      floors: JSON.parse(JSON.stringify(entry.floors)),
      users: JSON.parse(JSON.stringify(entry.users)),
      assets: JSON.parse(JSON.stringify(entry.assets)),
      historyIndex: s.historyIndex + 1,
      selectedElementId: null,
      selectedElementType: null,
    });
    persistToStorage(get());
  },

  // ─── Alerts ────────────────────────────────────────────────────

  addAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts] })),
  clearAlerts: () => set({ alerts: [] }),

  // ─── Snapshots ─────────────────────────────────────────────────

  saveSnapshot: (name) =>
    set((s) => {
      const snapshot: LayoutSnapshot = {
        id: uid(),
        name,
        createdAt: new Date().toISOString(),
        floors: JSON.parse(JSON.stringify(s.floors)),
        users: JSON.parse(JSON.stringify(s.users)),
        assets: JSON.parse(JSON.stringify(s.assets)),
        note: s.note,
        totalCapacity: s.totalCapacity,
        totalCheckedIn: s.totalCheckedIn,
        totalAlerts: s.totalAlerts,
      };
      const next = { snapshots: [...s.snapshots, snapshot] };
      persistToStorage({ ...s, ...next });
      return next;
    }),

  loadSnapshot: (id) => {
    const s = get();
    const snap = s.snapshots.find((sn) => sn.id === id);
    if (!snap) return;
    s.pushHistory();
    set({
      floors: JSON.parse(JSON.stringify(snap.floors)),
      users: JSON.parse(JSON.stringify(snap.users)),
      assets: JSON.parse(JSON.stringify(snap.assets)),
      activeFloorId: snap.floors[0]?.id ?? s.activeFloorId,
      selectedElementId: null,
      selectedElementType: null,
    });
    persistToStorage(get());
  },

  deleteSnapshot: (id) =>
    set((s) => {
      const next = { snapshots: s.snapshots.filter((sn) => sn.id !== id) };
      persistToStorage({ ...s, ...next });
      return next;
    }),

  // ─── Import / Export ───────────────────────────────────────────

  getExportData: () => {
    const s = get();
    return {
      id: uid(),
      name: 'Export',
      createdAt: new Date().toISOString(),
      floors: s.floors,
      users: s.users,
      assets: s.assets,
      note: s.note,
      totalCapacity: s.totalCapacity,
      totalCheckedIn: s.totalCheckedIn,
      totalAlerts: s.totalAlerts,
    };
  },

  importData: (data) => {
    const s = get();
    s.pushHistory();
    set({
      floors: data.floors,
      users: data.users,
      assets: data.assets ?? [],
      activeFloorId: data.floors[0]?.id ?? 'floor-1',
      currentPlanId: data.currentPlanId ?? null,
      note: data.note ?? '',
      totalCapacity: data.totalCapacity ?? 0,
      totalCheckedIn: data.totalCheckedIn ?? 0,
      totalAlerts: data.totalAlerts ?? 0,
      selectedElementId: null,
      selectedElementType: null,
    });
    persistToStorage(get());
  },

  // ─── Drawing State ─────────────────────────────────────────────

  setDrawing: (isDrawing) => set({ isDrawing }),
  setDrawStart: (point) => set({ drawStart: point }),
  setDrawCurrent: (point) => set({ drawCurrent: point }),
  setCorridorFrom: (roomId, point) => set({ corridorFromRoomId: roomId, corridorFromPoint: point }),

  // ─── Persistence ───────────────────────────────────────────────

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.floors && Array.isArray(data.floors)) {
        set({
          floors: data.floors,
          users: data.users ?? [],
          assets: data.assets ?? [],
          snapshots: data.snapshots ?? [],
          activeFloorId: data.activeFloorId ?? data.floors[0]?.id ?? 'floor-1',
          currentPlanId: data.currentPlanId ?? null,
          note: data.note ?? '',
          totalCapacity: data.totalCapacity ?? 0,
          totalCheckedIn: data.totalCheckedIn ?? 0,
          totalAlerts: data.totalAlerts ?? 0,
        });
      }
    } catch {
      // silent fail
    }
  },

  // ─── Database Persistence ──────────────────────────────────────

  setNote: (note) => set({ note }),
  setGlobalMetrics: (metrics) => set((s) => ({ ...s, ...metrics })),
  setCurrentPlanId: (id) => set({ currentPlanId: id }),

  saveToDatabase: async (options: { id?: string; name?: string; description?: string } = {}) => {
    const state = get();
    set({ isSaving: true });
    try {
      // Use provided ID or fallback to current store state
      const planId = options.id || state.currentPlanId;
      
      // Recalculate aggregates from room data to ensure accuracy during save
      let calcCap = 0;
      let calcChecked = 0;
      let calcAlerts = 0;

      for (const floor of state.floors) {
        for (const room of floor.rooms) {
          calcCap += (room.capacity || 0);
          calcChecked += (room.currentOccupancy || 0);
          const pct = (room.capacity || 1) > 0 ? (room.currentOccupancy / (room.capacity || 1)) * 100 : 0;
          if (pct >= room.alertThreshold) calcAlerts++;
        }
      }

      const payload = {
        id: planId,
        name: options.name || 'My Floor Plan',
        description: options.description || '',
        floors: state.floors,
        users: state.users,
        assets: state.assets,
        // Include global aggregates (prefer explicitly set ones, else use calculated)
        note: state.note || '',
        totalCapacity: state.totalCapacity || calcCap,
        totalCheckedIn: state.totalCheckedIn || calcChecked,
        totalAlerts: state.totalAlerts || calcAlerts,
      };

      let response: Response;
      if (planId) {
        // Update existing (or user specified custom ID that might already exist)
        // Note: The API should handle UPSERT logic or use standard methods.
        // We'll trust the PUT route if ID is present.
        response = await fetch('/api/floor-plan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        response = await fetch('/api/floor-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: response.statusText }));
        alert(`Save failed: ${err.error || response.statusText}`);
        return;
      }

      const result = await response.json();
      if (result.id && !state.currentPlanId) {
        set({ currentPlanId: result.id });
        // Update localStorage with the plan ID
        const storageData = {
          floors: state.floors,
          users: state.users,
          assets: state.assets,
          snapshots: state.snapshots,
          activeFloorId: state.activeFloorId,
          currentPlanId: result.id,
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
        } catch { /* silent */ }
      }
    } catch (error) {
      console.error('Failed to save to database:', error);
      alert('Failed to save floor plan. See console for details.');
    } finally {
      set({ isSaving: false });
    }
  },

  loadFromDatabase: async (planId) => {
    try {
      const response = await fetch(`/api/floor-plan?id=${planId}`);
      if (!response.ok) {
        alert('Plan not found or server error.');
        return;
      }
      const data = await response.json();
      if (data.floors && Array.isArray(data.floors)) {
        set({
          floors: data.floors,
          users: data.users ?? [],
          assets: data.assets ?? [],
          activeFloorId: data.floors[0]?.id ?? 'floor-1',
          currentPlanId: planId,
          selectedElementId: null,
          selectedElementType: null,
        });
        persistToStorage(get());
      }
    } catch (error) {
      console.error('Failed to load from database:', error);
      alert('Failed to load floor plan. See console for details.');
    }
  },
}));

// ─── Selector Hooks (using useShallow to prevent infinite re-renders) ──────

const EMPTY_ROOMS: FloorRoom[] = [];
const EMPTY_ENTRY_POINTS: FloorEntryPoint[] = [];
const EMPTY_CORRIDORS: Corridor[] = [];
const EMPTY_EVAC_ROUTES: EvacuationRoute[] = [];

export const useActiveFloor = () =>
  useFloorPlanStore((s) => s.floors.find((f) => f.id === s.activeFloorId));

export const useActiveRooms = () => {
  const activeFloorId = useFloorPlanStore((s) => s.activeFloorId);
  const floors = useFloorPlanStore((s) => s.floors);
  const floor = floors.find((f) => f.id === activeFloorId);
  return floor?.rooms ?? EMPTY_ROOMS;
};

export const useActiveEntryPoints = () => {
  const activeFloorId = useFloorPlanStore((s) => s.activeFloorId);
  const floors = useFloorPlanStore((s) => s.floors);
  const floor = floors.find((f) => f.id === activeFloorId);
  return floor?.entryPoints ?? EMPTY_ENTRY_POINTS;
};

export const useActiveCorridors = () => {
  const activeFloorId = useFloorPlanStore((s) => s.activeFloorId);
  const floors = useFloorPlanStore((s) => s.floors);
  const floor = floors.find((f) => f.id === activeFloorId);
  return floor?.corridors ?? EMPTY_CORRIDORS;
};

export const useActiveEvacuationRoutes = () => {
  const activeFloorId = useFloorPlanStore((s) => s.activeFloorId);
  const floors = useFloorPlanStore((s) => s.floors);
  const floor = floors.find((f) => f.id === activeFloorId);
  return floor?.evacuationRoutes ?? EMPTY_EVAC_ROUTES;
};

export const useSelectedRoom = () =>
  useFloorPlanStore((s) => {
    if (s.selectedElementType !== 'room' || !s.selectedElementId) return null;
    for (const f of s.floors) {
      const room = f.rooms.find((r) => r.id === s.selectedElementId);
      if (room) return room;
    }
    return null;
  });

export const useFloorAssets = (floorId: string) =>
  useFloorPlanStore(useShallow((s) => s.assets.filter((a) => a.floorId === floorId)));

export const useTotalMetrics = () =>
  useFloorPlanStore(useShallow((s) => {
    let totalArea = 0;
    let totalCapacity = 0;
    let totalCheckedIn = 0;
    let totalAlerts = 0;

    for (const floor of s.floors) {
      for (const room of floor.rooms) {
        const area = (room.width * room.height) / 10000;
        totalArea += area;
        totalCapacity += room.capacity || 0;
        totalCheckedIn += room.currentOccupancy || 0;
        
        // Calculate alert status
        const maxCap = room.capacity || 1; // avoid div by zero
        const pct = (room.currentOccupancy / maxCap) * 100;
        if (pct >= room.alertThreshold) {
          totalAlerts++;
        }
      }
    }

    return { 
      totalArea: totalArea * 100, 
      totalCapacity: s.totalCapacity || totalCapacity, 
      totalCheckedIn: s.totalCheckedIn || totalCheckedIn, 
      totalAlerts: s.totalAlerts || totalAlerts 
    };
  }));
