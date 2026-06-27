'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Clock, MapPin, Phone, ShieldAlert, Stethoscope, Users, X } from 'lucide-react';
import { krApi } from '@/lib/missing/client';
import { useMissingStream } from '@/lib/missing/useMissingStream';
import type { MissingReport, Sighting, MissingReportStatus } from '@/lib/missing/types';
import { STATUS_LABEL } from '@/lib/missing/types';
import { stageForLevel, withLiveCascade } from '@/lib/missing/cascade';
import {
  StatusBadge,
  CascadeBadge,
  PersonAvatar,
  PageHeading,
} from '@/components/missing/CaseUI';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { timeAgo, formatDistance } from '@/lib/geo';

type SortKey = 'recent' | 'age' | 'cascade';

type IncomingAlert = {
  id: string;
  name: string;
  age: number | null;
  label: string;
  source: string;
};

/** Short attention chime via WebAudio (no asset needed). */
function playChime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    /* audio not available */
  }
}

const PIPELINE: MissingReportStatus[] = [
  'REPORTED',
  'SEARCHING',
  'SIGHTING_RECEIVED',
  'VERIFICATION',
  'REUNITED',
];

export default function CommandCenterPage() {
  const [reports, setReports] = useState<MissingReport[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [sort, setSort] = useState<SortKey>('cascade');
  const [openId, setOpenId] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<IncomingAlert[]>([]);
  const [live, setLive] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    const [rs, ss] = await Promise.all([
      krApi.reports().catch(() => [] as MissingReport[]),
      krApi.sightings().catch(() => [] as Sighting[]),
    ]);
    setReports(rs.map(withLiveCascade));
    setSightings(ss);
    rs.forEach((r) => seenIds.current.add(r.id));
  }, []);

  const raiseAlert = useCallback((report: MissingReport & { source?: string }) => {
    if (seenIds.current.has(report.id)) return;
    seenIds.current.add(report.id);
    setReports((prev) =>
      prev.some((r) => r.id === report.id) ? prev : [withLiveCascade(report), ...prev],
    );
    setIncoming((prev) => [
      {
        id: report.id,
        name: report.person?.name ?? 'Unknown person',
        age: report.person?.age ?? null,
        label: report.lastSeenLabel ?? 'Location pending',
        source: report.source ?? 'mobile',
      },
      ...prev,
    ]);
    playChime();
  }, []);

  // Real-time stream from the backend (mobile reports arrive instantly).
  useMissingStream({
    onReport: raiseAlert,
    onSighting: () => load(),
    onStatus: setLive,
  });

  useEffect(() => {
    load();
    // Polling fallback in case the SSE stream is unavailable.
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  const openCase = useCallback((id: string) => {
    setOpenId(id);
    setIncoming((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setIncoming((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const sorted = useMemo(() => {
    const active = reports.filter((r) => r.status !== 'REUNITED');
    const arr = [...active];
    if (sort === 'recent') arr.sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt));
    if (sort === 'age') arr.sort((a, b) => (a.person.age ?? 99) - (b.person.age ?? 99));
    if (sort === 'cascade') arr.sort((a, b) => b.cascadeLevel - a.cascadeLevel);
    return arr;
  }, [reports, sort]);

  const open = reports.find((r) => r.id === openId) ?? null;
  const caseSightings = sightings.filter((s) => s.missingReportId === openId);

  async function changeStatus(id: string, status: MissingReportStatus) {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    await krApi.setStatus(id, status).catch(() => {});
    load();
  }

  return (
    <div className="max-w-[1280px] mx-auto">
      <IncomingAlertStack alerts={incoming} onOpen={openCase} onDismiss={dismissAlert} />

      <PageHeading eyebrow="Missing Persons" title="Command Center">
        <span
          className={
            'inline-flex items-center gap-1.5 mr-3 px-2.5 h-9 rounded-lg text-[12px] font-medium ' +
            (live
              ? 'bg-success/10 text-success'
              : 'bg-surface-soft text-muted')
          }
          title={live ? 'Live stream connected' : 'Reconnecting…'}
        >
          <span
            className={
              'size-2 rounded-full ' + (live ? 'bg-success animate-pulse' : 'bg-muted')
            }
          />
          {live ? 'Live' : 'Offline'}
        </span>
        <div className="inline-flex rounded-lg border border-hairline overflow-hidden">
          {(
            [
              ['cascade', 'Cascade'],
              ['age', 'Children first'],
              ['recent', 'Most recent'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={
                'px-3 h-9 text-[13px] font-medium transition-colors ' +
                (sort === k ? 'bg-surface-cream-strong text-ink' : 'text-muted hover:bg-surface-soft')
              }
            >
              {label}
            </button>
          ))}
        </div>
      </PageHeading>

      {/* Pipeline summary */}
      <div className="card-canvas p-4 mb-6 flex flex-wrap items-center gap-x-2 gap-y-3">
        {PIPELINE.map((s, i) => {
          const count = reports.filter((r) => r.status === s).length;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-soft">
                <span className="font-display text-xl leading-none">{count}</span>
                <span className="text-[12px] text-muted">{STATUS_LABEL[s]}</span>
              </div>
              {i < PIPELINE.length - 1 && <span className="text-hairline">→</span>}
            </div>
          );
        })}
      </div>

      {/* Case table */}
      <div className="card-canvas overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.6fr_1.2fr_1fr_1fr_0.8fr] gap-4 px-5 py-3 hairline-b caption-upper text-muted-soft">
          <span>Person</span>
          <span>Last seen</span>
          <span>Status</span>
          <span>Cascade</span>
          <span className="text-right">Reach</span>
        </div>
        <div className="divide-y divide-[var(--hairline-soft)]">
          {sorted.map((r) => (
            <button
              key={r.id}
              onClick={() => setOpenId(r.id)}
              className="w-full text-left grid grid-cols-1 md:grid-cols-[1.6fr_1.2fr_1fr_1fr_0.8fr] gap-2 md:gap-4 px-5 py-3.5 hover:bg-surface-soft transition-colors items-center"
            >
              <div className="flex items-center gap-3">
                <PersonAvatar report={r} size="sm" />
                <div className="min-w-0">
                  <p className="font-medium text-ink truncate">
                    {r.person.name}
                    {r.person.age != null && (
                      <span className="text-muted font-normal"> · {r.person.age}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {(r.person.age ?? 99) < 12 && <Badge variant="danger">Child</Badge>}
                    {r.person.medicalNotes && (
                      <span className="inline-flex items-center gap-1 text-[12px] text-warning">
                        <Stethoscope className="size-3" /> Medical
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-[13px] text-muted">
                <p className="flex items-center gap-1 truncate">
                  <MapPin className="size-3 shrink-0" /> {r.lastSeenLabel ?? 'Unknown'}
                </p>
                <p className="flex items-center gap-1 mt-0.5 text-muted-soft">
                  <Clock className="size-3 shrink-0" /> {timeAgo(r.lastSeenTime)}
                </p>
              </div>
              <div><StatusBadge status={r.status} /></div>
              <div><CascadeBadge level={r.cascadeLevel} /></div>
              <div className="text-right">
                <p className="font-mono text-[13px] text-ink">
                  {(r.usersNotified ?? 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[12px] text-muted-soft">{formatDistance(r.alertRadiusMeters)} radius</p>
              </div>
            </button>
          ))}
          {sorted.length === 0 && (
            <p className="text-[13px] text-muted py-12 text-center">No active cases.</p>
          )}
        </div>
      </div>

      {open && (
        <CaseDrawer
          report={open}
          sightings={caseSightings}
          onClose={() => setOpenId(null)}
          onStatus={changeStatus}
        />
      )}
    </div>
  );
}

function CaseDrawer({
  report,
  sightings,
  onClose,
  onStatus,
}: {
  report: MissingReport;
  sightings: Sighting[];
  onClose: () => void;
  onStatus: (id: string, s: MissingReportStatus) => void;
}) {
  const stage = stageForLevel(report.cascadeLevel);
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/25" onClick={onClose} />
      <aside className="relative w-full max-w-md h-full bg-canvas border-l border-hairline overflow-y-auto scrollbar-thin animate-slide-up">
        <div className="sticky top-0 bg-canvas/90 backdrop-blur-md hairline-b px-5 h-16 flex items-center justify-between">
          <p className="caption-upper text-muted">Case {report.id}</p>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-soft" aria-label="Close">
            <X className="size-5 text-muted" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Identity */}
          <div className="flex items-start gap-4">
            <PersonAvatar report={report} size="lg" />
            <div>
              <h2 className="display-sm">{report.person.name}</h2>
              <p className="text-[13px] text-muted mt-1">
                {report.person.age != null ? `${report.person.age} yrs` : 'Age unknown'} ·{' '}
                {report.person.gender.toLowerCase()}
              </p>
              <div className="mt-2"><StatusBadge status={report.status} /></div>
            </div>
          </div>

          {/* Description & clothing */}
          <dl className="space-y-3">
            {report.person.clothing && (
              <Row label="Wearing" value={report.person.clothing} />
            )}
            {report.person.description && (
              <Row label="Description" value={report.person.description} />
            )}
            {report.person.medicalNotes && (
              <Row
                label="Medical"
                value={report.person.medicalNotes}
                icon={<Stethoscope className="size-3.5 text-warning" />}
              />
            )}
            <Row
              label="Last seen"
              value={`${report.lastSeenLabel ?? 'Unknown'} · ${timeAgo(report.lastSeenTime)}`}
              icon={<MapPin className="size-3.5 text-coral" />}
            />
            <Row
              label="Reporter"
              value={`${report.reporterName ?? '—'}${report.relationship ? ` (${report.relationship})` : ''}`}
              icon={<Users className="size-3.5 text-muted" />}
            />
            {report.reporterPhone && (
              <Row label="Contact" value={report.reporterPhone} icon={<Phone className="size-3.5 text-muted" />} />
            )}
          </dl>

          {/* Cascade */}
          <div className="card-dark p-4">
            <div className="flex items-center justify-between">
              <p className="caption-upper text-on-dark-soft">Alert cascade</p>
              <span className="font-mono text-[12px] text-on-dark-soft">
                L{report.cascadeLevel} · {formatDistance(report.alertRadiusMeters)}
              </span>
            </div>
            <p className="text-on-dark mt-2 text-[15px]">{stage.label}</p>
            <p className="text-on-dark-soft text-[13px] mt-1">{stage.detail}</p>
            <p className="text-on-dark-soft text-[13px] mt-3">
              <span className="text-on-dark font-medium">
                {(report.usersNotified ?? 0).toLocaleString('en-IN')}
              </span>{' '}
              phones notified
            </p>
          </div>

          {/* Sightings */}
          <div>
            <p className="caption-upper text-muted mb-2">
              Linked sightings · {sightings.length}
            </p>
            <div className="space-y-2">
              {sightings.length === 0 && (
                <p className="text-[13px] text-muted-soft">No sightings linked yet.</p>
              )}
              {sightings.map((s) => (
                <div key={s.id} className="card-cream p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-body">{s.spotterName}</span>
                    {s.aiMatchConfidence != null && (
                      <Badge variant="info">{Math.round(s.aiMatchConfidence * 100)}% match</Badge>
                    )}
                  </div>
                  {s.description && <p className="text-[13px] text-muted mt-1">{s.description}</p>}
                  <p className="text-[12px] text-muted-soft mt-1">{timeAgo(s.spottedAt)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <p className="caption-upper text-muted mb-1">Advance status</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" onClick={() => onStatus(report.id, 'SEARCHING')}>
                Searching
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onStatus(report.id, 'VERIFICATION')}>
                Verify sighting
              </Button>
              <Button size="sm" onClick={() => onStatus(report.id, 'REUNITED')}>
                Mark reunited
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onStatus(report.id, 'ESCALATED')}>
                <ShieldAlert className="size-4" /> Escalate
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function IncomingAlertStack({
  alerts,
  onOpen,
  onDismiss,
}: {
  alerts: IncomingAlert[];
  onOpen: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  if (alerts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)]">
      {alerts.slice(0, 4).map((a) => (
        <div
          key={a.id}
          className="card-canvas border-l-4 border-coral shadow-lg p-4 animate-slide-up"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 size-9 rounded-full bg-coral/15 flex items-center justify-center">
              <Bell className="size-4 text-coral" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="caption-upper text-coral">New missing person · {a.source}</p>
              <p className="font-medium text-ink truncate">
                {a.name}
                {a.age != null && <span className="text-muted font-normal"> · {a.age}</span>}
              </p>
              <p className="text-[12px] text-muted-soft flex items-center gap-1 mt-0.5">
                <MapPin className="size-3 shrink-0" /> {a.label}
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <Button size="sm" onClick={() => onOpen(a.id)}>
                  Open case
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onDismiss(a.id)}>
                  Dismiss
                </Button>
              </div>
            </div>
            <button
              onClick={() => onDismiss(a.id)}
              className="p-1 rounded-md hover:bg-surface-soft"
              aria-label="Dismiss"
            >
              <X className="size-4 text-muted" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <dt className="caption-upper text-muted-soft mb-0.5 flex items-center gap-1.5">
        {icon} {label}
      </dt>
      <dd className="text-[14px] text-body">{value}</dd>
    </div>
  );
}
