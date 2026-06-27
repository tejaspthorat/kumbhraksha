import clsx from 'clsx';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/12 text-emerald-700 border-emerald-600/25',
  warning: 'bg-amber-500/12 text-amber-700 border-amber-600/25',
  danger: 'bg-red-500/12 text-red-700 border-red-600/25',
  info: 'bg-accent-teal/12 text-accent-teal border-accent-teal/30',
  default: 'bg-coral/10 text-coral border-coral/25',
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