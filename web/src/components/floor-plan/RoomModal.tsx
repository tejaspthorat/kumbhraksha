'use client';

import { useState } from 'react';
import {
  ROOM_TYPES,
  ROOM_TYPE_CONFIG,
  type RoomType,
} from '@/lib/floorPlanStore';

interface RoomModalProps {
  x: number;
  y: number;
  width: number;
  height: number;
  onConfirmAction: (name: string, type: RoomType, color: string, capacity: number) => void;
  onCancelAction: () => void;
}

export default function RoomModal({ x, y, width, height, onConfirmAction, onCancelAction }: RoomModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<RoomType>('General Area');
  const [color, setColor] = useState(ROOM_TYPE_CONFIG['General Area'].defaultColor);
  
  // Calculate default capacity based on area: areaM2 * multiplier * 100
  const areaM2 = (width * height) / 10000;
  const areaMultiplier = ROOM_TYPE_CONFIG[type].capacityMultiplier;
  const initialCapacity = Math.floor(areaM2 * areaMultiplier * 100);
  const [capacity, setCapacity] = useState<number>(initialCapacity);

  const handleTypeChange = (newType: RoomType) => {
    setType(newType);
    setColor(ROOM_TYPE_CONFIG[newType].defaultColor);
    // Recalculate capacity when type changes if user hasn't touched it? 
    // For now, let's just update it to the new suggested default.
    const newMultiplier = ROOM_TYPE_CONFIG[newType].capacityMultiplier;
    setCapacity(Math.floor(areaM2 * newMultiplier * 100));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || `Room ${Date.now().toString(36).slice(-4)}`;
    onConfirmAction(finalName, type, color, capacity);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancelAction}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          background: '#0d1b26',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 20,
          width: 320,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}>
          New Room
        </h3>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
          {Math.round(width)} × {Math.round(height)} px — {((width * height) / 10000 * 100).toFixed(0)} m²
        </p>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
            Room Name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Main Hall"
            style={{
              width: '100%',
              fontSize: 12,
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.05)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              color: 'var(--foreground)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
            Room Type
          </label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as RoomType)}
            style={{
              width: '100%',
              fontSize: 12,
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.05)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              color: 'var(--foreground)',
              outline: 'none',
            }}
          >
            {ROOM_TYPES.map((t) => (
              <option key={t} value={t}>
                {ROOM_TYPE_CONFIG[t].icon} {t}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
            Capacity (suggested based on area)
          </label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              fontSize: 12,
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.05)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              color: 'var(--foreground)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
            Color
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: 30, height: 24, border: 'none', cursor: 'pointer', borderRadius: 4 }}
            />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{color}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancelAction}
            style={{
              fontSize: 11,
              padding: '5px 12px',
              background: 'transparent',
              border: '0.5px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              fontSize: 11,
              padding: '5px 16px',
              background: '#0C447C',
              border: '0.5px solid #378ADD',
              borderRadius: 6,
              color: '#B5D4F4',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Create Room
          </button>
        </div>
      </form>
    </div>
  );
}
