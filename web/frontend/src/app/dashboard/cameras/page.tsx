'use client';

import { useEffect, useMemo, useState } from 'react';
import { Camera, ShieldAlert, Route, Eye } from 'lucide-react';
import { krApi } from '@/lib/missing/client';
import type { CctvLocation, MissingReport } from '@/lib/missing/types';
import { NETWORK_CENTER as networkCenter, withLiveCascade } from '@/lib/missing/cascade';
import TacticalMap from '@/components/missing/TacticalMap';
import { PageHeading, StatTile } from '@/components/missing/CaseUI';
import { distanceMeters } from '@/lib/geo';

export default function CctvIntelligencePage() {
  const [cctv, setCctv] = useState<CctvLocation[]>([]);
  const [reports, setReports] = useState<MissingReport[]>([]);
  const [showCoverage, setShowCoverage] = useState(true);

  useEffect(() => {
    krApi.cctv().then(setCctv).catch(() => {});
    krApi.reports().then((r) => setReports(r.map(withLiveCascade))).catch(() => {});
  }, []);

  // Which active cases fall inside a camera's coverage vs. a blind spot.
  const coverage = useMemo(() => {
    const active = reports.filter((r) => r.status !== 'REUNITED');
    let covered = 0;
    const blind: MissingReport[] = [];
    for (const r of active) {
      const inView = cctv.some(
        (c) =>
          distanceMeters(
            { lat: r.lastSeenLat, lng: r.lastSeenLng },
            { lat: c.lat, lng: c.lng }
          ) <= (c.coverageRadius ?? 50)
      );
      if (inView) covered++;
      else blind.push(r);
    }
    return { covered, blind, active: active.length };
  }, [cctv, reports]);

  const sectors = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cctv) map.set(c.sector ?? 'Unknown', (map.get(c.sector ?? 'Unknown') ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [cctv]);

  return (
    <div className="max-w-[1280px] mx-auto">
      <PageHeading eyebrow="Coverage Intelligence" title="CCTV Intelligence">
        <button
          onClick={() => setShowCoverage((v) => !v)}
          className={
            'inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-[13px] font-medium transition-colors ' +
            (showCoverage ? 'bg-surface-cream-strong text-ink' : 'text-muted hover:bg-surface-soft')
          }
        >
          <Eye className="size-3.5" /> Coverage zones
        </button>
      </PageHeading>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Cameras mapped" value={cctv.length} accent="teal" hint="From CCTV dataset" />
        <StatTile label="Sectors" value={sectors.length} hint="With camera coverage" />
        <StatTile
          label="Cases in view"
          value={`${coverage.covered}/${coverage.active}`}
          hint="Active cases near a camera"
        />
        <StatTile
          label="In blind spots"
          value={coverage.blind.length}
          accent="coral"
          hint="No camera coverage"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 card-canvas p-5">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="size-4 text-muted" />
            <h2 className="text-lg font-medium tracking-tight">Coverage map</h2>
          </div>
          <TacticalMap
            className="aspect-[16/10] w-full"
            center={networkCenter}
            spanMeters={4000}
            showCoverage={showCoverage}
            showRings
            cctv={cctv}
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
              <span className="size-2.5 rounded-full bg-surface-dark/60" /> Camera
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
            {coverage.blind.length === 0 ? (
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

          {/* Sector breakdown */}
          <section className="card-canvas p-5">
            <p className="caption-upper text-muted mb-3">Cameras by sector</p>
            <div className="space-y-2.5">
              {sectors.map(([sector, count]) => {
                const max = sectors[0]?.[1] ?? 1;
                return (
                  <div key={sector} className="flex items-center gap-3">
                    <span className="text-[13px] text-body w-20 shrink-0">{sector}</span>
                    <div className="flex-1 h-2 rounded-full bg-surface-soft overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent-teal"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-[12px] text-muted w-6 text-right">{count}</span>
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
