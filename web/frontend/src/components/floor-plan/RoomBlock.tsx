'use client';

import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  useFloorPlanStore,
  FloorRoom,
  ROOM_TYPE_CONFIG,
  type FloorUser,
} from '@/lib/floorPlanStore';

interface RoomBlockProps {
  room: FloorRoom;
  isSelected: boolean;
  scale: number;
  users: FloorUser[];
}

export default function RoomBlock({ room, isSelected, scale, users }: RoomBlockProps) {
  const dragRef = useRef<{ startX: number; startY: number; roomX: number; roomY: number } | null>(null);
  const resizeRef = useRef<{
    handle: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const {
    selectElement,
    updateRoom,
    activeTool,
    snapToGrid,
    gridSize,
    pushHistory,
    corridorFromRoomId,
    setCorridorFrom,
    addCorridor,
    activeFloorId,
  } = useFloorPlanStore();

  const config = ROOM_TYPE_CONFIG[room.type] ?? ROOM_TYPE_CONFIG['General Area'];

  // Calculate capacity
  const areaM2 = (room.width * room.height) / 10000;
  const maxCapacity = room.capacity || Math.floor(areaM2 * config.capacityMultiplier * 100);
  const occupancyPct = maxCapacity > 0 ? (room.currentOccupancy / maxCapacity) * 100 : 0;

  // Color for occupancy bar
  const occColor = occupancyPct > 85 ? '#E24B4A' : occupancyPct > 60 ? '#EF9F27' : '#639922';

  // Density heatmap color
  const heatmapBg = `${room.color}22`;

  // Assigned users to display
  const assignedUsers = users.filter((u) => room.assignedUserIds.includes(u.id));
  const displayUsers = assignedUsers.slice(0, 3);
  const extraCount = Math.max(0, assignedUsers.length - 3);

  const snapValue = useCallback(
    (val: number) => {
      if (!snapToGrid) return val;
      return Math.round(val / gridSize) * gridSize;
    },
    [snapToGrid, gridSize]
  );

  // ─── Room drag (move) ──────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool === 'draw-corridor') {
        e.stopPropagation();
        const posPos = { x: snapValue(e.clientX / scale), y: snapValue(e.clientY / scale) };
        if (!corridorFromRoomId) {
          setCorridorFrom(room.id, posPos);
        } else if (corridorFromRoomId !== room.id) {
          pushHistory();
          // Provide default visual connection, from room centers
          addCorridor(activeFloorId, {
            id: Math.random().toString(36).slice(2, 10),
            fromRoomId: corridorFromRoomId,
            toRoomId: room.id,
            width: 15,
            type: 'general',
            floorId: activeFloorId,
            fromX: posPos.x,
            fromY: posPos.y,
            toX: posPos.x,
            toY: posPos.y,
          });
          setCorridorFrom(null, null);
        }
        return;
      }
      if (activeTool !== 'select') return;
      e.stopPropagation();
      selectElement(room.id, 'room');
      pushHistory();

      const startX = e.clientX / scale;
      const startY = e.clientY / scale;
      dragRef.current = { startX, startY, roomX: room.x, roomY: room.y };

      const handleMouseMove = (me: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = me.clientX / scale - dragRef.current.startX;
        const dy = me.clientY / scale - dragRef.current.startY;
        updateRoom(room.id, {
          x: snapValue(dragRef.current.roomX + dx),
          y: snapValue(dragRef.current.roomY + dy),
        });
      };

      const handleMouseUp = () => {
        dragRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [activeTool, room.id, room.x, room.y, scale, selectElement, updateRoom, snapValue, pushHistory, corridorFromRoomId, setCorridorFrom, addCorridor, activeFloorId]
  );

  // ─── Resize handle ─────────────────────────────────────────────
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: string) => {
      e.stopPropagation();
      e.preventDefault();
      pushHistory();

      resizeRef.current = {
        handle,
        startX: e.clientX / scale,
        startY: e.clientY / scale,
        origX: room.x,
        origY: room.y,
        origW: room.width,
        origH: room.height,
      };

      const handleMouseMove = (me: MouseEvent) => {
        if (!resizeRef.current) return;
        const dx = me.clientX / scale - resizeRef.current.startX;
        const dy = me.clientY / scale - resizeRef.current.startY;
        const r = resizeRef.current;

        let newX = r.origX;
        let newY = r.origY;
        let newW = r.origW;
        let newH = r.origH;

        if (handle.includes('right')) newW = Math.max(40, r.origW + dx);
        if (handle.includes('left')) {
          newW = Math.max(40, r.origW - dx);
          newX = r.origX + r.origW - newW;
        }
        if (handle.includes('bottom')) newH = Math.max(40, r.origH + dy);
        if (handle.includes('top')) {
          newH = Math.max(40, r.origH - dy);
          newY = r.origY + r.origH - newH;
        }

        updateRoom(room.id, {
          x: snapValue(newX),
          y: snapValue(newY),
          width: snapValue(newW),
          height: snapValue(newH),
        });
      };

      const handleMouseUp = () => {
        resizeRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [room.id, room.x, room.y, room.width, room.height, scale, updateRoom, snapValue, pushHistory]
  );

  // Resize handles positions
  const handles = [
    { id: 'top-left', style: { top: -3, left: -3, cursor: 'nwse-resize' } },
    { id: 'top-right', style: { top: -3, right: -3, cursor: 'nesw-resize' } },
    { id: 'bottom-left', style: { bottom: -3, left: -3, cursor: 'nesw-resize' } },
    { id: 'bottom-right', style: { bottom: -3, right: -3, cursor: 'nwse-resize' } },
    { id: 'top', style: { top: -3, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' } },
    { id: 'bottom', style: { bottom: -3, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' } },
    { id: 'left', style: { top: '50%', left: -3, transform: 'translateY(-50%)', cursor: 'ew-resize' } },
    { id: 'right', style: { top: '50%', right: -3, transform: 'translateY(-50%)', cursor: 'ew-resize' } },
  ];

  const isOverThreshold = occupancyPct >= room.alertThreshold;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onMouseDown={handleMouseDown}
      className="room-block-component"
      style={{
        position: 'absolute',
        left: room.x,
        top: room.y,
        width: room.width,
        height: room.height,
        borderRadius: 4,
        border: `1.5px solid ${room.color}`,
        background: heatmapBg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: activeTool === 'select' ? 'pointer' : 'crosshair',
        zIndex: isSelected ? 20 : 1,
        boxShadow: isSelected ? `0 0 15px ${room.color}55` : 'none',
        fontSize: 10,
        fontWeight: 500,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Pulse ring when over threshold */}
      {isOverThreshold && (
        <div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: 6,
            border: '2px solid #E24B4A',
            animation: 'pulse-anim 1.5s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Room type icon */}
      <div style={{ fontSize: 8, marginBottom: 2 }}>{config.icon}</div>

      {/* Room name */}
      <div
        style={{
          fontSize: 9,
          fontWeight: 500,
          lineHeight: 1.2,
          textAlign: 'center',
          padding: '0 4px',
          color: 'var(--foreground, #fff)',
          opacity: 0.8,
        }}
      >
        {room.name}
      </div>

      {/* Occupancy */}
      {maxCapacity > 0 && (
        <div style={{ fontSize: 8, color: isOverThreshold ? '#E24B4A' : 'rgba(255,255,255,0.5)' }}>
          {room.currentOccupancy} / {maxCapacity}
        </div>
      )}

      {/* Notes sticky icon */}
      {room.notes && (
        <div
          style={{ position: 'absolute', top: 3, right: 4, fontSize: 8 }}
          title={room.notes}
        >
          📎
        </div>
      )}

      {/* Avatar chips */}
      {assignedUsers.length > 0 && (
        <div style={{ position: 'absolute', top: 2, left: 2, display: 'flex' }}>
          {displayUsers.map((u, i) => (
            <div
              key={u.id}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 6,
                fontWeight: 500,
                marginLeft: i > 0 ? -4 : 0,
                border: '1.5px solid rgba(255,255,255,0.8)',
                background: '#EEEDFE',
                color: '#3C3489',
                zIndex: 10 - i,
              }}
            >
              {u.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
          ))}
          {extraCount > 0 && (
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 6,
                fontWeight: 500,
                marginLeft: -4,
                border: '1.5px solid rgba(255,255,255,0.8)',
                background: '#FAECE7',
                color: '#712B13',
              }}
            >
              +{extraCount}
            </div>
          )}
        </div>
      )}

      {/* Occupancy bar at bottom */}
      {maxCapacity > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 3,
            width: `${Math.min(100, occupancyPct)}%`,
            background: occColor,
            borderRadius: '0 0 2px 2px',
          }}
        />
      )}

      {/* Resize handles (only when selected) */}
      {isSelected &&
        activeTool === 'select' &&
        handles.map((h) => (
          <div
            key={h.id}
            onMouseDown={(e) => handleResizeStart(e, h.id)}
            style={{
              position: 'absolute',
              width: 6,
              height: 6,
              background: 'white',
              border: '1.5px solid #378ADD',
              borderRadius: 1,
              zIndex: 30,
              ...h.style,
            }}
          />
        ))}
    </motion.div>
  );
}
