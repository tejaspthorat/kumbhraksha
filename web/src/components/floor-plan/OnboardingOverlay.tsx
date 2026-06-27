'use client';

import { useFloorPlanStore, ROOM_TYPE_CONFIG, type FloorRoom } from '@/lib/floorPlanStore';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export default function OnboardingOverlay() {
  const { floors, activeFloorId, addRoom, setActiveTool } = useFloorPlanStore();
  const activeFloor = floors.find((f) => f.id === activeFloorId);

  if (activeFloor && activeFloor.rooms.length > 0) return null;

  const loadExample = () => {
    const exampleRooms: FloorRoom[] = [
      {
        id: uid(),
        name: 'Main Hall',
        type: 'Auditorium / Hall',
        x: 60,
        y: 40,
        width: 240,
        height: 160,
        color: ROOM_TYPE_CONFIG['Auditorium / Hall'].defaultColor,
        alertThreshold: 85,
        capacity: 200,
        currentOccupancy: 0,
        assignedUserIds: [],
        assetIds: [],
        floorId: activeFloorId,
      },
      {
        id: uid(),
        name: 'Meeting Room A',
        type: 'Meeting Room',
        x: 340,
        y: 40,
        width: 160,
        height: 100,
        color: ROOM_TYPE_CONFIG['Meeting Room'].defaultColor,
        alertThreshold: 85,
        capacity: 40,
        currentOccupancy: 0,
        assignedUserIds: [],
        assetIds: [],
        floorId: activeFloorId,
      },
      {
        id: uid(),
        name: 'Reception',
        type: 'Reception / Lobby',
        x: 340,
        y: 160,
        width: 160,
        height: 100,
        color: ROOM_TYPE_CONFIG['Reception / Lobby'].defaultColor,
        alertThreshold: 85,
        capacity: 50,
        currentOccupancy: 0,
        assignedUserIds: [],
        assetIds: [],
        floorId: activeFloorId,
      },
      {
        id: uid(),
        name: 'Storage',
        type: 'Storage',
        x: 60,
        y: 220,
        width: 100,
        height: 80,
        color: ROOM_TYPE_CONFIG['Storage'].defaultColor,
        alertThreshold: 85,
        capacity: 20,
        currentOccupancy: 0,
        assignedUserIds: [],
        assetIds: [],
        floorId: activeFloorId,
      },
      {
        id: uid(),
        name: 'Pantry',
        type: 'Kitchen / Pantry',
        x: 540,
        y: 40,
        width: 120,
        height: 100,
        color: ROOM_TYPE_CONFIG['Kitchen / Pantry'].defaultColor,
        alertThreshold: 85,
        capacity: 30,
        currentOccupancy: 0,
        assignedUserIds: [],
        assetIds: [],
        floorId: activeFloorId,
      },
      {
        id: uid(),
        name: 'Server Room',
        type: 'Server Room',
        x: 540,
        y: 160,
        width: 120,
        height: 100,
        color: ROOM_TYPE_CONFIG['Server Room'].defaultColor,
        alertThreshold: 85,
        capacity: 10,
        currentOccupancy: 0,
        assignedUserIds: [],
        assetIds: [],
        floorId: activeFloorId,
      },
    ];
    exampleRooms.forEach((r) => addRoom(activeFloorId, r));
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: 'rgba(5,13,20,0.85)',
        zIndex: 50,
      }}
    >
      <div style={{ fontSize: 28, opacity: 0.3 }}>◻</div>
      <div
        style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.4)',
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        Start by drawing your first room
        <br />
        <span style={{ fontSize: 10 }}>Select the Draw Room tool (R) in the toolbar</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button
          onClick={() => setActiveTool('draw-room')}
          style={{
            fontSize: 10,
            padding: '5px 12px',
            background: 'rgba(55,138,221,0.15)',
            border: '0.5px solid rgba(55,138,221,0.3)',
            borderRadius: 6,
            color: '#378ADD',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Draw Room (R)
        </button>
        <button
          onClick={loadExample}
          style={{
            fontSize: 10,
            padding: '5px 12px',
            background: 'rgba(255,255,255,0.05)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
          }}
        >
          Load Example Layout
        </button>
      </div>
    </div>
  );
}
