'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Camera,
  MapPin,
  Radio,
  ScanEye,
  Shield,
  TriangleAlert,
  Users,
  Activity,
  Bell,
  Cpu,
  Sparkles,
  Brain,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { krApi } from '@/lib/missing/client';
import type { MissingReport, Sighting } from '@/lib/missing/types';
import { NETWORK_CENTER as networkCenter, withLiveCascade } from '@/lib/missing/cascade';
import { geo, type PoliceStation, type Chokepoint, type CctvCamera, type CctvZone } from '@/lib/nashik/geo';
import { StatusBadge, CascadeBadge, PersonAvatar } from '@/components/missing/CaseUI';
import { timeAgo } from '@/lib/geo';
import { KpiTile } from '@/components/ui/KpiTile';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { StatePill, SeverityTag, StatusDot } from '@/components/ui/Tactical';
import { AreaTrend, BarMini } from '@/components/ui/Charts';
import { series, trendUp } from '@/lib/demoSeries';
import { useUiStore } from '@/lib/uiStore';

const OpsMap = dynamic(() => import('@/components/missing/OpsMap'), {
  ssr: false,
  loading: () => (
    <div className="aspect-[16/10] w-full rounded-xl bg-surface-soft border border-hairline shimmer" />
  ),
});

const AI_INSIGHTS = [
  { level: 'high' as const, title: 'Zone B density rising', body: 'Projected to breach warning threshold in ~12 min. Pre-position 2 units.' },
  { level: 'medium' as const, title: 'Sighting cluster near Ramkund', body: '3 unverified sightings within 200m of Case #1247 — likely match.' },
  { level: 'low' as const, title: 'Gate 4 flow nominal', body: 'Entry/exit balanced; no action required.' },
];

const crowdTrend = trendUp(7, 24, 40, 92).map((y, i) => ({ x: `${i}:00`.padStart(5, '0'), crowd: y * 1200 }));
const entryExit = series(11, 12, 60, 24).map((y, i) => ({ x: `${i + 8}h`, flow: y }));

