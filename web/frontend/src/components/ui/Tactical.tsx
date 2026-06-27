'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Pulsing status dot. */
export function StatusDot({
  tone = 'green',
  className,
}: {
  tone?: 'green' | 'orange' | 'red' | 'blue' | 'yellow' | 'muted';
  className?: string;
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-accent-green',
    orange: 'bg-accent-orange',
    red: 'bg-accent-red',
    blue: 'bg-accent-blue',
    yellow: 'bg-accent-yellow',
    muted: 'bg-muted',
  };
  const c = colorMap[tone];
  return (
    <span className={cn('relative flex size-2', className)}>
      <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-60 animate-[pulse-soft_2s_ease-in-out_infinite]', c)} />
      <span className={cn('relative inline-flex size-2 rounded-full', c)} />
    </span>
  );
}

/** Editorial mission-command page header — eyebrow, serif title, optional aside. */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}
    >
      <div className="min-w-0">
        {eyebrow && <p className="caption-upper text-[11px] text-coral mb-2">{eyebrow}</p>}
        <h1 className="display-md text-ink">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[14px] text-muted">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </motion.header>
  );
}

/** Small pill used for live/AI/network state in headers. */
export function StatePill({
  tone = 'green',
  label,
  icon: Icon,
  className,
}: {
  tone?: 'green' | 'orange' | 'red' | 'blue' | 'yellow' | 'muted';
  label: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface-soft px-3 h-9 text-[12px] font-medium text-body',
        className
      )}
    >
      {Icon ? <Icon size={14} className="text-muted" /> : <StatusDot tone={tone} />}
      {label}
    </span>
  );
}

/** Severity tag (monochrome chip with a coloured priority strip). */
export function SeverityTag({
  level,
  className,
}: {
  level: 'critical' | 'high' | 'medium' | 'low' | 'info';
  className?: string;
}) {
  const map = {
    critical: { c: 'text-accent-red', dot: 'bg-accent-red', label: 'Critical' },
    high: { c: 'text-accent-orange', dot: 'bg-accent-orange', label: 'High' },
    medium: { c: 'text-accent-yellow', dot: 'bg-accent-yellow', label: 'Medium' },
    low: { c: 'text-accent-blue', dot: 'bg-accent-blue', label: 'Low' },
    info: { c: 'text-muted', dot: 'bg-muted', label: 'Info' },
  }[level];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface-soft px-2 h-6 text-[11px] font-medium',
        map.c,
        className
      )}
    >
      <span className={cn('size-1.5 rounded-full', map.dot)} />
      {map.label}
    </span>
  );
}
