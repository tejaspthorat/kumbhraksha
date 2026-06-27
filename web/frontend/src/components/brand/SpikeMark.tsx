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
      {/* Central leaf / Coconut flame */}
      <path d="M50 5 C50 5 56 20 56 28 C56 32 53 35 50 35 C47 35 44 32 44 28 C44 20 50 5 50 5 Z" />
      {/* Left leaf */}
      <path d="M40 38 C26 38 18 24 18 24 C18 24 30 28 40 34 Z" />
      {/* Right leaf */}
      <path d="M60 38 C74 38 82 24 82 24 C82 24 70 28 60 34 Z" />
      {/* Kalash body */}
      <path d="M32 45 C32 42 68 42 68 45 C68 48 64 50 64 54 C64 74 80 72 50 95 C20 72 36 74 36 54 C36 50 32 48 32 45 Z" />
    </svg>
  );
}

/**
 * Spike mark + "KumbhRaksha" wordmark lockup — the single source of truth for
 * the brand wordmark. Use this everywhere the name appears as a logotype so the
 * font styling stays consistent across pages.
 */
export function Wordmark({
  className,
  markClassName,
  labelClassName,
  label = "KumbhRaksha",
}: {
  className?: string;
  markClassName?: string;
  labelClassName?: string;
  label?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <SpikeMark className={cn("size-5 text-coral", markClassName)} />
      <span
        className={cn(
          "font-heading text-xl font-bold text-ink leading-none",
          labelClassName
        )}
      >
        {label}
      </span>
    </span>
  );
}
