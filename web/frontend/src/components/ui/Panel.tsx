'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type Accent = 'orange' | 'blue' | 'green' | 'yellow' | 'red' | 'none';

const glowMap: Record<Accent, string> = {
  orange: 'glow-orange',
  blue: 'glow-blue',
  green: 'glow-green',
  yellow: 'glow-yellow',
  red: 'glow-red',
  none: '',
};

/**
 * Mission-command surface panel: hairline-framed, rounded-xl, optional accent
 * glow seated behind it, with a subtle fade-up entrance. The workhorse
 * container used across the dashboard and all new screens.
 */
export function Panel({
  className,
  children,
  accent = 'none',
  elevated = false,
  hover = false,
  ...props
}: HTMLMotionProps<'div'> & {
  accent?: Accent;
  elevated?: boolean;
  hover?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden panel',
        elevated && 'panel-elevated',
        hover && 'panel-glow transition-transform duration-200 hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {accent !== 'none' && (
        <div
          aria-hidden
          className={cn('pointer-events-none absolute inset-x-0 -top-24 h-48 opacity-60', glowMap[accent as Accent])}
        />
      )}
      <div className="relative">{children}</div>
    </motion.div>
  );
}

export function PanelHeader({
  title,
  subtitle,
  icon: Icon,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <span className="grid place-items-center size-8 rounded-lg border border-hairline bg-surface-soft text-muted shrink-0">
            <Icon size={15} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-heading text-[15px] font-semibold tracking-tight text-ink truncate">
            {title}
          </h2>
          {subtitle && <p className="text-[12px] text-muted truncate mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