export default function OverviewPage() {
  const [reports, setReports] = useState<MissingReport[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [center] = useState(networkCenter);
  const [selected, setSelected] = useState<string | null>(null);
  const [layers, setLayers] = useState({ sightings: true, rings: true, cctv: false, police: true, chokepoints: true });
  const [loading, setLoading] = useState(true);
  const toggleAssistant = useUiStore((s) => s.toggleAssistant);

  const [police, setPolice] = useState<PoliceStation[]>([]);
  const [chokepoints, setChokepoints] = useState<Chokepoint[]>([]);
  const [zones, setZones] = useState<CctvZone[]>([]);
  const [cameras, setCameras] = useState<CctvCamera[]>([]);

  async function load() {
    const [rs, ss] = await Promise.all([
      krApi.reports().catch(() => [] as MissingReport[]),
      krApi.sightings().catch(() => [] as Sighting[]),
    ]);
    setReports(rs.map(withLiveCascade));
    setSightings(ss);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    geo.layers()
      .then(({ police, chokepoints, zones }) => {
        setPolice(police);
        setChokepoints(chokepoints);
        setZones(zones);
      })
      .catch(() => {});
    geo.cameras().then(setCameras).catch(() => {});
    return () => clearInterval(id);
  }, []);

  const active = reports.filter((r) => r.status !== 'REUNITED');
  const pendingSightings = sightings.filter((s) => s.status === 'PENDING');

  const stats = useMemo(
    () => ({
      active: active.length,
      children: active.filter((r) => (r.person.age ?? 99) < 12).length,
      pending: pendingSightings.length,
      notified: active.reduce((s, r) => s + (r.usersNotified ?? 0), 0),
    }),
    [active, pendingSightings]
  );

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <Panel accent="orange" className="p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="min-w-0">
            <p className="caption-upper text-[11px] text-coral mb-3 flex items-center gap-2">
              <StatusDot tone="green" /> Integrated Command &amp; Control · Nashik Kumbh 2027
            </p>
            <h1 className="display-lg text-ink">
              {greeting}, Control Room
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] text-body leading-relaxed flex items-start gap-2">
              <Sparkles size={16} className="text-coral mt-0.5 shrink-0" />
              <span>
                <span className="text-muted">AI summary · </span>
                {stats.active} active case{stats.active === 1 ? '' : 's'} ({stats.children} child{stats.children === 1 ? '' : 'ren'} prioritised),
                {' '}{stats.pending} sighting{stats.pending === 1 ? '' : 's'} awaiting triage. Crowd stable network-wide; Zone B trending toward warning.
                {' '}{stats.notified.toLocaleString('en-IN')} phones inside active alert radii.
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatePill tone="green" label={loading ? 'Syncing…' : 'All systems live'} />
            <button
              onClick={toggleAssistant}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-coral text-on-primary text-[13px] font-medium hover:bg-coral-active transition-colors"
            >
              <Brain size={15} /> Ask Raksha AI
            </button>
          </div>
        </div>
      </Panel>

      {/* ── KPI row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiTile label="Active cases" value={stats.active} icon={ScanEye} accent="orange" delta={8.3} invertDelta spark={series(1, 14, 12, 6)} />
        <KpiTile label="Children at risk" value={stats.children} icon={Users} accent="red" delta={-12.5} invertDelta spark={series(2, 14, 4, 3)} />
        <KpiTile label="Sightings to triage" value={stats.pending} icon={Camera} accent="blue" delta={4.1} invertDelta spark={series(3, 14, 9, 5)} />
        <KpiTile label="Phones notified" value={stats.notified > 999 ? (stats.notified / 1000).toFixed(1) : stats.notified} unit={stats.notified > 999 ? 'k' : ''} icon={Radio} accent="green" delta={6.7} spark={trendUp(4, 14, 20, 80)} />
        <KpiTile label="Active cameras" value={cameras.length} icon={Camera} accent="neutral" delta={0.2} spark={series(5, 14, 50, 8)} />
        <KpiTile label="Avg density" value="2.4" unit="/m²" icon={Activity} accent="yellow" delta={3.5} invertDelta spark={trendUp(6, 14, 30, 70)} />
      </div>

      {/* ── Map + active cases ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Panel className="xl:col-span-2 p-5">
          <PanelHeader
            title="Operations map"
            subtitle="Cases · sightings · CCTV · police · chokepoints — Nashik Kumbh"
            icon={MapPin}
            action={
              <div className="hidden sm:flex items-center gap-1">
                {(
                  [
                    { key: 'cctv', label: 'CCTV', icon: Camera },
                    { key: 'police', label: 'Police', icon: Shield },
                    { key: 'chokepoints', label: 'Choke', icon: TriangleAlert },
                    { key: 'sightings', label: 'Sightings', icon: ScanEye },
                    { key: 'rings', label: 'Radii', icon: Radio },
                  ] as const
                ).map((l) => (
                  <button
                    key={l.key}
                    onClick={() => setLayers((s) => ({ ...s, [l.key]: !s[l.key] }))}
                    className={
                      'inline-flex items-center gap-1.5 px-2 h-7 rounded-md text-[11px] font-medium transition-colors ' +
                      (layers[l.key] ? 'bg-surface-elevated text-ink' : 'text-muted hover:bg-surface-soft')
                    }
                  >
                    <l.icon className="size-3" />
                    {l.label}
                  </button>
                ))}
              </div>
            }
          />
          <div className="mt-4 rounded-xl overflow-hidden border border-hairline">
            <OpsMap
              className="aspect-[16/10] w-full"
              center={center}
              spanMeters={3000}
              showRings={layers.rings}
              cameraPoints={layers.cctv ? cameras : []}
              zones={layers.cctv ? zones : []}
              police={layers.police ? police : []}
              chokepoints={layers.chokepoints ? chokepoints : []}
              sightings={layers.sightings ? sightings.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, matched: s.status === 'MATCHED' || s.status === 'CONFIRMED' })) : []}
              cases={active.map((r) => ({ id: r.id, lat: r.lastSeenLat, lng: r.lastSeenLng, label: r.person.name, radiusMeters: r.alertRadiusMeters, isChild: (r.person.age ?? 99) < 12 }))}
              selectedId={selected}
              onSelect={setSelected}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-[11px] text-muted">
            <Legend color="bg-coral" label="Active case + radius" />
            <Legend color="bg-accent-yellow" label="Unverified sighting" />
            <Legend color="bg-accent-blue" label="CCTV coverage" />
            <Legend color="bg-accent-green" label="Safe zone" />
            <Legend color="bg-accent-red" label="Chokepoint" />
          </div>
        </Panel>

        {/* Active cases */}
        <Panel className="p-5 flex flex-col">
          <PanelHeader
            title="Active cases"
            subtitle={`${active.length} open`}
            icon={ScanEye}
            action={
              <Link href="/dashboard/missing" className="link-coral text-[12px] inline-flex items-center gap-1">
                Command center <ArrowUpRight className="size-3.5" />
              </Link>
            }
          />
          <div className="mt-4 space-y-2 max-h-[520px] overflow-y-auto scrollbar-thin pr-1">
            {active.length === 0 && <p className="text-[13px] text-muted py-8 text-center">No active cases.</p>}
            {active.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={
                  'w-full text-left rounded-lg p-3 border transition-colors ' +
                  (selected === r.id ? 'border-coral/40 bg-coral/5' : 'border-hairline hover:bg-surface-soft')
                }
              >
                <div className="flex items-start gap-3">
                  <PersonAvatar report={r} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-ink truncate">
                        {r.person.name}
                        {r.person.age != null && <span className="text-muted font-normal"> · {r.person.age}</span>}
                      </p>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-[12px] text-muted truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="size-3" /> {r.lastSeenLabel ?? 'Unknown'}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <CascadeBadge level={r.cascadeLevel} />
                      <span className="text-[11px] text-muted-soft">{timeAgo(r.reportedAt)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── AI insights + charts ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Panel accent="blue" className="p-5">
          <PanelHeader title="Live AI insights" subtitle="Risk analysis · auto-refreshed" icon={Cpu} />
          <div className="mt-4 space-y-2.5">
            {AI_INSIGHTS.map((ins, i) => (
              <motion.div
                key={ins.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-lg border border-hairline bg-surface-soft p-3"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-[13px] font-medium text-ink">{ins.title}</p>
                  <SeverityTag level={ins.level} />
                </div>
                <p className="text-[12px] text-muted leading-relaxed">{ins.body}</p>
              </motion.div>
            ))}
          </div>
          <button
            onClick={toggleAssistant}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 h-9 rounded-lg border border-hairline bg-surface-soft text-[13px] text-body hover:text-ink hover:border-hairline-strong transition-colors"
          >
            <Bell size={14} /> Get response recommendations
          </button>
        </Panel>

        <Panel className="p-5">
          <PanelHeader title="Crowd trend" subtitle="Network-wide · last 24h" icon={Activity} />
          <div className="mt-4">
            <AreaTrend data={crowdTrend} dataKey="crowd" accent="orange" height={210} />
          </div>
        </Panel>

        <Panel className="p-5">
          <PanelHeader title="Entry / exit flow" subtitle="People per minute" icon={Users} />
          <div className="mt-4">
            <BarMini data={entryExit} dataKey="flow" accent="blue" height={210} highlightMax />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
