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
        className="absolute top-1/2 left-1/2 w-[180vw] h-[180vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        allow="autoplay; encrypted-media"
        title="Background video"
      />
      <div className="absolute inset-0 bg-[rgba(10,10,10,0.75)] z-[1]" />
    </div>
  )
}
