'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Check,
  X,
  FolderOpen,
  ScanFace,
  Users,
  CameraOff,
  Ambulance,
  RefreshCw,
  ShieldAlert,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader, StatePill, SeverityTag } from '@/components/ui/Tactical';
import { Panel } from '@/components/ui/Panel';
import { KpiTile } from '@/components/ui/KpiTile';
import { series, trendUp } from '@/lib/demoSeries';

type NotifType = 'critical' | 'cases' | 'crowd' | 'system';
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

type Notification = {
  id: number;
  type: NotifType;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  accent: string;
  title: string;
  body: string;
  time: string;
  group: 'today' | 'earlier';
  severity: Severity;
  unread: boolean;
};

const SEED: Notification[] = [
  { id: 1, type: 'crowd', icon: Users, accent: 'var(--accent-red)', title: 'Density warning · Ramkund', body: 'Crowd index breached 2.4/m² near the ghat. Surge forecast in 12 minutes.', time: '2m ago', group: 'today', severity: 'critical', unread: true },
  { id: 2, type: 'cases', icon: ScanFace, accent: 'var(--accent-orange)', title: 'Sighting matched · MP-2291', body: 'Face match 94% on CAM-04, Trimbak Road Entry. Awaiting responder confirmation.', time: '8m ago', group: 'today', severity: 'high', unread: true },
  { id: 3, type: 'critical', icon: CameraOff, accent: 'var(--accent-red)', title: 'Camera offline · CAM-07', body: 'Feed lost on Trimbak Rd. Switched to adjacent CAM-06 coverage.', time: '15m ago', group: 'today', severity: 'critical', unread: true },
  { id: 4, type: 'cases', icon: FolderOpen, accent: 'var(--accent-orange)', title: 'New case opened · #4821', body: 'Missing child reported at Sadhugram help desk. Profile attached.', time: '21m ago', group: 'today', severity: 'high', unread: true },
  { id: 5, type: 'crowd', icon: Ambulance, accent: 'var(--accent-blue)', title: 'Responder dispatched · MED-01', body: 'Medical unit enroute to Godavari Ghat for minor injury. ETA 2 minutes.', time: '34m ago', group: 'today', severity: 'medium', unread: false },
  { id: 6, type: 'system', icon: RefreshCw, accent: 'var(--accent-green)', title: 'System sync complete', body: 'All 248 camera nodes synced with the edge inference cluster.', time: '52m ago', group: 'today', severity: 'info', unread: false },
  { id: 7, type: 'cases', icon: CheckCircle2, accent: 'var(--accent-green)', title: 'Case resolved · #4790', body: 'Lost pilgrim reunited at Tapovan Exit. Case closed by VOL-22.', time: '1h ago', group: 'today', severity: 'low', unread: false },
  { id: 8, type: 'crowd', icon: Users, accent: 'var(--accent-yellow)', title: 'Crowd flow normalised · Trimbak Entry', body: 'Bottleneck cleared after two officers redirected outflow.', time: '2h ago', group: 'earlier', severity: 'medium', unread: false },
  { id: 9, type: 'critical', icon: ShieldAlert, accent: 'var(--accent-red)', title: 'DEFCON raised to level 3', body: 'Elevated alert posture across all zones for the evening aarti window.', time: '3h ago', group: 'earlier', severity: 'critical', unread: false },
  { id: 10, type: 'cases', icon: ScanFace, accent: 'var(--accent-orange)', title: 'Sighting matched · MP-2188', body: 'Face match 88% on CAM-11, Tapovan Exit. Marked false positive on review.', time: '4h ago', group: 'earlier', severity: 'medium', unread: false },
  { id: 11, type: 'system', icon: RefreshCw, accent: 'var(--accent-green)', title: 'Edge model updated', body: 'Detection model v3.2 deployed to all inference nodes successfully.', time: '5h ago', group: 'earlier', severity: 'info', unread: false },
  { id: 12, type: 'crowd', icon: Ambulance, accent: 'var(--accent-blue)', title: 'Responder cleared · RES-11', body: 'Rescue unit returned to standby at Godavari Ghat staging point.', time: '6h ago', group: 'earlier', severity: 'low', unread: false },
];

