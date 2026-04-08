import Link from "next/link"
import { VideoHero } from "@/components/video-hero"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Spotlight } from "@/components/ui/spotlight"
import { Meteors } from "@/components/ui/meteors"
import { TextHoverEffect } from "@/components/ui/text-hover-effect"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { Marquee } from "@/components/ui/marquee"
import { HeroStats } from "@/components/hero-stats"
import { BeamDivider } from "@/components/beam-divider"
import { BeamPath } from "@/components/beam-path"
import { GridBeams } from "@/components/grid-beams"
import { SectionReveal } from "@/components/section-reveal"
import { TiltCard } from "@/components/tilt-card"

const MARQUEE_ITEMS = [
  "NIGHT RUNS",
  "VENUE TAKEOVERS",
  "PRIVATE DINNERS",
  "SUPERCAR CONVOYS",
  "NETWORKING",
  "EXCLUSIVE ACCESS",
]

const FEATURE_CARDS = [
  { icon: "\u2726", label: "VETTED", sub: "Every member, personally reviewed" },
  { icon: "\u25C6", label: "PRIVATE", sub: "Venues you won't find on Google" },
  { icon: "\u2B21", label: "CONNECTED", sub: "Intros that change trajectories" },
  { icon: "\u25CE", label: "AUTOMOTIVE", sub: "200+ cars. Zero posers." },
] as const

export default function Home() {
  return (
    <>
      {/* ── Section 1: Hero ── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Background layers */}
        <VideoHero />
        <BackgroundBeams className="z-[1]" />
        <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="#C9A84C" />
        <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
          <Meteors number={15} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          {/* Label */}
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-[#C9A84C]" />
            <span className="text-[10px] font-medium tracking-[6px] text-[#C9A84C]">
              EST. MMXXV &middot; MIAMI
            </span>
            <span className="h-px w-12 bg-[#C9A84C]" />
          </div>

          {/* Title */}
          <div className="mt-8 h-[120px] w-full max-w-3xl sm:h-[140px] md:h-[160px]">
            <TextHoverEffect text="TOP TIER MIAMI CLUB" />
          </div>

          {/* Subtitle */}
          <div className="mt-10 max-w-md font-cormorant text-lg italic leading-relaxed text-[rgba(245,245,240,0.6)]">
            <p>The convoy is the experience.</p>
            <p>The dinner is the connection.</p>
          </div>

          {/* Buttons */}
          <div className="mt-12 flex gap-4">
            <Link href="/apply">
              <ShimmerButton
                shimmerColor="#C9A84C"
                background="rgba(201,168,76,0.12)"
                className="px-10 py-4 text-[11px] font-medium tracking-[4px]"
              >
                APPLY FOR MEMBERSHIP &rarr;
              </ShimmerButton>
            </Link>
            <Link
              href="/events"
              className="rounded-xl border border-[rgba(245,245,240,0.15)] px-10 py-4 text-[11px] font-medium tracking-[4px] text-[rgba(245,245,240,0.6)] transition-all hover:border-[#C9A84C] hover:text-[#C9A84C]"
            >
              EXPLORE
            </Link>
          </div>

          {/* Stats */}
          <HeroStats className="mt-20" />
        </div>
      </section>

      {/* ── Section 2: Beam Divider ── */}
      <BeamDivider variant="default" />

      {/* ── Section 3: Marquee Strip ── */}
      <div className="border-y border-[rgba(201,168,76,0.08)] py-5">
        <Marquee pauseOnHover>
          {MARQUEE_ITEMS.map((item) => (
            <span
              key={item}
              className="text-[13px] font-medium tracking-[6px] text-[rgba(201,168,76,0.2)]"
            >
              {item} &middot;
            </span>
          ))}
        </Marquee>
      </div>

      {/* ── Section 4: Experience Section ── */}
      <section className="relative mx-auto max-w-5xl px-6 py-32">
        <BeamPath className="pointer-events-none opacity-60" />

        <div className="relative grid items-center gap-16 md:grid-cols-2">
          {/* Left column */}
          <SectionReveal>
            <p className="mb-4 text-[10px] font-medium tracking-[5px] text-[#C9A84C]">
              THE EXPERIENCE
            </p>
            <h2 className="font-cormorant text-[clamp(32px,4vw,48px)] font-bold">
              Point A <span className="text-[#C9A84C]">&rarr;</span> Point B
            </h2>
            <p className="mt-6 text-[15px] font-light leading-relaxed text-[rgba(245,245,240,0.45)]">
              We meet at a curated venue &mdash; a gallery, a rooftop, a private
              dining room. Then we ride. Twenty cars through the causeway at
              midnight.{" "}
              <span className="font-cormorant italic text-[rgba(245,245,240,0.55)]">
                Headlights cutting through Biscayne. Drone overhead.
              </span>
            </p>
            <p className="mt-4 text-[15px] font-light leading-relaxed text-[rgba(245,245,240,0.45)]">
              The destination is a second venue. But the convoy is the point.
              This is how connections are made &mdash; at 60 miles per hour.
            </p>
          </SectionReveal>

          {/* Right column */}
          <SectionReveal delay={0.2}>
            <div className="relative">
              <GridBeams />
              <div className="relative grid grid-cols-2 gap-4">
                {FEATURE_CARDS.map((card) => (
                  <TiltCard key={card.label}>
                    <div className="rounded-xl border border-[rgba(255,255,255,0.06)] p-6 transition-colors hover:border-[rgba(201,168,76,0.2)] hover:bg-[rgba(201,168,76,0.02)]">
                      <div className="mb-3 text-xl text-[#C9A84C]">
                        {card.icon}
                      </div>
                      <p className="mb-1 text-[10px] font-semibold tracking-[3px]">
                        {card.label}
                      </p>
                      <p className="text-[12px] text-[rgba(245,245,240,0.35)]">
                        {card.sub}
                      </p>
                    </div>
                  </TiltCard>
                ))}
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ── Section 5: Beam Divider Alt ── */}
      <BeamDivider variant="alt" />

      {/* ── Section 6: Bottom CTA ── */}
      <section className="mx-auto max-w-2xl px-6 py-32 text-center">
        <SectionReveal>
          <div className="relative overflow-hidden rounded-2xl border border-[rgba(201,168,76,0.12)] bg-[rgba(201,168,76,0.02)] p-20">
            {/* Top gold line */}
            <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />

            <p className="font-cormorant text-[clamp(48px,8vw,96px)] font-bold text-[#C9A84C]">
              48
            </p>
            <p className="font-cormorant text-[clamp(20px,3vw,32px)] text-[#F5F5F0]">
              hours.
            </p>
            <p className="mx-auto mt-4 mb-10 max-w-sm text-[14px] leading-relaxed text-[rgba(245,245,240,0.4)]">
              That&apos;s how long it takes us to review your application. If
              you&apos;re a fit, you&apos;ll hear from us.
            </p>
            <Link href="/apply">
              <ShimmerButton
                shimmerColor="#C9A84C"
                background="rgba(201,168,76,0.12)"
                className="px-10 py-4 text-[11px] font-medium tracking-[4px]"
              >
                APPLY NOW
              </ShimmerButton>
            </Link>
          </div>
        </SectionReveal>
      </section>
    </>
  )
}
