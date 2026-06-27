import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Claude editorial badge (see DESIGN.md → components.badge-*).
 * `pill` is the neutral cream tag; `coral` is the uppercase NEW/featured badge.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full px-3 py-1 text-[13px] font-medium whitespace-nowrap transition-colors [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-surface-card text-ink",
        pill: "bg-surface-card text-ink",
        coral: "bg-coral text-on-primary text-[12px] tracking-[0.12em] uppercase",
        outline: "border border-hairline text-body",
        success: "bg-success/12 text-success",
        warning: "bg-warning/12 text-[#9a7510]",
        danger: "bg-error/12 text-error",
        info: "bg-accent-teal/15 text-[#3c8d7e]",
        dark: "bg-surface-dark text-on-dark",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