const TABS: { id: 'all' | NotifType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'cases', label: 'Cases' },
  { id: 'crowd', label: 'Crowd' },
  { id: 'system', label: 'System' },
];

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>(SEED);
  const [tab, setTab] = useState<'all' | NotifType>('all');

  const markRead = (id: number) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  const dismiss = (id: number) => setItems((prev) => prev.filter((n) => n.id !== id));
  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, unread: false })));

  const filtered = useMemo(
    () => (tab === 'all' ? items : items.filter((n) => n.type === tab)),
    [items, tab]
  );

  const unreadCount = items.filter((n) => n.unread).length;
  const criticalCount = items.filter((n) => n.severity === 'critical').length;
  const resolvedCount = SEED.length - items.length;

  const today = filtered.filter((n) => n.group === 'today');
  const earlier = filtered.filter((n) => n.group === 'earlier');

  const renderItem = (n: Notification, i: number) => (
    <motion.div
      key={n.id}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ delay: Math.min(i * 0.03, 0.18) }}
      className={
        'group relative flex items-start gap-3.5 rounded-xl border bg-surface-card p-4 transition-colors ' +
        (n.unread ? 'border-hairline-strong' : 'border-hairline hover:border-hairline-strong')
      }
    >
      {n.unread && <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-coral" aria-hidden />}
      <span
        className="grid place-items-center size-10 shrink-0 rounded-lg border border-hairline bg-surface-soft"
        style={{ color: n.accent }}
      >
        <n.icon size={17} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13px] font-semibold text-ink">{n.title}</p>
          {n.unread && <span className="size-1.5 rounded-full bg-coral" aria-hidden />}
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">{n.body}</p>
        <div className="mt-2.5 flex items-center gap-2.5">
          <SeverityTag level={n.severity} />
          <span className="tnum text-[11px] text-muted-soft font-mono">{n.time}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {n.unread && (
          <button
            onClick={() => markRead(n.id)}
            aria-label="Mark read"
            className="grid place-items-center size-8 rounded-lg border border-hairline bg-surface-soft text-muted hover:text-accent-green transition-colors"
          >
            <Check size={14} />
          </button>
        )}
        <button
          onClick={() => dismiss(n.id)}
          aria-label="Dismiss"
          className="grid place-items-center size-8 rounded-lg border border-hairline bg-surface-soft text-muted hover:text-accent-red transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        description="Every alert, case event and system signal across the deployment — triaged in one feed."
      >
        <StatePill tone="orange" label={`${unreadCount} unread`} icon={Bell} />
        <button
          onClick={markAllRead}
          className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface-soft px-3 h-9 text-[12px] font-medium text-body hover:text-ink transition-colors"
        >
          <BellOff size={14} className="text-muted" /> Mark all read
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Total today" value={SEED.filter((n) => n.group === 'today').length} icon={Bell} accent="blue" delta={8} spark={trendUp(12, 14, 20, 40)} />
        <KpiTile label="Unread" value={unreadCount} icon={Activity} accent="orange" delta={4} invertDelta spark={series(13, 14, 6, 4)} />
        <KpiTile label="Critical" value={criticalCount} icon={ShieldAlert} accent="red" delta={2} invertDelta spark={series(14, 14, 3, 3)} />
        <KpiTile label="Resolved" value={resolvedCount} icon={CheckCircle2} accent="green" delta={6} spark={trendUp(15, 14, 10, 24)} />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = t.id === tab;
          const count = t.id === 'all' ? items.length : items.filter((n) => n.type === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                'inline-flex items-center gap-2 text-[12px] px-3.5 h-9 rounded-lg border transition-colors ' +
                (active
                  ? 'border-coral/40 bg-coral/10 text-coral'
                  : 'border-hairline bg-surface-soft text-body hover:text-ink')
              }
            >
              {t.label}
              <span className={'tnum text-[10px] font-semibold ' + (active ? 'text-coral' : 'text-muted-soft')}>{count}</span>
            </button>
          );
        })}
      </div>

      <Panel className="p-5">
        <div className="space-y-6">
          {today.length > 0 && (
            <div>
              <p className="caption-upper text-[10px] text-muted-soft mb-3">Today</p>
              <div className="space-y-2.5">
                <AnimatePresence initial={false}>{today.map(renderItem)}</AnimatePresence>
              </div>
            </div>
          )}
          {earlier.length > 0 && (
            <div>
              <p className="caption-upper text-[10px] text-muted-soft mb-3">Earlier</p>
              <div className="space-y-2.5">
                <AnimatePresence initial={false}>{earlier.map(renderItem)}</AnimatePresence>
              </div>
            </div>
          )}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="grid place-items-center size-12 rounded-xl border border-hairline bg-surface-soft text-muted">
                <BellOff size={20} />
              </span>
              <div>
                <p className="text-[14px] font-medium text-ink">You&apos;re all caught up</p>
                <p className="text-[12px] text-muted mt-1">No notifications in this filter.</p>
              </div>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
