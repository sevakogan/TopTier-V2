"use client"

import { useRef, useCallback, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TiltCardProps {
  children: ReactNode
  className?: string
}

const MAX_ROTATION = 5

export function TiltCard({ children, className }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    const rotateX = (0.5 - y) * MAX_ROTATION * 2
    const rotateY = (x - 0.5) * MAX_ROTATION * 2

    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`
  }, [])

  const handleMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return

    el.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale(1)"
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]", className)}
      style={{ willChange: "transform" }}
    >
      {children}
    </div>
  )
}
