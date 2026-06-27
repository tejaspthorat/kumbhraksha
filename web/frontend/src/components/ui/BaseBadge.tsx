import clsx from 'clsx';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  danger: 'bg-red-500/15 text-red-400 border-red-500/25',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  default: 'bg-accent/10 text-accent border-accent/20',
};

export default function BaseBadge({ children, variant = 'default', pulse = false, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border',
        variantStyles[variant],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={clsx(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            variant === 'success' && 'bg-emerald-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'danger' && 'bg-red-400',
            variant === 'info' && 'bg-blue-400',
            variant === 'default' && 'bg-accent',
          )} />
          <span className={clsx(
            'relative inline-flex rounded-full h-2 w-2',
            variant === 'success' && 'bg-emerald-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'danger' && 'bg-red-400',
            variant === 'info' && 'bg-blue-400',
            variant === 'default' && 'bg-accent',
          )} />
        </span>
      )}
      {children}
    </span>
  );
}