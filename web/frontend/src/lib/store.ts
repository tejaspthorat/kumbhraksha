import { create } from 'zustand'

// ─── Enums (mirror Prisma enums for type safety) ───────────────────────────

export type Role = 'ADMIN' | 'STAFF' | 'USER'
export type AlertLevel = 'danger' | 'warning' | 'info'
export type ZoneLevel = 'danger' | 'warning' | 'success'
export type AlertStatus = 'pending' | 'accepted' | 'ignored'
export type DeviceStatus = 'online' | 'offline' | 'degraded'
export type StaffStatus = 'active' | 'break' | 'offline'
export type DensityStatus = 'danger' | 'warning' | 'success'
export type PredictionSeverity = 'danger' | 'warning' | 'info' | 'success'

// ─── Model Types ───────────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  name: string | null
  role: Role
  createdAt: string
  updatedAt: string
}

export interface Room {
  id: number
  type: 'rectangle' | 'circle'
  x: number
  y: number
  width: number
  height: number
  name: string
  color: string
}

export interface EntryPoint {
  id: number
  x: number
  y: number
}

export interface Suggestion {
  id: number
  condition: string
  action: string
  icon: string
  priority: string
  confidence: number
  zone: string
  status: AlertStatus
  createdAt: string
  updatedAt: string
}

export interface Zone {
  id: number
  name: string
  people: number
  area: number
  type?: string
  threshold?: number
  capacity?: number
  density: number
  level: ZoneLevel
  floorName?: string
  updatedAt: string
  // Included relations (populated by API)
  alerts?: Alert[]
  cameras?: Camera[]
  staff?: Staff[]
  predictions?: Prediction[]
  log?: AlertLog[]
  zoneDensity?: ZoneDensity[]
  devices?: Device[]
}

export interface Alert {
  id: number
  type: string
  level: AlertLevel
  title: string
  description: string
  time: string
  createdAt: string
  resolved: boolean
  resolvedAt: string | null
  zoneId: number
  zone?: Pick<Zone, 'id' | 'name'>
}

export interface AlertSummary {
  id: number
  name: string
  value: number
  color: string
}

export interface AlertLog {
  id: number
  time: string
  createdAt: string
  type: string
  severity: string
  resolved: boolean
  zoneId: number
  zone?: Pick<Zone, 'id' | 'name'>
}

export interface Camera {
  id: number
  name: string
  status: DeviceStatus
  fps: number
  updatedAt: string
  zoneId: number
  zone?: Pick<Zone, 'id' | 'name'>
}

export interface Device {
  id: number
  name: string
  model: string
  location: string
  status: DeviceStatus
  fps: number
  latency: number
  temp: number
  power: number
  aiModel: string
  memUsage: number
  cpuUsage: number
  uptime: string
  updatedAt: string
  zoneId: number | null
  zone?: Pick<Zone, 'id' | 'name'> | null
}

export interface Staff {
  id: number
  name: string
  role: string
  status: StaffStatus
  avatar: string
  tasks: number
  lastSeen: string
  updatedAt: string
  zoneId: number
  zone?: Pick<Zone, 'id' | 'name'>
  staffRole: string
  email?: string
}

export interface StaffTask {
  id: number
  text: string
  assignee: string
  priority: string
  time: string
  createdAt: string
}

export interface ZoneDensity {
  id: number
  density: number
  status: DensityStatus
  updatedAt: string
  zoneId: number
  zone?: Pick<Zone, 'id' | 'name'>
}

export interface DensityThreshold {
  id: number
  level: string
  range: string
  color: string
  bg: string
}

export interface Prediction {
  id: number
  prediction: string
  confidence: number
  trend: string
  severity: PredictionSeverity
  eta: string
  direction: string
  speed: string
  createdAt: string
  zoneId: number
  zone?: Pick<Zone, 'id' | 'name'>
}

export interface FlowData {
  id: number
  from: string
  to: string
  flow: number
  trend: string
}

export interface CrowdData {
  id: number
  time: string
  createdAt: string
  count: number
  density: number
}

export interface PeakData {
  id: number
  time: string
  createdAt: string
  count: number
}

export interface ZoneRanking {
  id: number
  zone: string
  avgDensity: number
  peakCount: number
  alerts: number
}

// ─── AI Models (Groq / YOLOv8 integrations) ───────────────────────────────

