'use client';

import { useState, useEffect, useRef } from 'react';
import { useFloorPlanStore } from '@/lib/floorPlanStore';

interface UserSearchOverlayProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

export default function UserSearchOverlay({ isOpen, onCloseAction }: UserSearchOverlayProps) {
  const { users, floors, setActiveFloor, selectElement } = useFloorPlanStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const results = query.trim()
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.role.toLowerCase().includes(query.toLowerCase())
      )
    : users.slice(0, 10);

  const handleSelect = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    if (user.assignedFloorId) {
      setActiveFloor(user.assignedFloorId);
    }
    if (user.assignedRoomId) {
      selectElement(user.assignedRoomId, 'room');
    }
    onCloseAction();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        zIndex: 1000,
      }}
      onClick={onCloseAction}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 400,
          background: '#0d1b26',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name or role..."
            onKeyDown={(e) => {
              if (e.key === 'Escape') onCloseAction();
            }}
            style={{
              width: '100%',
              fontSize: 13,
              padding: '4px 0',
              background: 'transparent',
              border: 'none',
              color: 'var(--foreground)',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto', padding: '4px 0' }}>
          {results.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              No users found
            </div>
          )}
          {results.map((u) => {
            const floor = floors.find((f) => f.id === u.assignedFloorId);
            const room = floor?.rooms.find((r) => r.id === u.assignedRoomId);
            return (
              <div
                key={u.id}
                onClick={() => handleSelect(u.id)}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)' }}>{u.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{u.role}</div>
                </div>
                {room && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>
                    <div>{floor?.name}</div>
                    <div>{room.name}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
