
const now = new Date().toISOString()

export const initialRooms = [
  // Panchavati operations grid
  { id: 1, type: 'rectangle', x: 640, y: 60, width: 400, height: 200, name: 'Ramkund Holding Area', color: '#378ADD', createdAt: now, updatedAt: now, floorId: 'floor-1' },
  { id: 2, type: 'rectangle', x: 160, y: 80, width: 300, height: 160, name: 'Trimbak Road Entry', color: '#32e251', createdAt: now, updatedAt: now, floorId: 'floor-1' },
  { id: 3, type: 'rectangle', x: 140, y: 380, width: 420, height: 120, name: 'Godavari Aarti Ghat', color: '#d3f222', createdAt: now, updatedAt: now, floorId: 'floor-1' },
  { id: 4, type: 'rectangle', x: 700, y: 380, width: 280, height: 180, name: 'Panchavati Annadan Kshetra', color: '#BA7517', createdAt: now, updatedAt: now, floorId: 'floor-1' },
  { id: 5, type: 'rectangle', x: 320, y: 560, width: 160, height: 60, name: 'Medical Aid Tent', color: '#378ADD', createdAt: now, updatedAt: now, floorId: 'floor-1' },

  // Command support
  { id: 6, type: 'rectangle', x: 160, y: 60, width: 240, height: 100, name: 'Lost & Found Desk', color: '#378ADD', createdAt: now, updatedAt: now, floorId: 'floor-9rbw0e9jmn9ekx50' },
  { id: 7, type: 'rectangle', x: 540, y: 40, width: 360, height: 160, name: 'Police Briefing Room', color: '#378ADD', createdAt: now, updatedAt: now, floorId: 'floor-9rbw0e9jmn9ekx50' },
  { id: 8, type: 'rectangle', x: 200, y: 300, width: 720, height: 100, name: 'Volunteer Rest Bay', color: '#E24B4A', createdAt: now, updatedAt: now, floorId: 'floor-9rbw0e9jmn9ekx50' },
]

export const initialEntries = [
  { id: 1, x: 50, y: 120, createdAt: now, updatedAt: now },
  { id: 2, x: 430, y: 100, createdAt: now, updatedAt: now },
  { id: 3, x: 110, y: 330, createdAt: now, updatedAt: now },
]

export const initialSuggestions = [
  { id: 1, condition: 'Ramkund Ghat density > 4.0 p/m2', action: 'Open overflow corridor toward Godavari bridge', icon: 'DoorOpen', priority: 'high', confidence: 96, zone: 'Ramkund Ghat', status: 'pending', createdAt: now, updatedAt: now },
  { id: 2, condition: 'Trimbak Road Entry surge detected', action: 'Redirect crowd to Tapovan holding lane', icon: 'RotateCcw', priority: 'high', confidence: 92, zone: 'Trimbak Road Entry', status: 'pending', createdAt: now, updatedAt: now },
  { id: 3, condition: 'Sadhugram Camp approaching capacity', action: 'Deploy 2 additional staff to Sadhugram Camp', icon: 'Users', priority: 'medium', confidence: 85, zone: 'Sadhugram Camp', status: 'pending', createdAt: now, updatedAt: now },
  { id: 4, condition: 'Annadan Kshetra queue > 5 min wait', action: 'Announce alternate prasad queue near Tapovan', icon: 'Megaphone', priority: 'low', confidence: 78, zone: 'Panchavati Annadan Kshetra', status: 'pending', createdAt: now, updatedAt: now },
  { id: 5, condition: 'Akhada procession route breach', action: 'Alert police team at Akhada Procession Route', icon: 'Shield', priority: 'high', confidence: 99, zone: 'Akhada Procession Route', status: 'pending', createdAt: now, updatedAt: now },
]

