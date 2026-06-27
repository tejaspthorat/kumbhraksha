'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Camera, ShieldAlert, Route, Eye } from 'lucide-react';
import { krApi } from '@/lib/missing/client';
import type { MissingReport } from '@/lib/missing/types';
import { NETWORK_CENTER as networkCenter, withLiveCascade } from '@/lib/missing/cascade';
import { geo, cameraZone, type CctvCamera, type CctvZone } from '@/lib/nashik/geo';

const OpsMap = dynamic(() => import('@/components/missing/OpsMap'), {
  ssr: false,
  loading: () => (
    <div className="aspect-[16/10] w-full rounded-xl bg-surface-soft border border-hairline animate-pulse" />
  ),
});
import { PageHeading, StatTile } from '@/components/missing/CaseUI';
import { distanceMeters } from '@/lib/geo';

/** Assumed effective coverage radius per fixed camera (metres). */
const CAM_COVERAGE_M = 60;

export default function CctvIntelligencePage() {
  const [cameras, setCameras] = useState<CctvCamera[]>([]);
  const [zones, setZones] = useState<CctvZone[]>([]);
  const [reports, setReports] = useState<MissingReport[]>([]);
  const [showZones, setShowZones] = useState(true);

  useEffect(() => {
    geo.cameras().then(setCameras).catch(() => {});
    geo.zones().then(setZones).catch(() => {});
    krApi.reports().then((r) => setReports(r.map(withLiveCascade))).catch(() => {});
  }, []);

  // Which active cases fall within reach of a real camera vs. a blind spot.
  const coverage = useMemo(() => {
    const active = reports.filter((r) => r.status !== 'REUNITED');
    let covered = 0;
    const blind: MissingReport[] = [];
    for (const r of active) {
      const inView = cameras.some(
        (c) =>
          distanceMeters(
            { lat: r.lastSeenLat, lng: r.lastSeenLng },
            { lat: c.lat, lng: c.lng }
          ) <= CAM_COVERAGE_M
      );
      if (inView) covered++;
      else blind.push(r);
    }
    return { covered, blind, active: active.length };
  }, [cameras, reports]);

  // Camera count per surveillance zone (from "Z<n>-C<m>" naming).
  const sectors = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cameras) {
      const z = cameraZone(c.name);
      map.set(z, (map.get(z) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [cameras]);

  return (
    <div className="max-w-[1280px] mx-auto">
      <PageHeading eyebrow="Coverage Intelligence · Nashik Kumbh" title="CCTV Intelligence">
        <button
          onClick={() => setShowZones((v) => !v)}
          className={
            'inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-[13px] font-medium transition-colors ' +
            (showZones ? 'bg-surface-cream-strong text-ink' : 'text-muted hover:bg-surface-soft')
          }
        >
          <Eye className="size-3.5" /> Coverage zones
        </button>
      </PageHeading>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile
          label="Cameras mapped"
          value={cameras.length.toLocaleString('en-IN')}
          accent="teal"
          hint="From the live CCTV dataset"
        />
        <StatTile label="Coverage zones" value={zones.length} hint="Surveillance polygons" />
        <StatTile
          label="Cases in view"
          value={`${coverage.covered}/${coverage.active}`}
          hint={`Active case within ${CAM_COVERAGE_M} m of a camera`}
        />
        <StatTile
          label="In blind spots"
          value={coverage.blind.length}
          accent="coral"
          hint="No camera within reach"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 card-canvas p-5">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="size-4 text-muted" />
            <h2 className="text-lg font-medium tracking-tight">Coverage map</h2>
          </div>
          <OpsMap
            className="aspect-[16/10] w-full"
            center={networkCenter}
            spanMeters={4000}
            showRings
            cameraPoints={cameras}
            zones={showZones ? zones : []}
            cases={reports
              .filter((r) => r.status !== 'REUNITED')
              .map((r) => ({
                id: r.id,
                lat: r.lastSeenLat,
                lng: r.lastSeenLng,
                label: r.person.name,
                radiusMeters: r.alertRadiusMeters,
              }))}
          />
          <div className="flex flex-wrap items-center gap-4 mt-4 text-[12px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-accent-teal" /> Camera
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full border border-accent-teal/50 bg-accent-teal/10" />{' '}
              Coverage zone
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-coral" /> Active case
            </span>
          </div>
        </section>

        <div className="space-y-6">
          {/* Blind-spot analysis */}
          <section className="card-dark p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="size-4 text-coral" />
              <p className="caption-upper text-on-dark-soft">Blind-spot alert</p>
            </div>
            {coverage.active === 0 ? (
              <p className="text-on-dark-soft text-[14px]">No active cases right now.</p>
            ) : coverage.blind.length === 0 ? (
              <p className="text-on-dark-soft text-[14px]">
                All active cases are within camera coverage.
              </p>
            ) : (
              <div className="space-y-2">
                {coverage.blind.map((r) => (
                  <div key={r.id} className="rounded-lg bg-surface-dark-elevated p-3">
                    <p className="text-on-dark text-[14px] font-medium">{r.person.name}</p>
                    <p className="text-on-dark-soft text-[13px]">{r.lastSeenLabel}</p>
                    <p className="text-coral text-[12px] mt-1 flex items-center gap-1">
                      <Route className="size-3" /> Deploy field team — expand alert radius 50%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Zone breakdown */}
          <section className="card-canvas p-5">
            <p className="caption-upper text-muted mb-3">Cameras by zone · top 10</p>
            <div className="space-y-2.5">
              {sectors.map(([zone, count]) => {
                const max = sectors[0]?.[1] ?? 1;
                return (
                  <div key={zone} className="flex items-center gap-3">
                    <span className="text-[13px] text-body w-14 shrink-0 font-mono">{zone}</span>
                    <div className="flex-1 h-2 rounded-full bg-surface-soft overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent-teal"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-[12px] text-muted w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
