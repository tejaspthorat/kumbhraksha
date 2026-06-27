import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-hairline bg-canvas px-3.5 py-2 text-sm text-ink transition-colors outline-none",
        "placeholder:text-muted-soft",
        "focus-visible:border-coral focus-visible:ring-[3px] focus-visible:ring-coral/15",
        "disabled:pointer-events-none disabled:opacity-50",
        "aria-invalid:border-error aria-invalid:ring-[3px] aria-invalid:ring-error/15",
        className
      )}
      {...props}
    />
  )
}

export { Input }
