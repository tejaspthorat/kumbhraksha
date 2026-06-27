'use client';

import { useFloorPlanStore, type ToolType } from '@/lib/floorPlanStore';

interface ToolButton {
  tool?: ToolType;
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
  shortcut?: string;
}

const svgIcon = (d: string, color?: string, extra?: React.ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d={d} stroke={color ?? 'var(--foreground)'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {extra}
  </svg>
);

export default function Toolbar() {
  const {
    activeTool,
    setActiveTool,
    showGrid,
    toggleGrid,
    snapToGrid,
    toggleSnapToGrid,
    showHeatmap,
    toggleHeatmap,
    showEvacuationView,
    toggleEvacuationView,
    undo,
    redo,
    history,
    historyIndex,
    fitToScreen,
  } = useFloorPlanStore();

  const btnClass = (active: boolean) =>
    `w-8 h-8 rounded-md flex items-center justify-center border border-white/10 cursor-pointer transition-all duration-150 ${
      active ? 'bg-[#0C447C] border-[#378ADD]' : 'bg-transparent hover:bg-white/5'
    }`;

  const tools: (ToolButton | 'sep')[] = [
    {
      tool: 'select',
      title: 'Select / Move (V)',
      shortcut: 'V',
      icon: svgIcon('M3 2L13 8L8 9L6 14L3 2Z'),
    },
    {
      tool: 'draw-room',
      title: 'Draw Room (R)',
      shortcut: 'R',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="#378ADD" strokeWidth="1.4" strokeDasharray="2.5 1.5" />
        </svg>
      ),
    },
    {
      tool: 'draw-corridor',
      title: 'Draw Corridor (C)',
      shortcut: 'C',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 8C5 8 11 8 14 8" stroke="var(--foreground)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M2 6C5 6 11 10 14 10" stroke="var(--foreground)" strokeWidth="0.8" strokeDasharray="2 1" opacity="0.5" />
        </svg>
      ),
    },
    {
      tool: 'draw-evacuation',
      title: 'Evacuation Route',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 11C5 9 11 7 14 5" stroke="#E24B4A" strokeWidth="1.5" strokeDasharray="2.5 1.5" strokeLinecap="round" />
          <path d="M11.5 4L14 5L12 7" stroke="#E24B4A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    'sep',
    {
      tool: 'add-entry',
      title: 'Add Entry Point (E)',
      shortcut: 'E',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="5.5" stroke="#639922" strokeWidth="1.4" />
          <path d="M5.5 8H10.5M8 5.5L10.5 8L8 10.5" stroke="#639922" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      tool: 'add-asset',
      title: 'Add Asset',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="8" width="4" height="5" rx="1" stroke="var(--foreground)" strokeWidth="1.2" />
          <rect x="9" y="3" width="4" height="5" rx="1" stroke="var(--foreground)" strokeWidth="1.2" />
          <path d="M5 8V5.5M11 8V10.5" stroke="var(--foreground)" strokeWidth="1" strokeDasharray="1.5 1" />
        </svg>
      ),
    },
    'sep',
    {
      title: 'Toggle Grid (G)',
      shortcut: 'G',
      onClick: toggleGrid,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 5h12M2 11h12M5 2v12M11 2v12" stroke={showGrid ? '#378ADD' : 'var(--foreground)'} strokeWidth="0.8" opacity={showGrid ? 1 : 0.5} />
        </svg>
      ),
    },
    {
      title: 'Toggle Snap',
      onClick: toggleSnapToGrid,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="2.5" stroke={snapToGrid ? '#378ADD' : 'var(--foreground)'} strokeWidth="1.2" />
          <path d="M8 2v2M8 12v2M2 8h2M12 8h2" stroke={snapToGrid ? '#378ADD' : 'var(--foreground)'} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: 'Toggle Heatmap (H)',
      shortcut: 'H',
      onClick: toggleHeatmap,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="10" width="3" height="4" rx="1" fill={showHeatmap ? '#639922' : 'var(--foreground)'} opacity="0.7" />
          <rect x="6.5" y="7" width="3" height="7" rx="1" fill={showHeatmap ? '#EF9F27' : 'var(--foreground)'} opacity="0.7" />
          <rect x="11" y="3" width="3" height="11" rx="1" fill={showHeatmap ? '#E24B4A' : 'var(--foreground)'} opacity="0.7" />
        </svg>
      ),
    },
    {
      title: 'Evacuation View',
      onClick: toggleEvacuationView,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2L14 8L8 14L2 8Z" stroke={showEvacuationView ? '#E24B4A' : 'var(--foreground)'} strokeWidth="1.2" />
          <path d="M5.5 8L8 5.5L10.5 8" stroke={showEvacuationView ? '#E24B4A' : 'var(--foreground)'} strokeWidth="1" />
        </svg>
      ),
    },
    'sep',
    {
      title: 'Undo (Ctrl+Z)',
      onClick: undo,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 5C4 3 6 2 8 2C11.3 2 14 4.7 14 8S11.3 14 8 14C5.2 14 2.8 12.2 2 9.5" stroke="var(--foreground)" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M3 5L2 2L5.5 3.5" stroke="var(--foreground)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: 'Redo (Ctrl+Shift+Z)',
      onClick: redo,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13 5C12 3 10 2 8 2C4.7 2 2 4.7 2 8S4.7 14 8 14C10.8 14 13.2 12.2 14 9.5" stroke="var(--foreground)" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M13 5L14 2L10.5 3.5" stroke="var(--foreground)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: 'Fit to Screen',
      onClick: () => fitToScreen(800, 500),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 6V2H6M10 2H14V6M14 10V14H10M6 14H2V10" stroke="var(--foreground)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        width: 44,
        borderRight: '0.5px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        padding: '8px 6px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: 2 }}>
        Tools
      </div>

      {tools.map((item, i) => {
        if (item === 'sep') {
          return (
            <div
              key={`sep-${i}`}
              style={{
                width: 24,
                height: 0.5,
                background: 'rgba(255,255,255,0.08)',
                margin: '2px 0',
              }}
            />
          );
        }
        const isActive = item.tool ? activeTool === item.tool : false;
        return (
          <button
            key={item.title}
            className={btnClass(isActive)}
            title={item.title}
            onClick={() => {
              if (item.onClick) {
                item.onClick();
              } else if (item.tool) {
                setActiveTool(item.tool);
              }
            }}
          >
            {item.icon}
          </button>
        );
      })}
    </div>
  );
}
