'use client';

import { useState } from 'react';
import {
  useFloorPlanStore,
  ASSET_CATEGORIES,
  ASSET_ICONS,
  type FloorAsset,
} from '@/lib/floorPlanStore';

interface AssetDrawerProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export default function AssetDrawer({ isOpen, onCloseAction }: AssetDrawerProps) {
  const { addAsset, activeFloorId, floors, assets } = useFloorPlanStore();
  const [draggedAsset, setDraggedAsset] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeFloor = floors.find((f) => f.id === activeFloorId);

  const handleAssetClick = (assetType: string) => {
    // Place in center of first room or at 100,100
    const targetRoom = activeFloor?.rooms[0];
    const asset: FloorAsset = {
      id: uid(),
      type: assetType,
      x: targetRoom ? targetRoom.x + targetRoom.width / 2 - 10 : 100,
      y: targetRoom ? targetRoom.y + targetRoom.height / 2 - 10 : 100,
      rotation: 0,
      roomId: targetRoom?.id ?? '',
      floorId: activeFloorId,
      reducesArea: false,
      areaReduction: 0,
    };
    addAsset(asset);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 44,
        bottom: 0,
        width: 220,
        background: '#0a1520',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        zIndex: 400,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '10px 0 30px rgba(0,0,0,0.3)',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '0.5px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>Assets</span>
        <button
          onClick={onCloseAction}
          style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {Object.entries(ASSET_CATEGORIES).map(([category, items]) => (
          <div key={category} style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
              }}
            >
              {category}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {(items as readonly string[]).map((assetName) => (
                <div
                  key={assetName}
                  onClick={() => handleAssetClick(assetName)}
                  draggable
                  onDragStart={() => setDraggedAsset(assetName)}
                  onDragEnd={() => setDraggedAsset(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 6px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: '0.5px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)')}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      background: 'rgba(255,255,255,0.05)',
                    }}
                  >
                    {ASSET_ICONS[assetName] ?? '📦'}
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{assetName}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Asset count */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '0.5px solid rgba(255,255,255,0.08)',
          fontSize: 10,
          color: 'rgba(255,255,255,0.3)',
        }}
      >
        {assets.filter((a) => a.floorId === activeFloorId).length} assets on this floor
      </div>
    </div>
  );
}
