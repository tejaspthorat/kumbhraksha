'use client';

import type { Corridor as CorridorType, FloorRoom } from '@/lib/floorPlanStore';

interface CorridorLineProps {
  corridor: CorridorType;
  rooms: FloorRoom[];
}

export default function CorridorLine({ corridor, rooms }: CorridorLineProps) {
  const fromRoom = rooms.find((r) => r.id === corridor.fromRoomId);
  const toRoom = rooms.find((r) => r.id === corridor.toRoomId);

  // Calculate connection points (center of rooms)
  const fromX = corridor.fromX || (fromRoom ? fromRoom.x + fromRoom.width / 2 : 0);
  const fromY = corridor.fromY || (fromRoom ? fromRoom.y + fromRoom.height / 2 : 0);
  const toX = corridor.toX || (toRoom ? toRoom.x + toRoom.width / 2 : 0);
  const toY = corridor.toY || (toRoom ? toRoom.y + toRoom.height / 2 : 0);

  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  const colorMap = {
    primary: { bg: 'rgba(29,158,117,0.3)', border: 'rgba(29,158,117,0.6)' },
    emergency: { bg: 'rgba(226,75,74,0.3)', border: 'rgba(226,75,74,0.6)' },
    general: { bg: 'rgba(55,138,221,0.3)', border: 'rgba(55,138,221,0.6)' },
  };

  const colors = colorMap[corridor.type] ?? colorMap.general;
  const isEmergency = corridor.type === 'emergency';

  return (
    <div
      style={{
        position: 'absolute',
        left: fromX,
        top: fromY - (corridor.width * 5) / 2,
        width: length,
        height: Math.max(corridor.width * 5, 6),
        background: colors.bg,
        border: `0.5px ${isEmergency ? 'dashed' : 'solid'} ${colors.border}`,
        transformOrigin: 'left center',
        transform: `rotate(${angle}deg)`,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