export const allAlerts = [
  { id: 1, type: 'overcrowding', level: 'danger', title: 'Critical Overcrowding', description: 'Density exceeded 4.0 p/m2 at Ramkund Ghat. Immediate action required.', zone: 'Ramkund Ghat', time: '1 min ago', resolved: false, resolvedAt: null, createdAt: now, updatedAt: now, zoneId: 1 },
  { id: 2, type: 'surge', level: 'danger', title: 'Sudden Surge Detected', description: 'Rapid crowd increase detected at Trimbak Road Entry. 50+ people in 30 seconds.', zone: 'Trimbak Road Entry', time: '3 min ago', resolved: false, resolvedAt: null, createdAt: now, updatedAt: now, zoneId: 2 },
  { id: 3, type: 'panic', level: 'warning', title: 'Unusual Movement Pattern', description: 'DeepSORT detected erratic movement vectors near Sadhugram Camp.', zone: 'Sadhugram Camp', time: '7 min ago', resolved: false, resolvedAt: null, createdAt: now, updatedAt: now, zoneId: 7 },
  { id: 4, type: 'intrusion', level: 'warning', title: 'Restricted Route Violation', description: 'Unauthorized entry detected on the Akhada procession lane.', zone: 'Akhada Procession Route', time: '12 min ago', resolved: false, resolvedAt: null, createdAt: now, updatedAt: now, zoneId: 2 },
  { id: 5, type: 'overcrowding', level: 'info', title: 'Density Approaching Threshold', description: 'Annadan Kshetra density at 2.8 p/m2, approaching warning level.', zone: 'Panchavati Annadan Kshetra', time: '15 min ago', resolved: true, resolvedAt: now, createdAt: now, updatedAt: now, zoneId: 4 },
  { id: 6, type: 'surge', level: 'info', title: 'Crowd Flow Stabilized', description: 'Trimbak Road Entry inflow has returned to normal levels.', zone: 'Trimbak Road Entry', time: '20 min ago', resolved: true, resolvedAt: now, createdAt: now, updatedAt: now, zoneId: 2 },
  { id: 7, type: 'overcrowding', level: 'danger', title: 'Capacity Exceeded', description: 'Godavari Aarti Ghat has exceeded maximum safe capacity by 15%.', zone: 'Godavari Aarti Ghat', time: '25 min ago', resolved: true, resolvedAt: now, createdAt: now, updatedAt: now, zoneId: 3 },
  { id: 8, type: 'panic', level: 'warning', title: 'Rapid Dispersal Detected', description: 'Large group moving quickly away from Ramkund Holding Area.', zone: 'Ramkund Holding Area', time: '30 min ago', resolved: true, resolvedAt: now, createdAt: now, updatedAt: now, zoneId: 1 },
]

export const staffMembers = [
  { id: 1, name: 'Prakash Shinde', role: 'Security Lead', zone: 'Ramkund Ghat', status: 'active', avatar: 'PS', tasks: 3, lastSeen: '1 min ago', updatedAt: now, zoneId: 1 },
  { id: 2, name: 'Neha Patil', role: 'Guard', zone: 'Godavari Aarti Ghat', status: 'active', avatar: 'NP', tasks: 2, lastSeen: '2 min ago', updatedAt: now, zoneId: 3 },
  { id: 3, name: 'Amit Jadhav', role: 'Guard', zone: 'Sadhugram Camp', status: 'active', avatar: 'AJ', tasks: 1, lastSeen: '30 sec ago', updatedAt: now, zoneId: 7 },
  { id: 4, name: 'Meera Kulkarni', role: 'Coordinator', zone: 'Panchavati Annadan Kshetra', status: 'active', avatar: 'MK', tasks: 4, lastSeen: '5 min ago', updatedAt: now, zoneId: 4 },
  { id: 5, name: 'Sameer Pawar', role: 'Guard', zone: 'Tapovan Exit', status: 'break', avatar: 'SP', tasks: 0, lastSeen: '15 min ago', updatedAt: now, zoneId: 6 },
  { id: 6, name: 'Farah Shaikh', role: 'Medic', zone: 'Medical Aid Tent', status: 'active', avatar: 'FS', tasks: 1, lastSeen: '3 min ago', updatedAt: now, zoneId: 5 },
]

