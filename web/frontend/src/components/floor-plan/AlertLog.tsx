'use client';

import { useFloorPlanStore } from '@/lib/floorPlanStore';

export default function AlertLog() {
  const { alerts, clearAlerts } = useFloorPlanStore();

  if (alerts.length === 0) return null;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: '10px 12px',
        marginTop: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          Alert Log
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{alerts.length} events</span>
          <button
            onClick={clearAlerts}
            style={{
              fontSize: 9,
              color: '#378ADD',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <div style={{ maxHeight: 120, overflowY: 'auto' }}>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 8px',
              borderRadius: 5,
              marginBottom: 4,
              border: '0.5px solid',
              background:
                alert.level === 'critical'
                  ? 'rgba(226,75,74,0.1)'
                  : 'rgba(239,159,39,0.1)',
              borderColor:
                alert.level === 'critical'
                  ? 'rgba(226,75,74,0.3)'
                  : 'rgba(239,159,39,0.3)',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                flexShrink: 0,
                background: alert.level === 'critical' ? '#E24B4A' : '#EF9F27',
              }}
            />
            <div style={{ flex: 1, fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
              <strong>{alert.roomName}</strong> — {alert.occupancyPercent}% capacity · {alert.floorName}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
              {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
