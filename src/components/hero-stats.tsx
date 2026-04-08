"use client"

import { NumberTicker } from "@/components/ui/number-ticker"
import { cn } from "@/lib/utils"

interface HeroStatsProps {
  className?: string
}

export function HeroStats({ className }: HeroStatsProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-16 flex-wrap sm:gap-8",
        className
      )}
    >
      {/* Stat 1: Vetted Members */}
      <div className="text-center">
        <NumberTicker
          value={50}
          className="font-serif text-4xl font-bold text-[#C9A84C]"
        />
        <p className="text-[9px] tracking-[4px] text-[rgba(245,245,240,0.3)] mt-1">
          VETTED MEMBERS
        </p>
      </div>

      {/* Stat 2: Private Events */}
      <div className="text-center">
        <NumberTicker
          value={30}
          className="font-serif text-4xl font-bold text-[#C9A84C]"
        />
        <p className="text-[9px] tracking-[4px] text-[rgba(245,245,240,0.3)] mt-1">
          PRIVATE EVENTS
        </p>
      </div>

      {/* Stat 3: Established */}
      <div className="text-center">
        <span className="font-serif text-4xl font-bold text-[#C9A84C]">
          EST. 2025
        </span>
        <p className="text-[9px] tracking-[4px] text-[rgba(245,245,240,0.3)] mt-1">
          MIAMI, FL
        </p>
      </div>
    </div>
  )
}