export interface GroqZoneDensity {
  zoneId: string
  zoneName: string
  floorName?: string
  type?: string
  threshold?: number
  currentCount: number
  maxCapacity: number
  fillPercent: number        // currentCount / maxCapacity * 100
  entryRate: number          // people/min entering
  exitRate: number           // people/min leaving
  density: number
  status: "safe" | "warning" | "critical"
}

export interface GroqPrediction {
  zoneId: string
  zoneName: string
  predictedCount: number
  timeToOvercrowd: number | null  // minutes, null if safe
  confidence: number              // 0-100
  trend: "rising" | "falling" | "stable"
}

export interface GroqSuggestion {
  id: string
  zoneId: string
  action: string             // e.g. "Redirect pilgrims to Tapovan Exit"
  priority: "critical" | "high" | "medium" | "low"
  reason: string
  affectedZones: string[]
}

export interface GroqDecision {
  id: string
  decision: string
  urgency: "critical" | "high" | "medium" | "low"
  affectedZones: string[]
  actionType: "stop_entry" | "limit_entry" | "redirect" | "open_zone" | "alert_staff"
  executedAt: string | null
}

// ─── Dashboard API Response Shape ─────────────────────────────────────────

export interface DashboardData {
  profileId?: string | null
  rooms: Room[]
  entries: EntryPoint[]
  suggestions: Suggestion[]
  alerts: Alert[]
  cameras: Camera[]
  devices: Device[]
  staff: Staff[]
  tasks: StaffTask[]
  zones: Zone[]
  zoneDensity: ZoneDensity[]
  thresholds: DensityThreshold[]
  predictions: Prediction[]
  flowData: FlowData[]
  crowdData: CrowdData[]
  peakData: PeakData[]
  zoneRanking: ZoneRanking[]
  alertSummary: AlertSummary[]
  alertLog: AlertLog[]
}

// ─── Store ────────────────────────────────────────────────────────────────

export interface AppState extends DashboardData {
  ready: boolean
  error: string | null

  // AI Pipeline State
  densityData: GroqZoneDensity[]
  aiPredictions: GroqPrediction[]
  aiSuggestions: GroqSuggestion[]
  decisions: GroqDecision[]
  groqLoading: boolean
  groqError: string | null
  lastGroqRun: Date | null

  // AI Pipeline Actions
  setDensityData: (data: GroqZoneDensity[]) => void
  setPredictions: (data: GroqPrediction[]) => void
  setSuggestions: (data: GroqSuggestion[]) => void
  setDecisions: (data: GroqDecision[]) => void
  setGroqLoading: (loading: boolean) => void
  setGroqError: (error: string | null) => void
  refreshGroqInsights: () => void

  // Actions
  fetchDashboardData: (force?: boolean) => Promise<void>
  setAlertResolved: (alertId: number, resolved: boolean) => void
  setSuggestionStatus: (suggestionId: number, status: AlertStatus) => void
  updateZone: (zoneId: number, patch: Partial<Zone>) => void
  patchTable: (tableName: string, payload: { eventType: string, new: any, old: any }) => void
}

