'use client';

import { useEffect, useState } from 'react';
import { Radio, MessageSquare, Megaphone, ChevronRight } from 'lucide-react';
import { krApi } from '@/lib/missing/client';
import type { MissingReport } from '@/lib/missing/types';
import { CASCADE_STAGES, stageForLevel, withLiveCascade } from '@/lib/missing/cascade';
import { PageHeading, PersonAvatar, StatusBadge } from '@/components/missing/CaseUI';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { formatDistance, timeAgo } from '@/lib/geo';

export default function AlertCascadePage() {
  const [reports, setReports] = useState<MissingReport[]>([]);

  async function load() {
    const rs = await krApi.reports().catch(() => [] as MissingReport[]);
    setReports(rs.map(withLiveCascade).filter((r) => r.status !== 'REUNITED'));
  }
  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  async function accelerate(r: MissingReport) {
    const next = Math.min(r.cascadeLevel + 1, CASCADE_STAGES.length - 1);
    setReports((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? { ...x, cascadeLevel: next, alertRadiusMeters: stageForLevel(next).radiusMeters }
          : x
      )
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto">
      <PageHeading eyebrow="Broadcast Controls" title="Alert Cascade" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Active cascades */}
        <section className="space-y-4">
          {reports.map((r) => {
            const stage = stageForLevel(r.cascadeLevel);
            return (
              <div key={r.id} className="card-canvas p-5">
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
                    <p className="text-[13px] text-muted">{r.lastSeenLabel} · {timeAgo(r.reportedAt)}</p>
                  </div>
                </div>

                {/* Cascade progress */}
                <div className="mt-4 flex items-center gap-1">
                  {CASCADE_STAGES.map((s) => (
                    <div
                      key={s.level}
                      className={
                        'flex-1 h-1.5 rounded-full ' +
                        (s.level <= r.cascadeLevel ? 'bg-coral' : 'bg-hairline')
                      }
                      title={`${s.label} · ${formatDistance(s.radiusMeters)}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-[14px] text-ink font-medium">{stage.label}</p>
                    <p className="text-[13px] text-muted">{stage.detail}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-[13px] text-ink">{formatDistance(r.alertRadiusMeters)}</p>
                    <p className="text-[12px] text-muted-soft">
                      {(r.usersNotified ?? 0).toLocaleString('en-IN')} notified
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 pt-4 hairline-t">
                  <Button size="sm" onClick={() => accelerate(r)}>
                    <ChevronRight className="size-4" /> Advance cascade
                  </Button>
                  <Button variant="secondary" size="sm">
                    <MessageSquare className="size-4" /> SMS blast
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Megaphone className="size-4" /> PA announce
                  </Button>
                </div>
              </div>
            );
          })}
          {reports.length === 0 && (
            <div className="card-canvas p-12 text-center text-muted">No active cascades.</div>
          )}
        </section>

        {/* Cascade reference */}
        <aside className="card-dark p-5 h-fit sticky top-6">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="size-4 text-coral" />
            <p className="caption-upper text-on-dark-soft">Cascade timeline</p>
          </div>
          <ol className="space-y-4">
            {CASCADE_STAGES.map((s) => (
              <li key={s.level} className="relative pl-6">
                <span className="absolute left-0 top-1 size-3 rounded-full bg-coral ring-4 ring-surface-dark" />
                <div className="flex items-center justify-between">
                  <p className="text-on-dark text-[14px] font-medium">
                    +{s.atMinutes} min · {s.label}
                  </p>
                  <Badge variant="dark" className="border border-hairline text-on-dark-soft">
                    {formatDistance(s.radiusMeters)}
                  </Badge>
                </div>
                <p className="text-on-dark-soft text-[13px] mt-1">{s.detail}</p>
              </li>
            ))}
          </ol>
          <p className="text-on-dark-soft text-[12px] mt-5 pt-4 border-t border-hairline">
            Automatic but overridable — authorities can accelerate (missing toddler) or
            hold (teenager likely exploring).
          </p>
        </aside>
      </div>
    </div>
  );
}
