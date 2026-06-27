'use client';

import { useState } from 'react';
import { useFloorPlanStore } from '@/lib/floorPlanStore';

export default function FloorTabs() {
  const {
    floors,
    activeFloorId,
    setActiveFloor,
    addFloor,
    deleteFloor,
    copyFloorLayout,
  } = useFloorPlanStore();

  const [showAddInput, setShowAddInput] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');

  const handleAddFloor = () => {
    if (newFloorName.trim()) {
      addFloor(newFloorName.trim());
      setNewFloorName('');
      setShowAddInput(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        alignItems: 'stretch',
      }}
    >
      {floors
        .sort((a, b) => a.order - b.order)
        .map((floor) => {
          const isActive = floor.id === activeFloorId;
          return (
            <div
              key={floor.id}
              onClick={() => setActiveFloor(floor.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                // Context menu duplication
                const newId = addFloor(`${floor.name} (Copy)`);
                if (newId) copyFloorLayout(floor.id, newId);
              }}
              style={{
                padding: '5px 12px',
                fontSize: 11,
                cursor: 'pointer',
                borderRight: '0.5px solid rgba(255,255,255,0.08)',
                color: isActive ? 'var(--foreground)' : 'rgba(255,255,255,0.4)',
                fontWeight: isActive ? 500 : 400,
                borderBottom: isActive ? '2px solid #378ADD' : '2px solid transparent',
                background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
                marginBottom: '-0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s',
              }}
            >
              {floor.name}
              <span
                style={{
                  fontSize: 9,
                  background: isActive ? '#0C447C' : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#B5D4F4' : 'rgba(255,255,255,0.4)',
                  borderRadius: 8,
                  padding: '0 5px',
                }}
              >
                {floor.rooms.length}
              </span>
              
              {isActive && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newId = addFloor(`${floor.name} (Copy)`);
                      if (newId) copyFloorLayout(floor.id, newId);
                    }}
                    title="Duplicate Floor"
                    style={{
                      background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '0 2px', fontSize: 10
                    }}
                  >
                    ⎘
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (floors.length > 1 && confirm(`Delete floor "${floor.name}"?`)) {
                        deleteFloor(floor.id);
                      }
                    }}
                    title="Delete Floor"
                    style={{
                      background: 'transparent', border: 'none', color: '#E24B4A', cursor: 'pointer', padding: '0 2px', fontSize: 10
                    }}
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          );
        })}

      {showAddInput ? (
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', gap: 4 }}>
          <input
            autoFocus
            value={newFloorName}
            onChange={(e) => setNewFloorName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddFloor();
              if (e.key === 'Escape') setShowAddInput(false);
            }}
            placeholder="Floor name..."
            style={{
              width: 100,
              fontSize: 11,
              padding: '2px 6px',
              background: 'rgba(255,255,255,0.05)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              borderRadius: 4,
              color: 'var(--foreground)',
              outline: 'none',
            }}
          />
          <button
            onClick={handleAddFloor}
            style={{
              fontSize: 10,
              padding: '2px 6px',
              background: '#0C447C',
              border: 'none',
              borderRadius: 4,
              color: '#B5D4F4',
              cursor: 'pointer',
            }}
          >
            Add
          </button>
        </div>
      ) : (
        <div
          onClick={() => setShowAddInput(true)}
          style={{
            padding: '5px 10px',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          +
        </div>
      )}
    </div>
  );
}
