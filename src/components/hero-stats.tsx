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
      {/* Stat 1: Private Events */}
      <div className="text-center">
        <NumberTicker
          value={50}
          className="font-serif text-4xl font-bold text-[#C9A84C]"
        />
        <span className="font-serif text-4xl font-bold text-[#C9A84C]">+</span>
        <p className="text-[9px] tracking-[4px] text-[rgba(245,245,240,0.3)] mt-1">
          PRIVATE EVENTS
        </p>
      </div>

      {/* Stat 2: Trusted Partners */}
      <div className="text-center">
        <NumberTicker
          value={30}
          className="font-serif text-4xl font-bold text-[#C9A84C]"
        />
        <span className="font-serif text-4xl font-bold text-[#C9A84C]">+</span>
        <p className="text-[9px] tracking-[4px] text-[rgba(245,245,240,0.3)] mt-1">
          TRUSTED PARTNERS
        </p>
      </div>

      {/* Stat 3: Vetted Members */}
      <div className="text-center">
        <NumberTicker
          value={200}
          className="font-serif text-4xl font-bold text-[#C9A84C]"
        />
        <span className="font-serif text-4xl font-bold text-[#C9A84C]">+</span>
        <p className="text-[9px] tracking-[4px] text-[rgba(245,245,240,0.3)] mt-1">
          VETTED MEMBERS
        </p>
      </div>
    </div>
  )
}
