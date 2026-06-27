import { AlertStatus, Role, AlertLevel, ZoneLevel, DeviceStatus, StaffStatus, DensityStatus, PredictionSeverity } from './store'

const now = new Date().toISOString()

export const initialRooms = [
  // Ground Floor
  { id: 1, type: 'rectangle', x: 640, y: 60, width: 400, height: 200, name: 'Main Hall', color: '#378ADD', createdAt: now, updatedAt: now, floorId: 'floor-1' },
  { id: 2, type: 'rectangle', x: 160, y: 80, width: 300, height: 160, name: 'Gate A', color: '#32e251', createdAt: now, updatedAt: now, floorId: 'floor-1' },
  { id: 3, type: 'rectangle', x: 140, y: 380, width: 420, height: 120, name: 'Stage', color: '#d3f222', createdAt: now, updatedAt: now, floorId: 'floor-1' },
  { id: 4, type: 'rectangle', x: 700, y: 380, width: 280, height: 180, name: 'Food Court', color: '#BA7517', createdAt: now, updatedAt: now, floorId: 'floor-1' },
  { id: 5, type: 'rectangle', x: 320, y: 560, width: 160, height: 60, name: 'Room 102', color: '#378ADD', createdAt: now, updatedAt: now, floorId: 'floor-1' },
  
  // 1st Floor
  { id: 6, type: 'rectangle', x: 160, y: 60, width: 240, height: 100, name: 'Room 101', color: '#378ADD', createdAt: now, updatedAt: now, floorId: 'floor-9rbw0e9jmn9ekx50' },
  { id: 7, type: 'rectangle', x: 540, y: 40, width: 360, height: 160, name: 'Meeting Room', color: '#378ADD', createdAt: now, updatedAt: now, floorId: 'floor-9rbw0e9jmn9ekx50' },
  { id: 8, type: 'rectangle', x: 200, y: 300, width: 720, height: 100, name: 'Seminar Hall', color: '#E24B4A', createdAt: now, updatedAt: now, floorId: 'floor-9rbw0e9jmn9ekx50' },
]

export const initialEntries = [
  { id: 1, x: 50, y: 120, createdAt: now, updatedAt: now },
  { id: 2, x: 430, y: 100, createdAt: now, updatedAt: now },
  { id: 3, x: 110, y: 330, createdAt: now, updatedAt: now },
]

export const initialSuggestions = [
  { id: 1, condition: 'Stage Area density > 4.0 p/m²', action: 'Open emergency exit gate D', icon: 'DoorOpen', priority: 'high', confidence: 96, zone: 'Stage Area', status: 'pending', createdAt: now, updatedAt: now },
  { id: 2, condition: 'Gate A surge detected', action: 'Redirect crowd to Gate B entrance', icon: 'RotateCcw', priority: 'high', confidence: 92, zone: 'Gate A', status: 'pending', createdAt: now, updatedAt: now },
  { id: 3, condition: 'Main Hall approaching capacity', action: 'Deploy 2 additional staff to Hall', icon: 'Users', priority: 'medium', confidence: 85, zone: 'Main Hall', status: 'pending', createdAt: now, updatedAt: now },
  { id: 4, condition: 'Food Court queue > 5 min wait', action: 'Announce food truck area availability', icon: 'Megaphone', priority: 'low', confidence: 78, zone: 'Food Court', status: 'pending', createdAt: now, updatedAt: now },
  { id: 5, condition: 'VIP area unauthorized access', action: 'Alert security team for VIP zone', icon: 'Shield', priority: 'high', confidence: 99, zone: 'VIP Lounge', status: 'pending', createdAt: now, updatedAt: now },
]

