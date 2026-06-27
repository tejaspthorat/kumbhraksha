'use client';

import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { cn } from '@/lib/utils';

export type KpiAccent = 'orange' | 'blue' | 'green' | 'yellow' | 'red' | 'neutral';

const accentVar: Record<KpiAccent, string> = {
  orange: 'var(--accent-orange)',
  blue: 'var(--accent-blue)',
  green: 'var(--accent-green)',
  yellow: 'var(--accent-yellow)',
  red: 'var(--accent-red)',
  neutral: 'var(--muted)',
};

export type KpiTileProps = {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  /** Percent change vs previous window. Positive = up. */
  delta?: number;
  /** When true a rising delta is bad (e.g. incidents) and shown red. */
  invertDelta?: boolean;
  spark?: number[];
  accent?: KpiAccent;
  className?: string;
};

/**
 * KPI tile — icon, value, trend pill, and a mini sparkline. Hover lifts the tile
 * and reveals a faint accent glow. Mostly monochrome; the accent only tints the
 * icon, sparkline, and glow so dashboards stay calm (redesign.md → "95% mono").
 */
export function KpiTile({
  label,
  value,
  unit,
  icon: Icon,
  delta,
  invertDelta = false,
  spark,
  accent = 'neutral',
  className,
}: KpiTileProps) {
  const color = accentVar[accent];
  const hasDelta = typeof delta === 'number';
  const positive = (delta ?? 0) >= 0;
  const good = invertDelta ? !positive : positive;
  const TrendIcon = !hasDelta ? Minus : positive ? ArrowUpRight : ArrowDownRight;
  const trendColor = !hasDelta
    ? 'text-muted'
    : good
      ? 'text-accent-green'
      : 'text-accent-red';

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-hairline bg-surface-card p-4',
        'hover:border-hairline-strong transition-colors',
        className
      )}
    >
      {/* Accent glow on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: color }}
      />
      <div className="relative flex items-center justify-between">
        <span className="caption-upper text-[10px] text-muted-soft">{label}</span>
        {Icon && (
          <span className="grid place-items-center size-7 rounded-md border border-hairline bg-surface-soft" style={{ color }}>
            <Icon size={14} />
          </span>
        )}
      </div>

      <div className="relative mt-3 flex items-end justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="tnum text-2xl font-semibold tracking-tight text-ink">{value}</span>
            {unit && <span className="text-xs text-muted">{unit}</span>}
          </div>
          {hasDelta && (
            <div className={cn('mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium', trendColor)}>
              <TrendIcon size={12} />
              <span className="tnum">{Math.abs(delta).toFixed(1)}%</span>
            </div>
          )}
        </div>
        {spark && spark.length > 1 && (
          <Sparkline data={spark} color={color} width={84} height={32} className="opacity-90" />
        )}
      </div>
    </motion.div>
  );
}
