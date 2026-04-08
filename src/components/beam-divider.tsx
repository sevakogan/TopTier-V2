import { cn } from "@/lib/utils"

interface BeamDividerProps {
  variant?: "default" | "alt"
  className?: string
}

const PATHS = {
  default: "M0,30 C200,30 300,10 600,30 C900,50 1000,30 1200,30",
  alt: "M0,30 C300,50 400,10 600,30 C800,50 900,10 1200,30",
}

const NODE_POSITIONS = [
  { cx: 0, cy: 30 },
  { cx: 300, cy: 20 },
  { cx: 600, cy: 30 },
  { cx: 900, cy: 40 },
  { cx: 1200, cy: 30 },
]

export function BeamDivider({ variant = "default", className }: BeamDividerProps) {
  const path = PATHS[variant]

  return (
    <div className={cn("w-full h-[60px]", className)}>
      <svg
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id={`beam-grad-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="#C9A84C" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Background path */}
        <path
          d={path}
          fill="none"
          stroke="rgba(201,168,76,0.06)"
          strokeWidth="1"
        />

        {/* Animated beam path */}
        <path
          d={path}
          fill="none"
          stroke={`url(#beam-grad-${variant})`}
          strokeWidth="1.5"
          strokeDasharray="120 800"
          className="animate-[divider-sweep_5s_linear_infinite]"
        />

        {/* Pulsing node circles */}
        {NODE_POSITIONS.map((node, i) => (
          <circle
            key={i}
            cx={node.cx}
            cy={node.cy}
            r="3"
            fill="#C9A84C"
            className="animate-[node-pulse_3s_ease-in-out_infinite]"
            style={{ animationDelay: `${i * 0.6}s` }}
          />
        ))}
      </svg>
    </div>
  )
}
