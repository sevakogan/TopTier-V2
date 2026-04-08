import { cn } from "@/lib/utils"

interface GridBeamsProps {
  className?: string
}

const PATHS = [
  "M200,60 L200,260",        // Vertical center
  "M80,160 L320,160",        // Horizontal center
  "M100,60 C100,160 300,160 300,60",   // Top arc
  "M100,260 C100,160 300,160 300,260", // Bottom arc
]

const CORNER_NODES = [
  { cx: 100, cy: 60, r: 3 },
  { cx: 300, cy: 60, r: 3 },
  { cx: 100, cy: 260, r: 3 },
  { cx: 300, cy: 260, r: 3 },
]

const CENTER_NODE = { cx: 200, cy: 160, r: 4 }

export function GridBeams({ className }: GridBeamsProps) {
  return (
    <svg
      viewBox="0 0 400 320"
      className={cn("absolute inset-0 w-full h-full pointer-events-none", className)}
    >
      <defs>
        <linearGradient id="grid-beam-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="50%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* Background lines */}
      {PATHS.map((d, i) => (
        <path
          key={`bg-${i}`}
          d={d}
          fill="none"
          stroke="rgba(201,168,76,0.06)"
          strokeWidth="1"
        />
      ))}

      {/* Animated lines */}
      {PATHS.map((d, i) => (
        <path
          key={`anim-${i}`}
          d={d}
          fill="none"
          stroke="url(#grid-beam-grad)"
          strokeWidth="1"
          className="animate-[grid-beam-1_4s_linear_infinite]"
          style={{ animationDelay: `${i * 0.8}s` }}
        />
      ))}

      {/* Corner node circles */}
      {CORNER_NODES.map((node, i) => (
        <circle
          key={`corner-${i}`}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          fill="#C9A84C"
          className="animate-[node-pulse_3s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 0.5}s` }}
        />
      ))}

      {/* Center node (larger and brighter) */}
      <circle
        cx={CENTER_NODE.cx}
        cy={CENTER_NODE.cy}
        r={CENTER_NODE.r}
        fill="#C9A84C"
        opacity="0.8"
        className="animate-[node-pulse_2.5s_ease-in-out_infinite]"
      />
    </svg>
  )
}