export const allAlerts = [
  { id: 1, type: 'overcrowding', level: 'danger', title: 'Critical Overcrowding', description: 'Density exceeded 4.0 p/m² in Stage Area. Immediate action required.', zone: 'Stage Area', time: '1 min ago', resolved: false, resolvedAt: null, createdAt: now, updatedAt: now, zoneId: 3 },
  { id: 2, type: 'surge', level: 'danger', title: 'Sudden Surge Detected', description: 'Rapid crowd increase detected at Gate A. 50+ people in 30 seconds.', zone: 'Gate A', time: '3 min ago', resolved: false, resolvedAt: null, createdAt: now, updatedAt: now, zoneId: 1 },
  { id: 3, type: 'panic', level: 'warning', title: 'Unusual Movement Pattern', description: 'DeepSORT detected erratic movement vectors in Main Hall.', zone: 'Main Hall', time: '7 min ago', resolved: false, resolvedAt: null, createdAt: now, updatedAt: now, zoneId: 2 },
  { id: 4, type: 'intrusion', level: 'warning', title: 'Restricted Zone Violation', description: 'Unauthorized entry detected in backstage area.', zone: 'Backstage', time: '12 min ago', resolved: false, resolvedAt: null, createdAt: now, updatedAt: now, zoneId: 1 },
  { id: 5, type: 'overcrowding', level: 'info', title: 'Density Approaching Threshold', description: 'Food Court density at 2.8 p/m², approaching warning level.', zone: 'Food Court', time: '15 min ago', resolved: true, resolvedAt: now, createdAt: now, updatedAt: now, zoneId: 4 },
  { id: 6, type: 'surge', level: 'info', title: 'Crowd Flow Stabilized', description: 'Gate A inflow has returned to normal levels.', zone: 'Gate A', time: '20 min ago', resolved: true, resolvedAt: now, createdAt: now, updatedAt: now, zoneId: 1 },
  { id: 7, type: 'overcrowding', level: 'danger', title: 'Capacity Exceeded', description: 'Zone B has exceeded maximum safe capacity by 15%.', zone: 'Zone B', time: '25 min ago', resolved: true, resolvedAt: now, createdAt: now, updatedAt: now, zoneId: 1 },
  { id: 8, type: 'panic', level: 'warning', title: 'Rapid Dispersal Detected', description: 'Large group moving quickly away from Stage Area.', zone: 'Stage Area', time: '30 min ago', resolved: true, resolvedAt: now, createdAt: now, updatedAt: now, zoneId: 3 },
]

export const staffMembers = [
  { id: 1, name: 'John Carter', role: 'Security Lead', zone: 'Gate A', status: 'active', avatar: 'JC', tasks: 3, lastSeen: '1 min ago', updatedAt: now, zoneId: 1 },
  { id: 2, name: 'Sarah Chen', role: 'Guard', zone: 'Stage Area', status: 'active', avatar: 'SC', tasks: 2, lastSeen: '2 min ago', updatedAt: now, zoneId: 3 },
  { id: 3, name: 'Mike Johnson', role: 'Guard', zone: 'Main Hall', status: 'active', avatar: 'MJ', tasks: 1, lastSeen: '30 sec ago', updatedAt: now, zoneId: 2 },
  { id: 4, name: 'Emily Rodriguez', role: 'Coordinator', zone: 'Food Court', status: 'active', avatar: 'ER', tasks: 4, lastSeen: '5 min ago', updatedAt: now, zoneId: 4 },
  { id: 5, name: 'David Kim', role: 'Guard', zone: 'Exit B', status: 'break', avatar: 'DK', tasks: 0, lastSeen: '15 min ago', updatedAt: now, zoneId: 5 },
  { id: 6, name: 'Lisa Wang', role: 'Medic', zone: 'VIP Lounge', status: 'active', avatar: 'LW', tasks: 1, lastSeen: '3 min ago', updatedAt: now, zoneId: 6 },
]

export const staffTasksList = [
  { id: 1, text: 'Report to Gate A for crowd control', assignee: 'John Carter', priority: 'danger', time: '2 min ago', createdAt: now, updatedAt: now },
  { id: 2, text: 'Monitor Stage Area exits closely', assignee: 'Sarah Chen', priority: 'warning', time: '5 min ago', createdAt: now, updatedAt: now },
  { id: 3, text: 'Clear blocked emergency path in Hall', assignee: 'Mike Johnson', priority: 'danger', time: '8 min ago', createdAt: now, updatedAt: now },
  { id: 4, text: 'Guide overflow crowd to Food Truck area', assignee: 'Emily Rodriguez', priority: 'info', time: '12 min ago', createdAt: now, updatedAt: now },
]

