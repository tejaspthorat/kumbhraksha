'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFloorPlanStore } from '@/lib/floorPlanStore';
import Toolbar from '@/components/floor-plan/Toolbar';
import FloorTabs from '@/components/floor-plan/FloorTabs';
import FloorPlanCanvas from '@/components/floor-plan/FloorPlanCanvas';
import RightPanel from '@/components/floor-plan/RightPanel';
import AlertLog from '@/components/floor-plan/AlertLog';
import UserPanel from '@/components/floor-plan/UserPanel';
import UserSearchOverlay from '@/components/floor-plan/UserSearchOverlay';
import AssetDrawer from '@/components/floor-plan/AssetDrawer';
import SavePlanModal from '@/components/floor-plan/SavePlanModal';

export default function RoomDesignerPage() {
  const {
    loadFromStorage,
    setActiveTool,
    toggleGrid,
    toggleHeatmap,
    undo,
    redo,
    saveSnapshot,
    deleteRoom,
    deleteEntryPoint,
    clearSelection,
    activeTool,
    selectedElementId,
    selectedElementType,
    activeFloorId,
    getExportData,
    importData,
    isSaving,
    saveToDatabase,
    loadFromDatabase,
  } = useFloorPlanStore();

  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showAssetDrawer, setShowAssetDrawer] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // ─── Keyboard Shortcuts ──────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is on input/textarea/select
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          break;
        case 'r':
          setActiveTool('draw-room');
          break;
        case 'c':
          if (!e.ctrlKey && !e.metaKey) setActiveTool('draw-corridor');
          break;
        case 'e':
          setActiveTool('add-entry');
          break;
        case 'g':
          toggleGrid();
          break;
        case 'h':
          toggleHeatmap();
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const name = prompt('Snapshot name:');
            if (name) saveSnapshot(name);
          }
          break;
        case 'k':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowUserSearch(true);
          }
          break;
        case 'delete':
        case 'backspace':
          if (selectedElementId && selectedElementType === 'room') {
            deleteRoom(selectedElementId);
          } else if (selectedElementId && selectedElementType === 'entry') {
            deleteEntryPoint(activeFloorId, selectedElementId);
          }
          break;
        case 'escape':
          clearSelection();
          setActiveTool('select');
          setShowUserSearch(false);
          setShowAssetDrawer(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setActiveTool, toggleGrid, toggleHeatmap, undo, redo,
    saveSnapshot, deleteRoom, deleteEntryPoint, clearSelection,
    selectedElementId, selectedElementType, activeFloorId,
  ]);

  // Watch for asset tool to open drawer
  useEffect(() => {
    if (activeTool === 'add-asset') {
      setShowAssetDrawer(true);
      setActiveTool('select');
    }
  }, [activeTool, setActiveTool]);

  // ─── Export Handlers ───────────────────────────────────────────
  const handleExportJSON = useCallback(() => {
    const data = getExportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `floor-plan-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getExportData]);

  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        importData(data);
      } catch {
        alert('Invalid JSON file');
      }
    };
    input.click();
  }, [importData]);

  const handleExportPNG = useCallback(async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = document.querySelector('.floor-plan-canvas-area') as HTMLElement;
      if (!canvas) return;
      const c = await html2canvas(canvas, { backgroundColor: '#0a1520' });
      const link = document.createElement('a');
      link.download = `floor-plan-${Date.now()}.png`;
      link.href = c.toDataURL();
      link.click();
    } catch {
      alert('PNG export requires html2canvas package. Run: npm install html2canvas');
    }
  }, []);

  const handleExportPDF = useCallback(async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = document.querySelector('.floor-plan-canvas-area') as HTMLElement;
      if (!canvas) return;
      const c = await html2canvas(canvas, { backgroundColor: '#0a1520' });
      const imgData = c.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape' });
      const ratio = c.width / c.height;
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdfW / ratio;
      pdf.setFontSize(12);
      pdf.text('Floor Plan Export', 10, 10);
      pdf.setFontSize(8);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 10, 16);
      pdf.addImage(imgData, 'PNG', 10, 22, pdfW - 20, Math.min(pdfH, pdf.internal.pageSize.getHeight() - 30));
      pdf.save(`floor-plan-${Date.now()}.pdf`);
    } catch {
      alert('PDF export requires html2canvas and jspdf packages. Run: npm install html2canvas jspdf');
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          borderBottom: '0.5px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>
            Floor Plan Designer
          </h1>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            Interactive Floor Plan & Coordination Platform
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => setShowUserPanel(true)}
            className="fp-top-btn"
          >
            👥 Users
          </button>
          <button onClick={handleImportJSON} className="fp-top-btn">
            Import JSON
          </button>
          <button
            onClick={() => {
              const name = prompt('Snapshot name (Local Storage):');
              if (name) saveSnapshot(name);
            }}
            className="fp-top-btn"
          >
            Local Save
          </button>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />
          <button
             onClick={() => {
               const id = prompt('Enter Plan ID to load:');
               if (id) loadFromDatabase(id);
             }}
             className="fp-top-btn"
          >
            Load DB
          </button>
           <button
              onClick={() => setShowSaveModal(true)}
              className="fp-top-btn fp-top-btn-primary"
              style={{ opacity: isSaving ? 0.7 : 1 }}
              disabled={isSaving}
           >
             {isSaving ? 'Saving...' : '💾 Save Schema'}
           </button>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />
          <button onClick={handleExportPNG} className="fp-top-btn">PNG</button>
          <button onClick={handleExportPDF} className="fp-top-btn">PDF</button>
          <button onClick={handleExportJSON} className="fp-top-btn fp-top-btn-primary">JSON</button>
        </div>
      </div>

      {/* Floor Tabs */}
      <FloorTabs />

      {/* Main layout: Toolbar + Canvas + Right Panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Toolbar />
        <div
          className="floor-plan-canvas-area"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <FloorPlanCanvas />
          <AlertLog />
        </div>
        <RightPanel />
      </div>

      {/* Overlays */}
      <UserPanel isOpen={showUserPanel} onCloseAction={() => setShowUserPanel(false)} />
      <UserSearchOverlay isOpen={showUserSearch} onCloseAction={() => setShowUserSearch(false)} />
      <AssetDrawer isOpen={showAssetDrawer} onCloseAction={() => setShowAssetDrawer(false)} />
      <SavePlanModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} />

      {/* Inline styles for top buttons */}
      <style>{`
        .fp-top-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 5px;
          font-size: 10px;
          font-weight: 500;
          border: 0.5px solid rgba(255,255,255,0.1);
          cursor: pointer;
          color: var(--foreground);
          background: rgba(255,255,255,0.03);
          transition: all 0.15s;
        }
        .fp-top-btn:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.15);
        }
        .fp-top-btn-primary {
          background: rgba(55,138,221,0.15);
          border-color: rgba(55,138,221,0.3);
          color: #378ADD;
        }
        .fp-top-btn-primary:hover {
          background: rgba(55,138,221,0.25);
        }
        @keyframes pulse-anim {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
}