export const useStore = create<AppState>((set, get) => ({
  ready: false,
  error: null,
  profileId: null,

  rooms: [],
  entries: [],
  suggestions: [],
  alerts: [],
  cameras: [],
  devices: [],
  staff: [],
  tasks: [],
  zones: [],
  zoneDensity: [],
  thresholds: [],
  predictions: [],
  flowData: [],
  crowdData: [],
  peakData: [],
  zoneRanking: [],
  alertSummary: [],
  alertLog: [],

  // AI Pipeline State defaults
  densityData: [],
  aiPredictions: [],
  aiSuggestions: [],
  decisions: [],
  groqLoading: false,
  groqError: null,
  lastGroqRun: null,

  // AI Pipeline Actions
  setDensityData: (data) => set({ densityData: data }),
  setPredictions: (data) => set({ aiPredictions: data }),
  setSuggestions: (data) => set({ aiSuggestions: data }),
  setDecisions: (data) => set({ decisions: data }),
  setGroqLoading: (loading) => set({ groqLoading: loading }),
  setGroqError: (error) => set({ groqError: error }),
  refreshGroqInsights: () => {
    // This will be overridden or listened to by the orchestrator hook
  },

  fetchDashboardData: async (force = false) => {
    if (get().ready && !force) return
    set({ error: null })
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const data = await res.json() as DashboardData
        set({ ...data, ready: true })
      } else {
        console.warn('Failed to fetch from API, falling back to local mock data.')
        const { fullMockData } = await import('@/lib/mockData')
        set({ ...fullMockData, ready: true } as any)
      }
    } catch (e) {
      console.warn('Network error, falling back to local mock data.', e)
      const { fullMockData } = await import('@/lib/mockData')
      set({ ...fullMockData, ready: true } as any)
    }
  },

  // Optimistic local update + server call
  setAlertResolved: async (alertId, resolved) => {
    set(state => ({
      alerts: state.alerts.map(a =>
        a.id === alertId
          ? { ...a, resolved, resolvedAt: resolved ? new Date().toISOString() : null }
          : a
      ),
      alertLog: state.alertLog.map(l =>
        l.id === alertId ? { ...l, resolved } : l
      ),
      zones: state.zones.map(z => ({
        ...z,
        alerts: z.alerts?.map(a => 
          a.id === alertId ? { ...a, resolved, resolvedAt: resolved ? new Date().toISOString() : null } : a
        )
      }))
    }))

    try {
      await fetch(`/api/alerts/${alertId}/resolve`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved })
      })
    } catch (e) {
      console.error('Failed to patch alert status:', e)
    }
  },

  // Optimistic local update — accept/ignore a suggestion
  setSuggestionStatus: (suggestionId, status) => {
    set(state => ({
      suggestions: state.suggestions.map(s =>
        s.id === suggestionId ? { ...s, status } : s
      ),
    }))
  },

  // Optimistic local update — patch a zone (e.g. after WebSocket push)
  updateZone: (zoneId, patch) => {
    set(state => ({
      zones: state.zones.map(z =>
        z.id === zoneId ? { ...z, ...patch } : z
      ),
    }))
  },

  // Generic Supabase Realtime patcher
  patchTable: (tableName, payload) => {
    const sliceName = tableName.charAt(0).toLowerCase() + tableName.slice(1) + 
                     (tableName.endsWith('s') ? '' : 's');
    
    // Manual mapping for special names if any
    const map: Record<string, string> = {
      'Staff': 'staff',
      'Alert': 'alerts',
      'StaffTask': 'tasks',
      'Zone': 'zones',
      'Camera': 'cameras',
      'Device': 'devices'
    };
    
    const key = map[tableName] || sliceName;

    set(state => {
      const currentItems = (state as any)[key] as any[];
      if (!currentItems) return state;

      // Ensure realtime payloads only apply to the current user's session
      if (payload.new) {
        if ('profileId' in payload.new && state.profileId && payload.new.profileId !== state.profileId) {
          return state;
        }
        if ('zoneId' in payload.new && payload.new.zoneId) {
          if (!state.zones.some(z => z.id === payload.new.zoneId)) {
            return state;
          }
        }
      }

      let newItems = [...currentItems];

      if (payload.eventType === 'INSERT') {
        const exists = newItems.some(item => item.id === payload.new.id);
        if (!exists) {
          newItems = [payload.new, ...newItems];
        }
      } else if (payload.eventType === 'UPDATE') {
        newItems = newItems.map(item => item.id === payload.new.id ? { ...item, ...payload.new } : item);
      } else if (payload.eventType === 'DELETE') {
        newItems = newItems.filter(item => item.id !== payload.old.id);
      }

      return { [key]: newItems };
    });
  },
}))

// ─── Selector hooks (avoids unnecessary re-renders) ───────────────────────

export const useZoneById = (id: number) =>
  useStore(s => s.zones.find(z => z.id === id))

export const useUnresolvedAlerts = () =>
  useStore(s => s.alerts.filter(a => !a.resolved))

export const useAlertsByZone = (zoneId: number) =>
  useStore(s => s.alerts.filter(a => a.zoneId === zoneId))

export const useCamerasByZone = (zoneId: number) =>
  useStore(s => s.cameras.filter(c => c.zoneId === zoneId))

export const useStaffByZone = (zoneId: number) =>
  useStore(s => s.staff.filter(st => st.zoneId === zoneId))

export const usePendingSuggestions = () =>
  useStore(s => s.suggestions.filter(sg => sg.status === 'pending'))

export const useCriticalZones = () =>
  useStore(s => s.zones.filter(z => z.level === 'danger'))

export const useOnlineDevices = () =>
  useStore(s => s.devices.filter(d => d.status === 'online'))