export const crowdDataFields = [
  { id: 1, time: '08:00', count: 120, density: 0.8, createdAt: now },
  { id: 2, time: '09:00', count: 340, density: 1.5, createdAt: now },
  { id: 3, time: '10:00', count: 580, density: 2.8, createdAt: now },
  { id: 4, time: '11:00', count: 720, density: 3.2, createdAt: now },
  { id: 5, time: '12:00', count: 890, density: 3.8, createdAt: now },
  { id: 6, time: '13:00', count: 650, density: 2.9, createdAt: now },
  { id: 7, time: '14:00', count: 820, density: 3.5, createdAt: now },
  { id: 8, time: '15:00', count: 940, density: 4.1, createdAt: now },
  { id: 9, time: '16:00', count: 760, density: 3.3, createdAt: now },
  { id: 10, time: '17:00', count: 580, density: 2.5, createdAt: now },
]

export const zoneDensityList = [
  { id: 1, zone: 'Gate A', density: 3.8, status: 'danger', updatedAt: now, zoneId: 1 },
  { id: 2, zone: 'Hall B', density: 2.1, status: 'warning', updatedAt: now, zoneId: 2 },
  { id: 3, zone: 'Plaza', density: 1.5, status: 'warning', updatedAt: now, zoneId: 3 },
  { id: 4, zone: 'Exit C', density: 0.7, status: 'success', updatedAt: now, zoneId: 4 },
  { id: 5, zone: 'Stage', density: 4.2, status: 'danger', updatedAt: now, zoneId: 3 },
  { id: 6, zone: 'Food Court', density: 2.8, status: 'warning', updatedAt: now, zoneId: 4 },
]

export const zones = [
  { id: 1, name: 'Main Hall', type: 'General Area', floorName: 'Ground Floor', people: 100, area: 80, capacity: 100, density: 1.25, level: 'danger', threshold: 72, updatedAt: now },
  { id: 2, name: 'Gate A', type: 'General Area', floorName: 'Ground Floor', people: 40, area: 48, capacity: 50, density: 0.83, level: 'warning', threshold: 59, updatedAt: now },
  { id: 3, name: 'Stage', type: 'General Area', floorName: 'Ground Floor', people: 15, area: 50, capacity: 65, density: 0.30, level: 'success', threshold: 85, updatedAt: now },
  { id: 4, name: 'Food Court', type: 'Kitchen / Pantry', floorName: 'Ground Floor', people: 18, area: 50, capacity: 25, density: 0.36, level: 'warning', threshold: 80, updatedAt: now },
  { id: 5, name: 'Room 102', type: 'General Area', floorName: 'Ground Floor', people: 9, area: 10, capacity: 10, density: 0.90, level: 'danger', threshold: 71, updatedAt: now },
  { id: 6, name: 'Room 101', type: 'General Area', floorName: '1st Floor', people: 0, area: 24, capacity: 10, density: 0.00, level: 'success', threshold: 85, updatedAt: now },
  { id: 7, name: 'Meeting Room', type: 'Meeting Room', floorName: '1st Floor', people: 0, area: 58, capacity: 20, density: 0.00, level: 'success', threshold: 85, updatedAt: now },
  { id: 8, name: 'Seminar Hall', type: 'Auditorium / Hall', floorName: '1st Floor', people: 0, area: 72, capacity: 100, density: 0.00, level: 'success', threshold: 85, updatedAt: now },
]

export const thresholds = [
  { id: 1, level: 'Low', range: '< 1 person/m²', color: '#10b981', bg: 'bg-emerald-500/10', createdAt: now, updatedAt: now },
  { id: 2, level: 'Medium', range: '1–3 person/m²', color: '#f59e0b', bg: 'bg-amber-500/10', createdAt: now, updatedAt: now },
  { id: 3, level: 'High', range: '> 3 person/m²', color: '#ef4444', bg: 'bg-red-500/10', createdAt: now, updatedAt: now },
]

