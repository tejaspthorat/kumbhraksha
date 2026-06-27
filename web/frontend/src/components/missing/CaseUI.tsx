'use client';

import clsx from 'clsx';
import { User } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { STATUS_LABEL, type MissingReportStatus, type MissingReport } from '@/lib/missing/types';
import { stageForLevel } from '@/lib/missing/cascade';

const statusVariant: Record<MissingReportStatus, 'danger' | 'warning' | 'info' | 'success' | 'pill'> = {
  REPORTED: 'danger',
  SEARCHING: 'warning',
  SIGHTING_RECEIVED: 'info',
  VERIFICATION: 'info',
  ESCALATED: 'danger',
  REUNITED: 'success',
};

export function StatusBadge({ status }: { status: MissingReportStatus }) {
  return <Badge variant={statusVariant[status]}>{STATUS_LABEL[status]}</Badge>;
}

export function CascadeBadge({ level }: { level: number }) {
  const stage = stageForLevel(level);
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted font-mono">
      <span className="size-1.5 rounded-full bg-coral" />
      L{level} · {stage.label}
    </span>
  );
}

/** Photo avatar placeholder (no real uploads in the demo dataset). */
export function PersonAvatar({
  report,
  size = 'md',
}: {
  report: MissingReport;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim = size === 'lg' ? 'size-16' : size === 'sm' ? 'size-10' : 'size-12';
  if (report.person.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={report.person.photoUrl}
        alt={report.person.name}
        className={clsx(dim, 'rounded-lg object-cover')}
      />
    );
  }
  return (
    <div
      className={clsx(
        dim,
        'rounded-lg grid place-items-center shrink-0',
        (report.person.age ?? 99) < 12 ? 'bg-coral/12 text-coral' : 'bg-surface-cream-strong text-muted'
      )}
    >
      <User className="size-1/2" />
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: 'coral' | 'teal' | 'ink';
}) {
  return (
    <div className="card-canvas p-5">
      <p className="caption-upper text-muted-soft">{label}</p>
      <p
        className={clsx(
          'font-display mt-2 leading-none',
          'text-[2.2rem]',
          accent === 'coral' && 'text-coral',
          accent === 'teal' && 'text-[#3c8d7e]'
        )}
      >
        {value}
      </p>
      {hint && <p className="text-[13px] text-muted mt-2">{hint}</p>}
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && <p className="caption-upper text-coral mb-2">{eyebrow}</p>}
        <h1 className="display-md">{title}</h1>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
