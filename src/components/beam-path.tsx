import { cn } from "@/lib/utils"

interface BeamPathProps {
  className?: string
}

const S_CURVE = "M100,150 C250,150 200,300 350,300 C500,300 450,150 600,150 C750,150 700,350 850,350 C950,350 1000,250 1050,200"

const NODE_POSITIONS = [
  { cx: 100, cy: 150 },
  { cx: 350, cy: 300 },
  { cx: 600, cy: 150 },
  { cx: 850, cy: 350 },
  { cx: 1050, cy: 200 },
]

export function BeamPath({ className }: BeamPathProps) {
  return (
    <svg
      viewBox="0 0 1100 600"
      className={cn("absolute inset-0 w-full h-full", className)}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="beam-path-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="50%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* Background path */}
      <path
        d={S_CURVE}
        fill="none"
        stroke="rgba(201,168,76,0.08)"
        strokeWidth="2"
      />

      {/* Animated beam */}
      <path
        d={S_CURVE}
        fill="none"
        stroke="url(#beam-path-grad)"
        strokeWidth="2"
        strokeDasharray="80 500"
        className="animate-[beam-travel_4s_linear_infinite]"
      />

      {/* Node circles */}
      {NODE_POSITIONS.map((node, i) => (
        <circle
          key={i}
          cx={node.cx}
          cy={node.cy}
          r="3"
          fill="#C9A84C"
          className="animate-[node-pulse_3s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 0.5}s` }}
        />
      ))}

      {/* Label A */}
      <text
        x="85"
        y="140"
        fill="rgba(201,168,76,0.4)"
        fontSize="10"
        fontFamily="var(--font-outfit), sans-serif"
      >
        A
      </text>

      {/* Label B */}
      <text
        x="1060"
        y="190"
        fill="rgba(201,168,76,0.4)"
        fontSize="10"
        fontFamily="var(--font-outfit), sans-serif"
      >
        B
      </text>
    </svg>
  )
}
