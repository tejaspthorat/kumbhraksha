'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Siren,
  Users,
  Route,
  Truck,
  Timer,
  Megaphone,
  Send,
  Power,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader, StatePill, SeverityTag, StatusDot } from '@/components/ui/Tactical';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { KpiTile } from '@/components/ui/KpiTile';
import { series, trendUp } from '@/lib/demoSeries';
import { useUiStore } from '@/lib/uiStore';

type Protocol = {
  id: string;
  label: string;
  detail: string;
  level: 'critical' | 'high' | 'medium';
  done: boolean;
};

const INITIAL_PROTOCOLS: Protocol[] = [
  { id: 'p1', label: 'Lock down Trimbak Road Entry', detail: 'Seal inbound flow, hold crowd at perimeter', level: 'critical', done: true },
  { id: 'p2', label: 'Open evac corridor A', detail: 'Clear Ramkund → Trimbak Rd corridor', level: 'critical', done: false },
  { id: 'p3', label: 'Dispatch all medical', detail: 'Mobilise MED-01/03 + standby reserves', level: 'high', done: false },
  { id: 'p4', label: 'Broadcast advisory', detail: 'Push citizen + responder mass alert', level: 'high', done: false },
];

const CHANNELS = ['All channels', 'Citizens', 'Responders', 'Medical', 'Police'];

type RouteRow = {
  id: string;
  name: string;
  status: 'open' | 'congested' | 'closed';
  capacity: number;
  eta: string;
};

const ROUTES: RouteRow[] = [
  { id: 'r1', name: 'Corridor A · Ramkund → Trimbak Rd', status: 'open', capacity: 38, eta: '6m' },
  { id: 'r2', name: 'Corridor B · Tapovan Exit → Sadhugram', status: 'congested', capacity: 82, eta: '14m' },
  { id: 'r3', name: 'Corridor C · Godavari Ghat → Nashik Road transit', status: 'closed', capacity: 100, eta: '—' },
];

const routeTone: Record<RouteRow['status'], 'green' | 'orange' | 'red'> = {
  open: 'green',
  congested: 'orange',
  closed: 'red',
};

const capacityAccent: Record<RouteRow['status'], string> = {
  open: 'bg-accent-green',
  congested: 'bg-accent-orange',
  closed: 'bg-accent-red',
};