export const devices = [
  { id: 1, name: 'Edge Node Alpha', model: 'Raspberry Pi 5', location: 'Gate A', status: 'online', fps: 24, latency: 42, temp: 58, power: 85, aiModel: 'YOLOv8 Nano', memUsage: 72, cpuUsage: 68, uptime: '3d 14h', updatedAt: now, zoneId: 1 },
  { id: 2, name: 'Edge Node Beta', model: 'Jetson Nano', location: 'Stage Area', status: 'online', fps: 30, latency: 28, temp: 62, power: 92, aiModel: 'YOLOv8 Nano', memUsage: 65, cpuUsage: 78, uptime: '5d 8h', updatedAt: now, zoneId: 3 },
  { id: 3, name: 'Edge Node Gamma', model: 'Raspberry Pi 4', location: 'Food Court', status: 'online', fps: 18, latency: 55, temp: 52, power: 70, aiModel: 'YOLOv8 Nano', memUsage: 80, cpuUsage: 55, uptime: '1d 6h', updatedAt: now, zoneId: 4 },
  { id: 4, name: 'Edge Node Delta', model: 'Jetson Orin', location: 'Main Hall', status: 'offline', fps: 0, latency: 0, temp: 25, power: 0, aiModel: 'YOLOv8 Small', memUsage: 0, cpuUsage: 0, uptime: 'Offline', updatedAt: now, zoneId: 2 },
]

export const predictions = [
  { id: 1, zone: 'Zone B - Hall', prediction: 'Overload expected in 2 min', confidence: 94, trend: 'rising', severity: 'danger', eta: '2 min', direction: 'NE', speed: 'Fast', createdAt: now, zoneId: 2 },
  { id: 2, zone: 'Gate A - Entry', prediction: 'Congestion likely in 5 min', confidence: 87, trend: 'rising', severity: 'warning', eta: '5 min', direction: 'E', speed: 'Moderate', createdAt: now, zoneId: 1 },
  { id: 3, zone: 'Food Court', prediction: 'Steady flow, slight increase', confidence: 72, trend: 'stable', severity: 'info', eta: '8 min', direction: 'SE', speed: 'Slow', createdAt: now, zoneId: 4 },
  { id: 4, zone: 'Exit C', prediction: 'Clearing expected in 3 min', confidence: 91, trend: 'decreasing', severity: 'success', eta: '3 min', direction: 'S', speed: 'Fast', createdAt: now, zoneId: 4 },
]

export const flowData = [
  { id: 1, from: 'Gate A', to: 'Main Hall', flow: 45, trend: 'up', createdAt: now, updatedAt: now },
  { id: 2, from: 'Main Hall', to: 'Stage Area', flow: 32, trend: 'up', createdAt: now, updatedAt: now },
  { id: 3, from: 'Stage Area', to: 'Food Court', flow: 18, trend: 'stable', createdAt: now, updatedAt: now },
  { id: 4, from: 'Food Court', to: 'Exit B', flow: 12, trend: 'down', createdAt: now, updatedAt: now },
  { id: 5, from: 'Gate A', to: 'VIP Lounge', flow: 5, trend: 'stable', createdAt: now, updatedAt: now },
]

export const peakData = [
  { id: 1, time: '06:00', count: 50, createdAt: now, updatedAt: now }, { id: 2, time: '08:00', count: 180, createdAt: now, updatedAt: now }, { id: 3, time: '10:00', count: 420, createdAt: now, updatedAt: now }, { id: 4, time: '12:00', count: 780, createdAt: now, updatedAt: now },
  { id: 5, time: '14:00', count: 920, createdAt: now, updatedAt: now }, { id: 6, time: '16:00', count: 850, createdAt: now, updatedAt: now }, { id: 7, time: '18:00', count: 640, createdAt: now, updatedAt: now }, { id: 8, time: '20:00', count: 380, createdAt: now, updatedAt: now }, { id: 9, time: '22:00', count: 120, createdAt: now, updatedAt: now },
]