export const staffTasksList = [
  { id: 1, text: 'Report to Ramkund Ghat for crowd control', assignee: 'Prakash Shinde', priority: 'danger', time: '2 min ago', createdAt: now, updatedAt: now },
  { id: 2, text: 'Monitor Godavari Aarti Ghat exits closely', assignee: 'Neha Patil', priority: 'warning', time: '5 min ago', createdAt: now, updatedAt: now },
  { id: 3, text: 'Clear blocked emergency path near Sadhugram Camp', assignee: 'Amit Jadhav', priority: 'danger', time: '8 min ago', createdAt: now, updatedAt: now },
  { id: 4, text: 'Guide overflow crowd to Tapovan annadan queue', assignee: 'Meera Kulkarni', priority: 'info', time: '12 min ago', createdAt: now, updatedAt: now },
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
  { id: 1, zone: 'Ramkund Ghat', density: 3.8, status: 'danger', updatedAt: now, zoneId: 1 },
  { id: 2, zone: 'Sadhugram Camp', density: 2.1, status: 'warning', updatedAt: now, zoneId: 7 },
  { id: 3, zone: 'Godavari Aarti Ghat', density: 1.5, status: 'warning', updatedAt: now, zoneId: 3 },
  { id: 4, zone: 'Tapovan Exit', density: 0.7, status: 'success', updatedAt: now, zoneId: 6 },
  { id: 5, zone: 'Trimbak Road Entry', density: 4.2, status: 'danger', updatedAt: now, zoneId: 2 },
  { id: 6, zone: 'Panchavati Annadan Kshetra', density: 2.8, status: 'warning', updatedAt: now, zoneId: 4 },
]

export const zones = [
  { id: 1, name: 'Ramkund Ghat', type: 'Bathing Ghat', floorName: 'Panchavati Ground Grid', people: 1180, area: 290, capacity: 900, density: 4.07, level: 'danger', threshold: 72, updatedAt: now },
  { id: 2, name: 'Trimbak Road Entry', type: 'Entry Corridor', floorName: 'Panchavati Ground Grid', people: 620, area: 210, capacity: 750, density: 2.95, level: 'warning', threshold: 59, updatedAt: now },
  { id: 3, name: 'Godavari Aarti Ghat', type: 'Ghat Viewing Area', floorName: 'Panchavati Ground Grid', people: 420, area: 180, capacity: 550, density: 2.33, level: 'warning', threshold: 85, updatedAt: now },
  { id: 4, name: 'Panchavati Annadan Kshetra', type: 'Food Distribution', floorName: 'Panchavati Ground Grid', people: 280, area: 160, capacity: 350, density: 1.75, level: 'warning', threshold: 80, updatedAt: now },
  { id: 5, name: 'Medical Aid Tent', type: 'Medical Support', floorName: 'Panchavati Ground Grid', people: 42, area: 70, capacity: 90, density: 0.60, level: 'success', threshold: 71, updatedAt: now },
  { id: 6, name: 'Tapovan Exit', type: 'Exit Corridor', floorName: 'Panchavati Ground Grid', people: 75, area: 140, capacity: 250, density: 0.54, level: 'success', threshold: 85, updatedAt: now },
  { id: 7, name: 'Sadhugram Camp', type: 'Pilgrim Camp', floorName: 'Operations Deck', people: 700, area: 280, capacity: 800, density: 2.50, level: 'warning', threshold: 85, updatedAt: now },
  { id: 8, name: 'Police Briefing Room', type: 'Command Support', floorName: 'Operations Deck', people: 18, area: 58, capacity: 35, density: 0.31, level: 'success', threshold: 85, updatedAt: now },
]

export const thresholds = [
  { id: 1, level: 'Low', range: '< 1 person/m2', color: '#10b981', bg: 'bg-emerald-500/10', createdAt: now, updatedAt: now },
  { id: 2, level: 'Medium', range: '1-3 person/m2', color: '#f59e0b', bg: 'bg-amber-500/10', createdAt: now, updatedAt: now },
  { id: 3, level: 'High', range: '> 3 person/m2', color: '#ef4444', bg: 'bg-red-500/10', createdAt: now, updatedAt: now },
]