export default function EmergencyPage() {
  const emergencyMode = useUiStore((s) => s.emergencyMode);
  const toggleEmergency = useUiStore((s) => s.toggleEmergency);

  const [protocols, setProtocols] = useState<Protocol[]>(INITIAL_PROTOCOLS);
  const [activeChannel, setActiveChannel] = useState(0);
  const [message, setMessage] = useState('');

  const toggleProtocol = (id: string) =>
    setProtocols((prev) => prev.map((p) => (p.id === id ? { ...p, done: !p.done } : p)));

  const completed = protocols.filter((p) => p.done).length;

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      <PageHeader
        eyebrow="Crisis Response"
        title="Emergency Mode"
        description="Centralised crisis command — activate protocols, mobilise units, and push mass advisories under one controlled surface."
      >
        <StatePill tone={emergencyMode ? 'red' : 'muted'} label={emergencyMode ? 'CRISIS ACTIVE' : 'Standby'} />
        <StatePill tone="orange" label={`${completed}/${protocols.length} protocols`} icon={ShieldAlert} />
      </PageHeader>

      {/* Master status / arming control */}
      <Panel accent="red" className="p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <span
              className={
                'grid place-items-center size-14 rounded-xl border shrink-0 ' +
                (emergencyMode
                  ? 'border-accent-red/40 bg-accent-red/15 text-accent-red'
                  : 'border-hairline bg-surface-soft text-muted')
              }
            >
              <Siren
                size={26}
                className={emergencyMode ? 'animate-[pulse-soft_1.2s_ease-in-out_infinite]' : ''}
              />
            </span>
            <div className="min-w-0">
              <p className="caption-upper text-[10px] text-muted-soft">System state</p>
              <h2 className="font-heading text-2xl font-semibold text-ink">
                {emergencyMode ? 'Emergency mode ACTIVE' : 'Emergency mode standby'}
              </h2>
              <p className="mt-1 text-[13px] text-muted">
                {emergencyMode
                  ? 'All channels armed · chrome tinted · broadcast bar live across operators.'
                  : 'Nominal operations. Arm to escalate the entire command surface to crisis posture.'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleEmergency}
            className={
              'inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl text-[14px] font-semibold transition-colors shrink-0 ' +
              (emergencyMode
                ? 'border border-hairline-strong bg-surface-soft text-body hover:text-ink'
                : 'bg-coral text-on-primary hover:bg-coral-active')
            }
          >
            <Power size={16} />
            {emergencyMode ? 'Deactivate' : 'Activate emergency'}
          </button>
        </div>
      </Panel>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="In danger zones" value="1,240" icon={Users} accent="red" delta={18} invertDelta spark={trendUp(61, 14, 30, 90)} />
        <KpiTile label="Evac routes open" value="2" unit="/3" icon={Route} accent="orange" delta={-12} spark={series(62, 14, 4, 2)} />
        <KpiTile label="Units mobilised" value="11" icon={Truck} accent="orange" delta={24} spark={series(63, 14, 6, 3)} />
        <KpiTile label="Est. clearance" value="18" unit="min" icon={Timer} accent="red" delta={-9} spark={series(64, 14, 22, 5)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Protocols */}
        <Panel className="xl:col-span-2 p-5">
          <PanelHeader
            title="Emergency protocols"
            subtitle="Acknowledge and execute the crisis checklist"
            icon={ShieldAlert}
            action={<span className="tnum text-[12px] text-muted">{completed}/{protocols.length} done</span>}
          />
          <div className="mt-4 space-y-2">
            {protocols.map((p) => (
              <button
                key={p.id}
                onClick={() => toggleProtocol(p.id)}
                className="w-full flex items-center gap-3 rounded-lg border border-hairline bg-surface-soft px-3 py-2.5 text-left transition-colors hover:border-hairline-strong"
              >
                <span
                  className={
                    'grid place-items-center size-5 rounded-md border shrink-0 transition-colors ' +
                    (p.done
                      ? 'border-accent-green/50 bg-accent-green/20 text-accent-green'
                      : 'border-hairline text-transparent')
                  }
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <p className={'text-[13px] font-medium ' + (p.done ? 'text-muted line-through' : 'text-ink')}>{p.label}</p>
                  <p className="text-[11px] text-muted-soft truncate">{p.detail}</p>
                </div>
                <SeverityTag level={p.level} />
              </button>
            ))}
          </div>
        </Panel>

        {/* Mass broadcast */}
        <Panel accent="red" className="p-5">
          <PanelHeader title="Mass broadcast" subtitle="Emergency advisory dispatch" icon={Megaphone} />
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((ch, i) => (
                <button
                  key={ch}
                  onClick={() => setActiveChannel(i)}
                  className={
                    'text-[12px] px-3 h-8 rounded-lg border transition-colors ' +
                    (i === activeChannel
                      ? 'border-coral/40 bg-coral/10 text-coral'
                      : 'border-hairline bg-surface-soft text-body hover:text-ink')
                  }
                >
                  {ch}
                </button>
              ))}
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Compose emergency advisory…"
              className="w-full rounded-lg border border-hairline bg-surface-soft p-3 text-[13px] text-ink placeholder:text-muted-soft outline-none focus:border-coral/40 resize-none"
            />
            <div className="flex items-center justify-between gap-3">
              <SeverityTag level="critical" />
              <button
                disabled={!message.trim()}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-coral text-on-primary text-[13px] font-semibold disabled:opacity-40 hover:bg-coral-active transition-colors"
              >
                <Send size={14} /> BROADCAST EMERGENCY
              </button>
            </div>
          </div>
        </Panel>
      </div>

      {/* Evacuation routes */}
      <Panel className="p-5">
        <PanelHeader title="Evacuation routes" subtitle="Corridor status, load and clearance ETA" icon={Route} />
        <div className="mt-4 space-y-2">
          {ROUTES.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface-soft px-4 py-3 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-3 min-w-0 sm:w-72">
                <StatusDot tone={routeTone[r.status]} />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink truncate">{r.name}</p>
                  <p className="text-[11px] capitalize text-muted-soft">{r.status}</p>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-[11px] text-muted-soft mb-1">
                  <span>Load</span>
                  <span className="tnum">{r.capacity}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-elevated overflow-hidden">
                  <div className={'h-full rounded-full ' + capacityAccent[r.status]} style={{ width: `${r.capacity}%` }} />
                </div>
              </div>
              <div className="text-right sm:w-20">
                <p className="caption-upper text-[10px] text-muted-soft">ETA</p>
                <p className="tnum text-[13px] font-medium text-body">{r.eta}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
