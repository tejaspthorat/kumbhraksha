import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-lg border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-ink transition-colors outline-none",
        "placeholder:text-muted-soft",
        "focus-visible:border-coral focus-visible:ring-[3px] focus-visible:ring-coral/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-error aria-invalid:ring-[3px] aria-invalid:ring-error/15",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
