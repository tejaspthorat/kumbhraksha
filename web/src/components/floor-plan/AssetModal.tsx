'use client';

import { useState } from 'react';
import { ASSET_CATEGORIES, ASSET_ICONS } from '@/lib/floorPlanStore';

interface AssetModalProps {
  x: number;
  y: number;
  onConfirmAction: (type: string, rotation: number, options: { label?: string; reducesArea?: boolean; areaReduction?: number }) => void;
  onCancelAction: () => void;
}

export default function AssetModal({ x, y, onConfirmAction, onCancelAction }: AssetModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof ASSET_CATEGORIES>('Safety');
  const [selectedType, setSelectedType] = useState<string>(ASSET_CATEGORIES['Safety'][0]);
  const [rotation, setRotation] = useState(0);
  const [label, setLabel] = useState('');

  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancelAction}
    >
      <div
        style={{
          background: '#1a2234',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: 20,
          borderRadius: 8,
          width: 320,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 15px 0', color: 'white', fontSize: 16 }}>Place Asset</h3>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, color: '#aaa', fontSize: 12 }}>Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              const cat = e.target.value as keyof typeof ASSET_CATEGORIES;
              setSelectedCategory(cat);
              setSelectedType(ASSET_CATEGORIES[cat][0]);
            }}
            style={{ width: '100%', padding: '8px', background: '#0a1520', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 4 }}
          >
            {Object.keys(ASSET_CATEGORIES).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, color: '#aaa', fontSize: 12 }}>Asset Type</label>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {ASSET_CATEGORIES[selectedCategory].map(type => (
              <div
                key={type}
                onClick={() => setSelectedType(type)}
                style={{
                  padding: '6px 12px',
                  background: selectedType === type ? '#378ADD' : '#0a1520',
                  border: `1px solid ${selectedType === type ? '#378ADD' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: 4,
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{ASSET_ICONS[type] ?? '🏷️'}</span>
                <span>{type}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, color: '#aaa', fontSize: 12 }}>Rotation ({rotation}°)</label>
          <input
            type="range"
            min="0"
            max="359"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 5, color: '#aaa', fontSize: 12 }}>Optional Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Exit A Fire Ext."
            style={{ width: '100%', padding: '8px', background: '#0a1520', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 4 }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onCancelAction}
            style={{ padding: '8px 16px', background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirmAction(selectedType, rotation, { label })}
            style={{ padding: '8px 16px', background: '#378ADD', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Place Asset
          </button>
        </div>
      </div>
    </div>
  );
}
