import { cn } from "@/lib/utils"

interface VideoHeroProps {
  videoId?: string
  className?: string
}

export function VideoHero({
  videoId = "9PJvvkkmQ2Q",
  className,
}: VideoHeroProps) {
  return (
    <div className={cn("absolute inset-0 z-0 overflow-hidden", className)}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
        className="pointer-events-none absolute top-1/2 left-1/2 h-[300vh] w-[300vw] -translate-x-1/2 -translate-y-1/2 md:h-[200vh] md:w-[200vw]"
        allow="autoplay; encrypted-media"
        title="Background video"
      />
      {/* Lighter tint so video shows through more */}
      <div className="absolute inset-0 z-[1] bg-[rgba(10,10,10,0.55)]" />
      {/* Bottom fade to dark for content below */}
      <div className="absolute right-0 bottom-0 left-0 z-[2] h-[30%] bg-gradient-to-t from-[#0A0A0A] to-transparent" />
    </div>
  )
}
