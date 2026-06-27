import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Claude editorial surface card (see DESIGN.md → components.feature-card etc.).
 * `surface` picks the brand surface mode; the cream-to-dark contrast is the pacing.
 */
type Surface = "cream" | "canvas" | "dark" | "coral"

const surfaceMap: Record<Surface, string> = {
  cream: "bg-surface-card text-ink",
  canvas: "bg-canvas text-ink border border-hairline",
  dark: "bg-surface-dark text-on-dark",
  coral: "bg-coral text-on-primary",
}

export function Card({
  surface = "cream",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { surface?: Surface }) {
  return (
    <div
      data-slot="card"
      className={cn("rounded-xl p-6", surfaceMap[surface], className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("text-lg font-medium tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardLabel({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("caption-upper text-muted", className)} {...props}>
      {children}
    </div>
  )
}