export const zoneRanking = [
  { id: 1, zone: 'Stage Area', avgDensity: 3.8, peakCount: 420, alerts: 12, createdAt: now, updatedAt: now },
  { id: 2, zone: 'Gate A', avgDensity: 3.2, peakCount: 350, alerts: 8, createdAt: now, updatedAt: now },
  { id: 3, zone: 'Food Court', avgDensity: 2.5, peakCount: 180, alerts: 4, createdAt: now, updatedAt: now },
  { id: 4, zone: 'Main Hall', avgDensity: 1.8, peakCount: 310, alerts: 3, createdAt: now, updatedAt: now },
  { id: 5, zone: 'Exit B', avgDensity: 0.6, peakCount: 45, alerts: 0, createdAt: now, updatedAt: now },
]

export const alertSummary = [
  { id: 1, name: 'Overcrowding', value: 18, color: '#ef4444', createdAt: now, updatedAt: now },
  { id: 2, name: 'Intrusion', value: 6, color: '#f59e0b', createdAt: now, updatedAt: now },
  { id: 3, name: 'Panic', value: 4, color: '#8b5cf6', createdAt: now, updatedAt: now },
  { id: 4, name: 'Surge', value: 8, color: '#3b82f6', createdAt: now, updatedAt: now },
]

export const alertLog = [
  { id: 1, time: '14:32', type: 'Overcrowding', zone: 'Stage', severity: 'danger', resolved: true, createdAt: now, updatedAt: now, zoneId: 3 },
  { id: 2, time: '14:15', type: 'Surge', zone: 'Gate A', severity: 'danger', resolved: true, createdAt: now, updatedAt: now, zoneId: 2 },
  { id: 3, time: '13:48', type: 'Intrusion', zone: 'Room 102', severity: 'warning', resolved: true, createdAt: now, updatedAt: now, zoneId: 5 },
  { id: 4, time: '13:20', type: 'Overcrowding', zone: 'Gate A', severity: 'danger', resolved: true, createdAt: now, updatedAt: now, zoneId: 2 },
  { id: 5, time: '12:55', type: 'Panic', zone: 'Main Hall', severity: 'warning', resolved: true, createdAt: now, updatedAt: now, zoneId: 1 },
  { id: 6, time: '12:10', type: 'Overcrowding', zone: 'Food Court', severity: 'info', resolved: true, createdAt: now, updatedAt: now, zoneId: 4 },
]

export const cameras = [
  { id: 1, name: 'Gate A - Entry', status: 'online', zone: 'Gate A', fps: 30, updatedAt: now, zoneId: 2 },
  { id: 2, name: 'Main Hall - Center', status: 'online', zone: 'Main Hall', fps: 28, updatedAt: now, zoneId: 1 },
  { id: 3, name: 'Stage - Front', status: 'online', zone: 'Stage', fps: 30, updatedAt: now, zoneId: 3 },
  { id: 4, name: 'Food Court - East', status: 'online', zone: 'Food Court', fps: 25, updatedAt: now, zoneId: 4 },
  { id: 5, name: 'Room 102 - Internal', status: 'online', zone: 'Room 102', fps: 24, updatedAt: now, zoneId: 5 },
  { id: 6, name: 'Room 101 - Entry', status: 'offline', zone: 'Room 101', fps: 0, updatedAt: now, zoneId: 6 },
]

// Fallback bundle for store.ts exactly matching what API returns
export const fullMockData = {
  rooms: initialRooms,
  entries: initialEntries,
  suggestions: initialSuggestions,
  alerts: allAlerts,
  cameras,
  devices,
  staff: staffMembers,
  tasks: staffTasksList,
  zones,
  zoneDensity: zoneDensityList,
  thresholds,
  predictions,
  flowData,
  crowdData: crowdDataFields,
  peakData,
  zoneRanking,
  alertSummary,
  alertLog,
}
