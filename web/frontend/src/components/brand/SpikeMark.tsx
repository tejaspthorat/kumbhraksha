import { cn } from "@/lib/utils";

/**
 * The Anthropic-style radial spike glyph used as the KumbhRaksha wordmark prefix.
 * Rendered as inline SVG so it inherits `currentColor` (see DESIGN.md → Known Gaps).
 */
export function SpikeMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={cn("inline-block", className)}
      fill="currentColor"
    >
      <rect x="46" y="3" width="8" height="94" rx="4" />
      <rect x="46" y="3" width="8" height="94" rx="4" transform="rotate(45 50 50)" />
      <rect x="46" y="3" width="8" height="94" rx="4" transform="rotate(90 50 50)" />
      <rect x="46" y="3" width="8" height="94" rx="4" transform="rotate(135 50 50)" />
    </svg>
  );
}

/** Spike mark + "KumbhRaksha" wordmark lockup. */
export function Wordmark({
  className,
  markClassName,
  label = "KumbhRaksha",
}: {
  className?: string;
  markClassName?: string;
  label?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <SpikeMark className={cn("size-5 text-coral", markClassName)} />
      <span className="font-display text-[1.35rem] leading-none tracking-tight">
        {label}
      </span>
    </span>
  );
}
