"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  label?: string
  id?: string
  min?: number
  max?: number
  className?: string
  step?: number
}

export function NumberInput({
  value,
  onChange,
  label,
  id,
  min = 0,
  max,
  className,
  step = 1,
}: NumberInputProps) {
  const inputId = id || React.useId()

  const handleDecrement = () => {
    const newValue = value - step
    if (min !== undefined && newValue < min) return
    onChange(newValue)
  }

  const handleIncrement = () => {
    const newValue = value + step
    if (max !== undefined && newValue > max) return
    onChange(newValue)
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={inputId} className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
          {label}
        </Label>
      )}
      <div className="flex items-center gap-1 group">
        <Button
          onClick={handleDecrement}
          size="icon"
          type="button"
          variant="outline"
          className="h-7 w-7 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white shrink-0"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          id={inputId}
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="h-7 text-center bg-white/5 border-white/10 focus-visible:ring-accent/50 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <Button
          onClick={handleIncrement}
          size="icon"
          type="button"
          variant="outline"
          className="h-7 w-7 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white shrink-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