export const devices = [
  { id: 1, name: 'Edge Node Ramkund', model: 'Raspberry Pi 5', location: 'Ramkund Ghat', status: 'online', fps: 24, latency: 42, temp: 58, power: 85, aiModel: 'YOLOv8 Nano', memUsage: 72, cpuUsage: 68, uptime: '3d 14h', updatedAt: now, zoneId: 1 },
  { id: 2, name: 'Edge Node Trimbak', model: 'Jetson Nano', location: 'Trimbak Road Entry', status: 'online', fps: 30, latency: 28, temp: 62, power: 92, aiModel: 'YOLOv8 Nano', memUsage: 65, cpuUsage: 78, uptime: '5d 8h', updatedAt: now, zoneId: 2 },
  { id: 3, name: 'Edge Node Panchavati', model: 'Raspberry Pi 4', location: 'Panchavati Annadan Kshetra', status: 'online', fps: 18, latency: 55, temp: 52, power: 70, aiModel: 'YOLOv8 Nano', memUsage: 80, cpuUsage: 55, uptime: '1d 6h', updatedAt: now, zoneId: 4 },
  { id: 4, name: 'Edge Node Sadhugram', model: 'Jetson Orin', location: 'Sadhugram Camp', status: 'offline', fps: 0, latency: 0, temp: 25, power: 0, aiModel: 'YOLOv8 Small', memUsage: 0, cpuUsage: 0, uptime: 'Offline', updatedAt: now, zoneId: 7 },
]

export const predictions = [
  { id: 1, zone: 'Ramkund Ghat', prediction: 'Overload expected in 2 min', confidence: 94, trend: 'rising', severity: 'danger', eta: '2 min', direction: 'NE', speed: 'Fast', createdAt: now, zoneId: 1 },
  { id: 2, zone: 'Trimbak Road Entry', prediction: 'Congestion likely in 5 min', confidence: 87, trend: 'rising', severity: 'warning', eta: '5 min', direction: 'E', speed: 'Moderate', createdAt: now, zoneId: 2 },
  { id: 3, zone: 'Panchavati Annadan Kshetra', prediction: 'Steady flow, slight increase', confidence: 72, trend: 'stable', severity: 'info', eta: '8 min', direction: 'SE', speed: 'Slow', createdAt: now, zoneId: 4 },
  { id: 4, zone: 'Tapovan Exit', prediction: 'Clearing expected in 3 min', confidence: 91, trend: 'decreasing', severity: 'success', eta: '3 min', direction: 'S', speed: 'Fast', createdAt: now, zoneId: 6 },
]

export const flowData = [
  { id: 1, from: 'Trimbak Road Entry', to: 'Ramkund Ghat', flow: 45, trend: 'up', createdAt: now, updatedAt: now },
  { id: 2, from: 'Ramkund Ghat', to: 'Godavari Aarti Ghat', flow: 32, trend: 'up', createdAt: now, updatedAt: now },
  { id: 3, from: 'Godavari Aarti Ghat', to: 'Panchavati Annadan Kshetra', flow: 18, trend: 'stable', createdAt: now, updatedAt: now },
  { id: 4, from: 'Panchavati Annadan Kshetra', to: 'Tapovan Exit', flow: 12, trend: 'down', createdAt: now, updatedAt: now },
  { id: 5, from: 'Trimbak Road Entry', to: 'Akhada Procession Route', flow: 5, trend: 'stable', createdAt: now, updatedAt: now },
]

export const peakData = [
  { id: 1, time: '06:00', count: 50, createdAt: now, updatedAt: now }, { id: 2, time: '08:00', count: 180, createdAt: now, updatedAt: now }, { id: 3, time: '10:00', count: 420, createdAt: now, updatedAt: now }, { id: 4, time: '12:00', count: 780, createdAt: now, updatedAt: now },
  { id: 5, time: '14:00', count: 920, createdAt: now, updatedAt: now }, { id: 6, time: '16:00', count: 850, createdAt: now, updatedAt: now }, { id: 7, time: '18:00', count: 640, createdAt: now, updatedAt: now }, { id: 8, time: '20:00', count: 380, createdAt: now, updatedAt: now }, { id: 9, time: '22:00', count: 120, createdAt: now, updatedAt: now },
]

