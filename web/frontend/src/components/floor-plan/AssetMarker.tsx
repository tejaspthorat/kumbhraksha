'use client';

import { useRef, useCallback } from 'react';
import { ASSET_ICONS, type FloorAsset, useFloorPlanStore } from '@/lib/floorPlanStore';

interface AssetMarkerProps {
  asset: FloorAsset;
  scale: number;
}

export default function AssetMarker({ asset, scale }: AssetMarkerProps) {
  const { activeTool, selectElement, updateAsset, pushHistory, snapToGrid, gridSize } = useFloorPlanStore();
  const dragRef = useRef<{ startX: number; startY: number; assetX: number; assetY: number } | null>(null);

  const snapValue = useCallback((val: number) => {
    if (!snapToGrid) return val;
    return Math.round(val / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    selectElement(asset.id, 'asset');
    pushHistory();

    const startX = e.clientX / scale;
    const startY = e.clientY / scale;
    dragRef.current = { startX, startY, assetX: asset.x, assetY: asset.y };

    const handleMouseMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = me.clientX / scale - dragRef.current.startX;
      const dy = me.clientY / scale - dragRef.current.startY;
      
      updateAsset(asset.id, {
        x: snapValue(dragRef.current.assetX + dx),
        y: snapValue(dragRef.current.assetY + dy),
      });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [activeTool, asset.id, asset.x, asset.y, scale, selectElement, updateAsset, snapValue, pushHistory]);

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: asset.x,
        top: asset.y,
        transform: `translate(-50%, -50%) rotate(${asset.rotation}deg)`,
        fontSize: 20,
        pointerEvents: activeTool === 'select' ? 'auto' : 'none',
        zIndex: 15, // Above standard blocks, below selected ones
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textShadow: '0 2px 5px rgba(0,0,0,0.5)',
        cursor: activeTool === 'select' ? 'grab' : 'default',
      }}
      title={asset.type}
    >
      {ASSET_ICONS[asset.type] || '📦'}
    </div>
  );
}
