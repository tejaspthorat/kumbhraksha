'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ImageOff, MapPin, Sparkles, X } from 'lucide-react';
import { krApi } from '@/lib/missing/client';
import type { MissingReport, Sighting } from '@/lib/missing/types';
import { withLiveCascade } from '@/lib/missing/cascade';
import { PageHeading, PersonAvatar } from '@/components/missing/CaseUI';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { distanceMeters, formatDistance, timeAgo } from '@/lib/geo';

export default function SightingTriagePage() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [reports, setReports] = useState<MissingReport[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  async function load() {
    const [ss, rs] = await Promise.all([
      krApi.sightings(true).catch(() => [] as Sighting[]),
      krApi.reports().catch(() => [] as MissingReport[]),
    ]);
    setSightings(ss.filter((s) => s.status === 'PENDING'));
    setReports(rs.map(withLiveCascade).filter((r) => r.status !== 'REUNITED'));
    setActiveId((prev) => prev ?? ss[0]?.id ?? null);
  }
  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, []);

  const active = sightings.find((s) => s.id === activeId) ?? sightings[0] ?? null;

  // AI-assisted candidate matching: rank open cases by proximity (proxy for the
  // photo-matching service described in main_plan).
  const candidates = useMemo(() => {
    if (!active) return [];
    return reports
      .map((r) => {
        const dist = distanceMeters(
          { lat: active.lat, lng: active.lng },
          { lat: r.lastSeenLat, lng: r.lastSeenLng }
        );
        const proximityScore = Math.max(0, 1 - dist / 3000);
        const base = active.aiMatchConfidence ?? 0.5;
        const confidence = Math.min(0.98, 0.5 * base + 0.5 * proximityScore + 0.15);
        return { report: r, dist, confidence };
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }, [active, reports]);

  async function triage(action: 'match' | 'dismiss' | 'new', reportId?: string) {
    if (!active) return;
    setSightings((prev) => prev.filter((s) => s.id !== active.id));
    setActiveId(null);
    await krApi.triage(active.id, action, reportId).catch(() => {});
    load();
  }

  return (
    <div className="max-w-[1280px] mx-auto">
      <PageHeading eyebrow="Flow B · Proactive" title="Sighting Triage">
        <Badge variant="outline" className="font-mono">
          {sightings.length} pending
        </Badge>
      </PageHeading>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Queue */}
        <aside className="card-canvas p-3 h-fit">
          <p className="caption-upper text-muted px-2 mb-2">Incoming queue</p>
          <div className="space-y-1.5 max-h-[640px] overflow-y-auto scrollbar-thin">
            {sightings.length === 0 && (
              <p className="text-[13px] text-muted py-10 text-center">Queue clear 🎉</p>
            )}
            {sightings.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={
                  'w-full text-left rounded-lg p-3 border transition-colors ' +
                  (active?.id === s.id
                    ? 'border-coral/40 bg-coral/5'
                    : 'border-hairline hover:bg-surface-soft')
                }
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-ink">{s.spotterName}</span>
                  <span className="text-[12px] text-muted-soft">{timeAgo(s.spottedAt)}</span>
                </div>
                {s.description && (
                  <p className="text-[13px] text-muted mt-1 line-clamp-2">{s.description}</p>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Comparison workspace */}
        {active ? (
          <section className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* The sighting */}
              <div className="card-canvas p-5">
                <p className="caption-upper text-accent-amber mb-3">The sighting</p>
                <PhotoFrame url={active.photoUrl} tone="amber" />
                <p className="text-[14px] text-body mt-3">{active.description ?? 'No description provided.'}</p>
                <p className="text-[13px] text-muted mt-2 flex items-center gap-1">
                  <MapPin className="size-3.5" /> {active.lat.toFixed(4)}, {active.lng.toFixed(4)} ·{' '}
                  {timeAgo(active.spottedAt)}
                </p>
              </div>

              {/* Best candidate */}
              <div className="card-canvas p-5">
                <p className="caption-upper text-coral mb-3">Best match</p>
                {candidates[0] ? (
                  <>
                    <div className="flex items-center gap-3">
                      <PersonAvatar report={candidates[0].report} />
                      <div>
                        <p className="font-medium text-ink">{candidates[0].report.person.name}</p>
                        <p className="text-[13px] text-muted">
                          {candidates[0].report.person.clothing ?? '—'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Sparkles className="size-4 text-coral" />
                      <span className="font-display text-2xl leading-none">
                        {Math.round(candidates[0].confidence * 100)}%
                      </span>
                      <span className="text-[13px] text-muted">
                        likely · {formatDistance(candidates[0].dist)} from last seen
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-[13px] text-muted">No open cases to match against.</p>
                )}
              </div>
            </div>

            {/* Candidate list + decisions */}
            <div className="card-canvas p-5">
              <p className="caption-upper text-muted mb-3">Candidate cases</p>
              <div className="space-y-2">
                {candidates.map((c) => (
                  <div
                    key={c.report.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-hairline"
                  >
                    <PersonAvatar report={c.report} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink truncate">
                        {c.report.person.name}
                        {c.report.person.age != null && (
                          <span className="text-muted font-normal"> · {c.report.person.age}</span>
                        )}
                      </p>
                      <p className="text-[12px] text-muted">{c.report.lastSeenLabel}</p>
                    </div>
                    <Badge variant="info">{Math.round(c.confidence * 100)}%</Badge>
                    <Button size="sm" onClick={() => triage('match', c.report.id)}>
                      <Check className="size-4" /> Match
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mt-5 pt-5 hairline-t">
                <Button variant="secondary" onClick={() => triage('new')}>
                  Create new case
                </Button>
                <Button variant="destructive" onClick={() => triage('dismiss')}>
                  <X className="size-4" /> Dismiss
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <section className="card-canvas p-12 grid place-items-center text-center">
            <div>
              <div className="size-12 rounded-full bg-success/12 grid place-items-center mx-auto mb-3">
                <Check className="size-6 text-success" />
              </div>
              <h2 className="display-sm">Triage queue is clear</h2>
              <p className="text-[14px] text-muted mt-1">
                New sightings will appear here for review.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function PhotoFrame({ url, tone }: { url?: string | null; tone: 'amber' | 'coral' }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="sighting" className="w-full aspect-video object-cover rounded-lg" />;
  }
  return (
    <div
      className={
        'w-full aspect-video rounded-lg grid place-items-center bg-surface-soft border border-dashed ' +
        (tone === 'amber' ? 'border-accent-amber/40' : 'border-coral/40')
      }
    >
      <div className="text-center text-muted-soft">
        <ImageOff className="size-6 mx-auto mb-1" />
        <p className="text-[12px]">No photo attached</p>
      </div>
    </div>
  );
}