export const zoneRanking = [
  { id: 1, zone: 'Ramkund Ghat', avgDensity: 3.8, peakCount: 420, alerts: 12, createdAt: now, updatedAt: now },
  { id: 2, zone: 'Trimbak Road Entry', avgDensity: 3.2, peakCount: 350, alerts: 8, createdAt: now, updatedAt: now },
  { id: 3, zone: 'Panchavati Annadan Kshetra', avgDensity: 2.5, peakCount: 180, alerts: 4, createdAt: now, updatedAt: now },
  { id: 4, zone: 'Sadhugram Camp', avgDensity: 1.8, peakCount: 310, alerts: 3, createdAt: now, updatedAt: now },
  { id: 5, zone: 'Tapovan Exit', avgDensity: 0.6, peakCount: 45, alerts: 0, createdAt: now, updatedAt: now },
]

export const alertSummary = [
  { id: 1, name: 'Overcrowding', value: 18, color: '#ef4444', createdAt: now, updatedAt: now },
  { id: 2, name: 'Route breach', value: 6, color: '#f59e0b', createdAt: now, updatedAt: now },
  { id: 3, name: 'Panic', value: 4, color: '#8b5cf6', createdAt: now, updatedAt: now },
  { id: 4, name: 'Surge', value: 8, color: '#3b82f6', createdAt: now, updatedAt: now },
]

export const alertLog = [
  { id: 1, time: '14:32', type: 'Overcrowding', zone: 'Ramkund Ghat', severity: 'danger', resolved: true, createdAt: now, updatedAt: now, zoneId: 1 },
  { id: 2, time: '14:15', type: 'Surge', zone: 'Trimbak Road Entry', severity: 'danger', resolved: true, createdAt: now, updatedAt: now, zoneId: 2 },
  { id: 3, time: '13:48', type: 'Route breach', zone: 'Akhada Procession Route', severity: 'warning', resolved: true, createdAt: now, updatedAt: now, zoneId: 2 },
  { id: 4, time: '13:20', type: 'Overcrowding', zone: 'Godavari Aarti Ghat', severity: 'danger', resolved: true, createdAt: now, updatedAt: now, zoneId: 3 },
  { id: 5, time: '12:55', type: 'Panic', zone: 'Sadhugram Camp', severity: 'warning', resolved: true, createdAt: now, updatedAt: now, zoneId: 7 },
  { id: 6, time: '12:10', type: 'Overcrowding', zone: 'Panchavati Annadan Kshetra', severity: 'info', resolved: true, createdAt: now, updatedAt: now, zoneId: 4 },
]

export const cameras = [
  { id: 1, name: 'Ramkund Ghat - Entry', status: 'online', zone: 'Ramkund Ghat', fps: 30, updatedAt: now, zoneId: 1 },
  { id: 2, name: 'Trimbak Road - Crowd Lane', status: 'online', zone: 'Trimbak Road Entry', fps: 28, updatedAt: now, zoneId: 2 },
  { id: 3, name: 'Godavari Aarti - Front', status: 'online', zone: 'Godavari Aarti Ghat', fps: 30, updatedAt: now, zoneId: 3 },
  { id: 4, name: 'Annadan Kshetra - East', status: 'online', zone: 'Panchavati Annadan Kshetra', fps: 25, updatedAt: now, zoneId: 4 },
  { id: 5, name: 'Medical Aid Tent - Internal', status: 'online', zone: 'Medical Aid Tent', fps: 24, updatedAt: now, zoneId: 5 },
  { id: 6, name: 'Tapovan Exit - Entry', status: 'offline', zone: 'Tapovan Exit', fps: 0, updatedAt: now, zoneId: 6 },
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
