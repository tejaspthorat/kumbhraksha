'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  useFloorPlanStore,
  useActiveFloor,
  useActiveRooms,
  useActiveEntryPoints,
  useActiveCorridors,
  useActiveEvacuationRoutes,
  useFloorAssets,
  ROOM_TYPE_CONFIG,
  type FloorRoom,
  type FloorEntryPoint,
} from '@/lib/floorPlanStore';
import RoomBlock from './RoomBlock';
import EntryMarker from './EntryMarker';
import CorridorLine from './CorridorLine';
import EvacuationRouteComponent from './EvacuationRoute';
import RoomModal from './RoomModal';
import AssetModal from './AssetModal';
import AssetMarker from './AssetMarker';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export default function FloorPlanCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    viewport,
    setViewport,
    activeTool,
    showGrid,
    showEvacuationView,
    selectedElementId,
    selectElement,
    clearSelection,
    addRoom,
    addEntryPoint,
    activeFloorId,
    users,
    snapToGrid,
    gridSize,
    isDrawing,
    setDrawing,
    drawStart,
    setDrawStart,
    drawCurrent,
    setDrawCurrent,
    pushHistory,
    corridorFromRoomId,
    corridorFromPoint,
    addAsset,
    addEvacuationRoute,
    fitToScreen,
    setActiveTool,
  } = useFloorPlanStore();

  const activeFloor = useActiveFloor();
  const rooms = useActiveRooms();
  const entryPoints = useActiveEntryPoints();
  const corridors = useActiveCorridors();
  const evacuationRoutes = useActiveEvacuationRoutes();
  const assets = useFloorAssets(activeFloorId);

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [pendingRoom, setPendingRoom] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [pendingAssetPos, setPendingAssetPos] = useState<{ x: number; y: number } | null>(null);
  const [evacPoints, setEvacPoints] = useState<{ x: number; y: number }[]>([]);

  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef<{ startX: number; startY: number; vpX: number; vpY: number } | null>(null);
  const spaceRef = useRef(false);

  const snapValue = useCallback(
    (val: number) => {
      if (!snapToGrid) return val;
      return Math.round(val / gridSize) * gridSize;
    },
    [snapToGrid, gridSize]
  );

  // Convert screen coords to canvas coords
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - viewport.x) / viewport.scale,
        y: (clientY - rect.top - viewport.y) / viewport.scale,
      };
    },
    [viewport]
  );

  // ─── Zoom with mouse wheel ─────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.3, Math.min(3, viewport.scale * delta));

      setViewport({
        scale: newScale,
        x: mouseX - (mouseX - viewport.x) * (newScale / viewport.scale),
        y: mouseY - (mouseY - viewport.y) * (newScale / viewport.scale),
      });
    },
    [viewport, setViewport]
  );

  // ─── Space key for panning ─────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        spaceRef.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceRef.current = false;
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ─── Canvas mouse handlers ─────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle mouse button, Space, Pan tool active, OR Left-click on background in select mode → pan
      if (e.button === 1 || spaceRef.current || activeTool === 'pan' || (e.button === 0 && activeTool === 'select')) {
        setIsPanning(true);
        panRef.current = { startX: e.clientX, startY: e.clientY, vpX: viewport.x, vpY: viewport.y };
        
        // If it's a select tool background click, we still might want to clear selection, 
        // but the pan logic should dominate the movement.
        if (e.button === 0 && activeTool === 'select') {
           clearSelection();
        }
        return;
      }

      if (e.button !== 0) return;

      const pos = screenToCanvas(e.clientX, e.clientY);

      if (activeTool === 'draw-room') {
        setDrawing(true);
        setDrawStart(pos);
        setDrawCurrent(pos);
      } else if (activeTool === 'draw-evacuation') {
        setEvacPoints((prev) => [...prev, { x: snapValue(pos.x), y: snapValue(pos.y) }]);
        setDrawing(true);
        setDrawCurrent({ x: snapValue(pos.x), y: snapValue(pos.y) });
      } else if (activeTool === 'add-asset') {
        setPendingAssetPos({ x: snapValue(pos.x), y: snapValue(pos.y) });
        setShowAssetModal(true);
      } else if (activeTool === 'add-entry') {
        pushHistory();
        const point: FloorEntryPoint = {
          id: uid(),
          x: snapValue(pos.x),
          y: snapValue(pos.y),
        };
        addEntryPoint(activeFloorId, point);
      } else if (activeTool === 'select') {
        // Click on empty canvas → deselect
        clearSelection();
      }
    },
    [activeTool, viewport, screenToCanvas, snapValue, activeFloorId, addEntryPoint, clearSelection, pushHistory, setDrawing, setDrawStart, setDrawCurrent]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Pan
      if (isPanning && panRef.current) {
        const dx = e.clientX - panRef.current.startX;
        const dy = e.clientY - panRef.current.startY;
        setViewport({ x: panRef.current.vpX + dx, y: panRef.current.vpY + dy });
        return;
      }

      if (activeTool === 'draw-room' && isDrawing) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        setDrawCurrent(pos);
      } else if (activeTool === 'draw-evacuation' && isDrawing) {
        setDrawCurrent(screenToCanvas(e.clientX, e.clientY));
      } else if (activeTool === 'draw-corridor' && corridorFromRoomId) {
        setDrawCurrent(screenToCanvas(e.clientX, e.clientY));
      }
    },
    [isPanning, isDrawing, activeTool, screenToCanvas, setViewport, setDrawCurrent, corridorFromRoomId]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setIsPanning(false);
        panRef.current = null;
        return;
      }

      if (isDrawing && activeTool === 'draw-room' && drawStart && drawCurrent) {
        let x = Math.min(drawStart.x, drawCurrent.x);
        let y = Math.min(drawStart.y, drawCurrent.y);
        let w = Math.abs(drawCurrent.x - drawStart.x);
        let h = Math.abs(drawCurrent.y - drawStart.y);

        setDrawing(false);
        setDrawStart(null);
        setDrawCurrent(null);

        // Click-to-place default size room if drag is too small
        if (w < 40 || h < 40) {
          w = 100;
          h = 100;
          x = drawStart.x - 50;
          y = drawStart.y - 50;
        }

        setPendingRoom({ x: snapValue(x), y: snapValue(y), w: snapValue(w), h: snapValue(h) });
        setShowRoomModal(true);
      }
    },
    [isDrawing, activeTool, drawStart, drawCurrent, snapValue, setDrawing, setDrawStart, setDrawCurrent]
  );

  // ─── Room creation from modal ──────────────────────────────────
  const handleRoomConfirm = (name: string, type: string, color: string, capacity: number) => {
    if (!pendingRoom) return;
    const newRoom: FloorRoom = {
      id: uid(),
      name,
      type: type as FloorRoom['type'],
      x: pendingRoom.x,
      y: pendingRoom.y,
      width: pendingRoom.w,
      height: pendingRoom.h,
      color,
      capacity,
      alertThreshold: 85,
      currentOccupancy: 0,
      assignedUserIds: [],
      assetIds: [],
      floorId: activeFloorId,
    };
    addRoom(activeFloorId, newRoom);
    setShowRoomModal(false);
    setPendingRoom(null);
  };

  // ─── Asset creation from modal ──────────────────────────────────
  const handleAssetConfirm = (type: string, rotation: number, options: { label?: string; reducesArea?: boolean; areaReduction?: number }) => {
    if (!pendingAssetPos || !activeFloorId) return;
    
    // Fallback room deduction logic - ideally assets belong to the room they fall inside.
    const insideRoom = rooms.find(r => 
      pendingAssetPos.x >= r.x && pendingAssetPos.x <= r.x + r.width &&
      pendingAssetPos.y >= r.y && pendingAssetPos.y <= r.y + r.height
    );

    const assetRoomId = insideRoom ? insideRoom.id : activeFloorId;

    pushHistory();
    addAsset({
      id: uid(),
      type,
      x: pendingAssetPos.x,
      y: pendingAssetPos.y,
      rotation,
      roomId: assetRoomId,
      floorId: activeFloorId,
      reducesArea: options.reducesArea || false,
      areaReduction: options.areaReduction || 0,
    });
    setShowAssetModal(false);
    setPendingAssetPos(null);
  };

  // Draw ghost dimensions
  const ghostRect =
    isDrawing && drawStart && drawCurrent
      ? {
          x: Math.min(drawStart.x, drawCurrent.x),
          y: Math.min(drawStart.y, drawCurrent.y),
          w: Math.abs(drawCurrent.x - drawStart.x),
          h: Math.abs(drawCurrent.y - drawStart.y),
        }
      : null;

  // Minimap calculations
  const MINIMAP_W = 80;
  const MINIMAP_H = 50;
  let minimapScale = 1;
  let minimapRooms: { x: number; y: number; w: number; h: number; color: string }[] = [];
  let minimapAssets: { x: number; y: number }[] = [];
  let minimapEntries: { x: number; y: number }[] = [];
  
  const hasContent = rooms.length > 0 || corridors.length > 0 || evacuationRoutes.length > 0 || entryPoints.length > 0 || assets.length > 0;
  
  if (hasContent) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // Expand bounds by rooms
    rooms.forEach((r) => {
      minX = Math.min(minX, r.x);
      minY = Math.min(minY, r.y);
      maxX = Math.max(maxX, r.x + r.width);
      maxY = Math.max(maxY, r.y + r.height);
    });
    // Expand bounds by corridors
    corridors.forEach((c) => {
      if (c.fromX) minX = Math.min(minX, c.fromX);
      if (c.toX) maxX = Math.max(maxX, c.toX);
      if (c.fromY) minY = Math.min(minY, c.fromY);
      if (c.toY) maxY = Math.max(maxY, c.toY);
    });
    // Expand bounds by entry points
    entryPoints.forEach((e) => {
      minX = Math.min(minX, e.x);
      minY = Math.min(minY, e.y);
      maxX = Math.max(maxX, e.x);
      maxY = Math.max(maxY, e.y);
    });
    // Expand bounds by evacuation routes
    evacuationRoutes.forEach((route) => {
      route.points.forEach((p) => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
    });
    // Expand bounds by assets
    assets.forEach((a) => {
      minX = Math.min(minX, a.x);
      minY = Math.min(minY, a.y);
      maxX = Math.max(maxX, a.x);
      maxY = Math.max(maxY, a.y);
    });

    const contentW = Math.max(maxX - minX, 100);
    const contentH = Math.max(maxY - minY, 100);
    minimapScale = Math.min(MINIMAP_W / contentW, MINIMAP_H / contentH) * 0.8;
    
    minimapRooms = rooms.map((r) => ({
      x: (r.x - minX) * minimapScale + 4,
      y: (r.y - minY) * minimapScale + 4,
      w: r.width * minimapScale,
      h: r.height * minimapScale,
      color: r.color,
    }));
    
    minimapAssets = assets.map((a) => ({
      x: (a.x - minX) * minimapScale + 4,
      y: (a.y - minY) * minimapScale + 4,
    }));
    
    minimapEntries = entryPoints.map((e) => ({
      x: (e.x - minX) * minimapScale + 4,
      y: (e.y - minY) * minimapScale + 4,
    }));
  }

  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#0a1520',
        minHeight: 400,
        cursor:
          isPanning || spaceRef.current
            ? 'grabbing'
            : activeTool === 'pan'
            ? 'grab'
            : activeTool === 'draw-room'
            ? 'crosshair'
            : activeTool === 'add-entry'
            ? 'cell'
            : 'default',
      }}
    >
      <div
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          position: 'absolute',
          inset: 0,
        }}
      >
        {/* Transform container */}
        <div
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            transformOrigin: '0 0',
            position: 'absolute',
            width: 3000,
            height: 3000,
          }}
        >
          {/* Grid lines */}
          {showGrid && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `
                  linear-gradient(rgba(122,178,178,0.1) 0.5px, transparent 0.5px),
                  linear-gradient(90deg, rgba(122,178,178,0.1) 0.5px, transparent 0.5px)
                `,
                backgroundSize: `${gridSize}px ${gridSize}px`,
                opacity: 0.5,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Corridors */}
          {corridors.map((c) => (
            <CorridorLine key={c.id} corridor={c} rooms={rooms} />
          ))}

          {/* Evacuation routes */}
          {(showEvacuationView ? evacuationRoutes : []).map((route) => (
            <EvacuationRouteComponent key={route.id} route={route} />
          ))}

          {/* Rooms */}
          {rooms.map((room) => (
            <RoomBlock
              key={room.id}
              room={room}
              isSelected={selectedElementId === room.id}
              scale={viewport.scale}
              users={users}
            />
          ))}

          {/* Entry points */}
          {entryPoints.map((point) => (
            <EntryMarker key={point.id} point={point} />
          ))}

          {/* Assets */}
          {assets.map((asset) => (
            <AssetMarker key={asset.id} asset={asset} scale={viewport.scale} />
          ))}

          {/* Draw ghost */}
          {ghostRect && (
            <div
              style={{
                position: 'absolute',
                left: ghostRect.x,
                top: ghostRect.y,
                width: ghostRect.w,
                height: ghostRect.h,
                border: '1.5px dashed #378ADD',
                borderRadius: 3,
                background: 'rgba(55,138,221,0.06)',
                pointerEvents: 'none',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: -16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 8,
                  color: '#378ADD',
                  whiteSpace: 'nowrap',
                }}
              >
                {Math.round(ghostRect.w)} × {Math.round(ghostRect.h)} px
              </div>
            </div>
          )}

          {/* Corridor Preview line during draw */}
          {activeTool === 'draw-corridor' && corridorFromPoint && drawCurrent && (
            <svg style={{ position: 'absolute', inset: 0, width: 3000, height: 3000, pointerEvents: 'none', zIndex: 10 }}>
               <line x1={corridorFromPoint.x} y1={corridorFromPoint.y} x2={drawCurrent.x} y2={drawCurrent.y} stroke="rgba(55,138,221,0.5)" strokeWidth="15" strokeDasharray="5,5" />
            </svg>
          )}

          {/* Evacuation Route Preview during draw */}
          {activeTool === 'draw-evacuation' && evacPoints.length > 0 && drawCurrent && (
             <svg style={{ position: 'absolute', inset: 0, width: 3000, height: 3000, pointerEvents: 'none', zIndex: 10 }}>
               <polyline 
                  points={evacPoints.map(p => `${p.x},${p.y}`).join(' ') + ` ${drawCurrent.x},${drawCurrent.y}`} 
                  fill="none" 
                  stroke="rgba(226,75,74,0.5)" 
                  strokeWidth="2" 
                  strokeDasharray="6 4" 
                />
             </svg>
          )}

        </div>
      </div>

      {/* Controls: Reset & Pan */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          display: 'flex',
          gap: 6,
          zIndex: 40,
        }}
      >
        <button
          onClick={() => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) fitToScreen(rect.width, rect.height);
          }}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            fontSize: 10,
            color: 'white',
            padding: '2px 8px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.15s ease'
          }}
          className="hover:bg-white/10"
        >
          RESET
        </button>
        
        <button
          onClick={() => setActiveTool(activeTool === 'pan' ? 'select' : 'pan')}
          style={{
            background: (activeTool === 'pan' || isPanning) ? 'rgba(55,138,221,0.2)' : 'rgba(255,255,255,0.05)',
            border: `0.5px solid ${(activeTool === 'pan' || isPanning) ? '#378ADD' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 4,
            fontSize: 10,
            color: (activeTool === 'pan' || isPanning) ? '#378ADD' : 'rgba(255,255,255,0.5)',
            padding: '2px 8px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.15s ease'
          }}
          className="hover:bg-white/10"
        >
          PAN
        </button>

        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            fontSize: 10,
            color: 'rgba(255,255,255,0.5)',
            padding: '2px 8px',
            display: 'flex',
            alignItems: 'center',
            fontWeight: 500
          }}
        >
          {Math.round(viewport.scale * 100)}%
        </div>
      </div>

      {/* Minimap */}
      {hasContent && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 180,
            width: MINIMAP_W,
            height: MINIMAP_H,
            background: 'rgba(255,255,255,0.05)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            overflow: 'hidden',
            zIndex: 40,
          }}
        >
          {minimapRooms.map((mr, i) => (
            <div
              key={`mr-${i}`}
              style={{
                position: 'absolute', left: mr.x, top: mr.y, width: mr.w, height: mr.h, background: mr.color, borderRadius: 1, opacity: 0.5,
              }}
            />
          ))}
          {minimapAssets.map((ma, i) => (
             <div key={`ma-${i}`} style={{ position: 'absolute', left: ma.x, top: ma.y, width: 2, height: 2, background: 'orange', borderRadius: '50%' }} />
          ))}
          {minimapEntries.map((me, i) => (
             <div key={`me-${i}`} style={{ position: 'absolute', left: me.x, top: me.y, width: 2, height: 2, background: 'green', borderRadius: '50%' }} />
          ))}
        </div>
      )}

      {/* Evacuation view dimming */}
      {showEvacuationView && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      {/* Evacuation Route Controls Overlay */}
      {activeTool === 'draw-evacuation' && evacPoints.length > 0 && (
        <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', gap: 10 }}>
          <button
             onClick={() => {
               if (evacPoints.length >= 2) {
                 pushHistory();
                 addEvacuationRoute(activeFloorId, {
                   id: uid(),
                   points: evacPoints,
                   floorId: activeFloorId
                 });
               }
               setEvacPoints([]);
               setDrawing(false);
               useFloorPlanStore.setState({ activeTool: 'select' });
             }}
             style={{ padding: '8px 16px', background: '#378ADD', color: 'white', borderRadius: 4, cursor: 'pointer', border: 'none', fontSize: 13, fontWeight: 500 }}
          >
             Finish Route ({evacPoints.length} points)
          </button>
          <button
             onClick={() => { setEvacPoints([]); setDrawing(false); }}
             style={{ padding: '8px 16px', background: '#111', color: 'white', borderRadius: 4, cursor: 'pointer', border: '1px solid #444', fontSize: 13 }}
          >
             Cancel
          </button>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && pendingRoom && (
        <RoomModal
          x={pendingRoom.x}
          y={pendingRoom.y}
          width={pendingRoom.w}
          height={pendingRoom.h}
          onConfirmAction={handleRoomConfirm}
          onCancelAction={() => {
            setShowRoomModal(false);
            setPendingRoom(null);
          }}
        />
      )}

      {/* Asset Modal */}
      {showAssetModal && pendingAssetPos && (
        <AssetModal
          x={pendingAssetPos.x}
          y={pendingAssetPos.y}
          onConfirmAction={handleAssetConfirm}
          onCancelAction={() => {
            setShowAssetModal(false);
            setPendingAssetPos(null);
          }}
        />
      )}
    </div>
  );
}
