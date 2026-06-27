'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Radio,
  Users,
  Camera,
  ShieldCheck,
  Activity,
  Maximize2,
  Megaphone,
  Send,
  CircleDot,
  Gauge,
} from 'lucide-react';
import { PageHeader, StatePill, SeverityTag, StatusDot } from '@/components/ui/Tactical';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { KpiTile } from '@/components/ui/KpiTile';
import { MultiLine } from '@/components/ui/Charts';
import { series, trendUp } from '@/lib/demoSeries';

const UNITS = [
  { id: 'MED-01', type: 'Medical', zone: 'Ramkund', status: 'available', eta: '—' },
  { id: 'POL-04', type: 'Police', zone: 'Gate 2', status: 'engaged', eta: '4m' },
  { id: 'RES-11', type: 'Rescue', zone: 'Zone B', status: 'enroute', eta: '2m' },
  { id: 'MED-03', type: 'Medical', zone: 'Sadhugram', status: 'available', eta: '—' },
  { id: 'POL-07', type: 'Police', zone: 'Trimbak Rd', status: 'engaged', eta: '7m' },
  { id: 'VOL-22', type: 'Volunteer', zone: 'Gate 4', status: 'available', eta: '—' },
];

const CAMERAS = Array.from({ length: 6 }, (_, i) => ({
  id: `CAM-${(i + 1).toString().padStart(2, '0')}`,
  zone: ['Ramkund', 'Gate 2', 'Zone B', 'Sadhugram', 'Trimbak Rd', 'Gate 4'][i],
  fps: 24 + (i % 3) * 6,
  latency: 40 + i * 7,
  detections: (i * 3) % 5,
}));

const flow = trendUp(31, 20, 30, 88).map((y, i) => ({
  x: `${i}m`,
  density: y,
  capacity: 90,
  forecast: Math.min(100, y + 6 + (i % 4)),
}));

const statusTone: Record<string, 'green' | 'orange' | 'blue'> = {
  available: 'green',
  engaged: 'orange',
  enroute: 'blue',
};

export default function CommandCenterPage() {
  const [broadcast, setBroadcast] = useState('');

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      <PageHeader
        eyebrow="Unified Operations"
        title="Command Center"
        description="A single tactical surface for live units, camera intelligence, crowd telemetry and broadcast control."
      >
        <StatePill tone="green" label="6 units online" icon={Users} />
        <StatePill tone="orange" label="DEFCON 3" icon={ShieldCheck} />
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Crowd index" value="2.4" unit="/m²" icon={Gauge} accent="yellow" delta={3.2} invertDelta spark={trendUp(41, 14, 30, 70)} />
        <KpiTile label="Units engaged" value="3" icon={Radio} accent="orange" delta={-5} spark={series(42, 14, 4, 2)} />
        <KpiTile label="Cameras live" value="248" icon={Camera} accent="blue" delta={0.4} spark={series(43, 14, 50, 6)} />
        <KpiTile label="Open incidents" value="7" icon={Activity} accent="red" delta={12} invertDelta spark={series(44, 14, 8, 4)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Camera wall */}
        <Panel className="xl:col-span-2 p-5">
          <PanelHeader title="Camera intelligence wall" subtitle="AI detection overlays · live" icon={Camera}
            action={<button className="text-[12px] link-coral inline-flex items-center gap-1"><Maximize2 size={13} /> Fullscreen</button>}
          />
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CAMERAS.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="group relative aspect-video rounded-lg overflow-hidden border border-hairline bg-surface-dark-soft"
              >
                <div className="absolute inset-0 grid-texture opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {/* scan line */}
                <div className="absolute inset-x-0 h-px bg-accent-blue/40" style={{ animation: 'scan-line 3s linear infinite', animationDelay: `${i * 0.4}s` }} />
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <CircleDot size={10} className="text-accent-red animate-[pulse-soft_1.4s_ease-in-out_infinite]" />
                  <span className="tnum text-[10px] text-on-dark font-mono">{c.id}</span>
                </div>
                {c.detections > 0 && (
                  <span className="absolute top-2 right-2 tnum text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent-orange/20 text-accent-orange border border-accent-orange/30">
                    {c.detections} det
                  </span>
                )}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-on-dark-soft font-mono">
                  <span>{c.zone}</span>
                  <span className="tnum">{c.fps}fps · {c.latency}ms</span>
                </div>
              </motion.div>
            ))}
          </div>
        </Panel>

        {/* Unit roster */}
        <Panel className="p-5">
          <PanelHeader title="Responder roster" subtitle="Live unit status" icon={Users} />
          <div className="mt-4 space-y-2">
            {UNITS.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-soft px-3 py-2.5">
                <StatusDot tone={statusTone[u.status]} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-ink">{u.id} <span className="text-muted font-normal">· {u.type}</span></p>
                  <p className="text-[11px] text-muted-soft">{u.zone}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-medium capitalize text-body">{u.status}</p>
                  {u.eta !== '—' && <p className="tnum text-[11px] text-muted-soft">ETA {u.eta}</p>}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Density telemetry */}
        <Panel className="xl:col-span-2 p-5">
          <PanelHeader title="Crowd density telemetry" subtitle="Live vs capacity vs AI forecast" icon={Activity} />
          <div className="mt-4">
            <MultiLine
              data={flow}
              series={[
                { key: 'density', accent: 'orange', name: 'Live density' },
                { key: 'forecast', accent: 'blue', name: 'AI forecast' },
                { key: 'capacity', accent: 'red', name: 'Capacity' },
              ]}
              height={240}
            />
          </div>
        </Panel>

        {/* Broadcast */}
        <Panel accent="orange" className="p-5">
          <PanelHeader title="Broadcast control" subtitle="Push to responder + citizen channels" icon={Megaphone} />
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {['All units', 'Medical', 'Police', 'Citizens'].map((ch, i) => (
                <button key={ch} className={'text-[12px] px-3 h-8 rounded-lg border transition-colors ' + (i === 0 ? 'border-coral/40 bg-coral/10 text-coral' : 'border-hairline bg-surface-soft text-body hover:text-ink')}>
                  {ch}
                </button>
              ))}
            </div>
            <textarea
              value={broadcast}
              onChange={(e) => setBroadcast(e.target.value)}
              rows={4}
              placeholder="Compose broadcast message…"
              className="w-full rounded-lg border border-hairline bg-surface-soft p-3 text-[13px] text-ink placeholder:text-muted-soft outline-none focus:border-coral/40 resize-none"
            />
            <div className="flex items-center justify-between">
              <SeverityTag level="high" />
              <button disabled={!broadcast.trim()} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-coral text-on-primary text-[13px] font-medium disabled:opacity-40 hover:bg-coral-active transition-colors">
                <Send size={14} /> Broadcast
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
