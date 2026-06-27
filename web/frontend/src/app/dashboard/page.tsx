'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Camera, MapPin, Radio, ScanEye } from 'lucide-react';
import dynamic from 'next/dynamic';
import { krApi } from '@/lib/missing/client';
import type { MissingReport, Sighting, CctvLocation } from '@/lib/missing/types';
import { NETWORK_CENTER as networkCenter, withLiveCascade } from '@/lib/missing/cascade';

const OpsMap = dynamic(() => import('@/components/missing/OpsMap'), {
  ssr: false,
  loading: () => (
    <div className="aspect-[16/10] w-full rounded-xl bg-surface-soft border border-hairline animate-pulse" />
  ),
});
import {
  StatTile,
  StatusBadge,
  CascadeBadge,
  PersonAvatar,
  PageHeading,
} from '@/components/missing/CaseUI';
import { timeAgo } from '@/lib/geo';
import { Badge } from '@/components/ui/Badge';

export default function LiveOperationsPage() {
  const [reports, setReports] = useState<MissingReport[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [cctv, setCctv] = useState<CctvLocation[]>([]);
  const [center] = useState(networkCenter);
  const [selected, setSelected] = useState<string | null>(null);
  const [layers, setLayers] = useState({ cctv: true, sightings: true, rings: true });
  const [loading, setLoading] = useState(true);

  async function load() {
    const [rs, ss, cs] = await Promise.all([
      krApi.reports().catch(() => [] as MissingReport[]),
      krApi.sightings().catch(() => [] as Sighting[]),
      krApi.cctv().catch(() => [] as CctvLocation[]),
    ]);
    setReports(rs.map(withLiveCascade));
    setSightings(ss);
    setCctv(cs);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
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

  return (
    <div className="max-w-[1280px] mx-auto">
      <PageHeading eyebrow="Integrated Command & Control" title="Live Operations">
        <Badge variant="outline" className="font-mono">
          {loading ? 'Syncing…' : 'Updated ' + new Date().toLocaleTimeString()}
        </Badge>
      </PageHeading>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Active cases" value={stats.active} accent="coral" hint="Open missing-person reports" />
        <StatTile label="Children at risk" value={stats.children} hint="Under 12 — prioritised" />
        <StatTile label="Sightings to triage" value={stats.pending} accent="teal" hint="Awaiting verification" />
        <StatTile
          label="Phones notified"
          value={stats.notified.toLocaleString('en-IN')}
          hint="Across active alert radii"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Map */}
        <section className="xl:col-span-2 card-canvas p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium tracking-tight">Operations map</h2>
              <p className="text-[13px] text-muted">Cases, sightings & CCTV coverage near the Sangam</p>
            </div>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { key: 'cctv', label: 'CCTV', icon: Camera },
                  { key: 'sightings', label: 'Sightings', icon: ScanEye },
                  { key: 'rings', label: 'Radii', icon: Radio },
                ] as const
              ).map((l) => (
                <button
                  key={l.key}
                  onClick={() => setLayers((s) => ({ ...s, [l.key]: !s[l.key] }))}
                  className={
                    'inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[13px] font-medium transition-colors ' +
                    (layers[l.key]
                      ? 'bg-surface-cream-strong text-ink'
                      : 'text-muted hover:bg-surface-soft')
                  }
                >
                  <l.icon className="size-3.5" />
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <OpsMap
            className="aspect-[16/10] w-full"
            center={center}
            spanMeters={3000}
            showCoverage={layers.cctv}
            showRings={layers.rings}
            cctv={layers.cctv ? cctv : []}
            sightings={
              layers.sightings
                ? sightings.map((s) => ({
                    id: s.id,
                    lat: s.lat,
                    lng: s.lng,
                    matched: s.status === 'MATCHED' || s.status === 'CONFIRMED',
                  }))
                : []
            }
            cases={active.map((r) => ({
              id: r.id,
              lat: r.lastSeenLat,
              lng: r.lastSeenLng,
              label: r.person.name,
              radiusMeters: r.alertRadiusMeters,
              isChild: (r.person.age ?? 99) < 12,
            }))}
            selectedId={selected}
            onSelect={setSelected}
          />

          <div className="flex flex-wrap items-center gap-4 mt-4 text-[12px] text-muted">
            <Legend color="bg-coral" label="Active case + alert radius" />
            <Legend color="bg-accent-amber" label="Unverified sighting" />
            <Legend color="bg-accent-teal" label="Matched sighting" />
            <Legend color="bg-surface-dark/60" label="CCTV camera" />
          </div>
        </section>

        {/* Active cases list */}
        <section className="card-canvas p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium tracking-tight">Active cases</h2>
            <Link
              href="/dashboard/missing"
              className="link-coral text-[13px] inline-flex items-center gap-1"
            >
              Command center <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto scrollbar-thin pr-1">
            {active.length === 0 && (
              <p className="text-[13px] text-muted py-8 text-center">No active cases.</p>
            )}
            {active.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={
                  'w-full text-left rounded-lg p-3 border transition-colors ' +
                  (selected === r.id
                    ? 'border-coral/40 bg-coral/5'
                    : 'border-hairline hover:bg-surface-soft')
                }
              >
                <div className="flex items-start gap-3">
                  <PersonAvatar report={r} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-ink truncate">
                        {r.person.name}
                        {r.person.age != null && (
                          <span className="text-muted font-normal"> · {r.person.age}</span>
                        )}
                      </p>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-[13px] text-muted truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="size-3" /> {r.lastSeenLabel ?? 'Unknown'}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <CascadeBadge level={r.cascadeLevel} />
                      <span className="text-[12px] text-muted-soft">{timeAgo(r.reportedAt)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
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
