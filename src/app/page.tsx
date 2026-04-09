import Link from "next/link"
import Image from "next/image"
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
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials"
import { FocusCards } from "@/components/ui/focus-cards"
import { Timeline } from "@/components/ui/timeline"

const PARTNER_NAMES = [
  "MPH CLUB",
  "1OF1 MOTORSPORTS",
  "SHIFT ARCADE",
  "PALM CAR RESERVE",
  "COLLECTION SUITES",
  "TITAN CHEMICALS",
  "XZOTICA MIAMI",
  "ALPHA EXOTICS",
  "CARSUNDERSTARS",
] as const

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

const HOW_IT_WORKS_STEPS = [
  {
    number: "01",
    title: "Apply",
    body: "Submit your application. Car, Instagram, how you found us. Every submission is reviewed personally within 48 hours.",
  },
  {
    number: "02",
    title: "Select Your Tier",
    body: "Once pre-approved, choose your membership level. Upload your driver's license and sign the membership agreement.",
  },
  {
    number: "03",
    title: "Get Approved & Pay",
    body: "We review your documents and fully approve your membership. Sign the invoice, pay your dues, and you're in.",
  },
  {
    number: "04",
    title: "Attend an Experience",
    body: "Your first event is within 30 days. Show up, meet the members, feel the energy. That's where it starts.",
  },
] as const

const TESTIMONIALS = [
  {
    quote: "Midnight run through Key Biscayne. 20 cars. That dinner afterward changed my business.",
    name: "Marco T.",
    designation: "992 GT3",
    src: "/images/porsche-911-turbo.jpg",
  },
  {
    quote: "I've been to car meets. This is not that. The people here actually move different.",
    name: "Alex R.",
    designation: "McLaren 720S",
    src: "/images/mclaren-720s.jpg",
  },
  {
    quote: "Applied on a Tuesday, heard back Thursday. First event was the Shift Arcade takeover. Haven't missed one since.",
    name: "Diana K.",
    designation: "Range Rover SV",
    src: "/images/lamborghini-huracan.jpg",
  },
]

export default function Home() {
  return (
    <>
      {/* ── Section 1: Hero ── */}
      <section className="relative flex h-screen min-h-[600px] items-center justify-center overflow-hidden">
        {/* Background layers */}
        <VideoHero />
        <BackgroundBeams className="absolute inset-0 z-[1]" />
        <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="#C9A84C" />
        <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
          <Meteors number={15} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          {/* Label */}
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-[#C9A84C]" />
            <span className="text-[16px] font-medium tracking-[6px] text-[#C9A84C]">
              EST. MMXXV &middot; MIAMI
            </span>
            <span className="h-px w-12 bg-[#C9A84C]" />
          </div>

          {/* Title */}
          <div className="mt-8 h-[160px] w-full max-w-4xl sm:h-[200px] md:h-[240px]">
            <TextHoverEffect textLines={["TOP TIER", "MIAMI CLUB"]} />
          </div>

          {/* Subtitle */}
          <div
            className="mt-10 max-w-lg font-cormorant text-xl italic leading-relaxed text-[rgba(245,245,240,0.75)] sm:text-2xl"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
          >
            <p>The convoy is the experience.</p>
            <p>The dinner is the connection.</p>
          </div>

          {/* Buttons */}
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
            <Link href="/apply">
              <ShimmerButton
                shimmerColor="#C9A84C"
                background="rgba(201,168,76,0.12)"
                borderRadius="8px"
                className="px-12 py-5 text-[13px] font-semibold tracking-[4px]"
              >
                APPLY FOR MEMBERSHIP &rarr;
              </ShimmerButton>
            </Link>
            <Link
              href="/events"
              className="rounded-lg border border-[rgba(245,245,240,0.15)] px-12 py-5 text-[13px] font-semibold tracking-[4px] text-[rgba(245,245,240,0.6)] transition-all hover:border-[#C9A84C] hover:text-[#C9A84C]"
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

      {/* ── Section 3: Partner Logos Marquee ── */}
      <div className="border-y border-[rgba(255,255,255,0.04)] py-6">
        <p className="mb-3 text-center text-[16px] tracking-[5px] text-[rgba(201,168,76,0.3)]">
          ECOSYSTEM PARTNERS
        </p>
        <Marquee pauseOnHover>
          {PARTNER_NAMES.map((name) => (
            <span
              key={name}
              className="mx-8 text-[15px] font-semibold tracking-[3px] text-[rgba(245,245,240,0.25)]"
            >
              {name}
            </span>
          ))}
        </Marquee>
      </div>

      {/* ── Section 4: Marquee Strip ── */}
      <div className="border-y border-[rgba(201,168,76,0.08)] py-5">
        <Marquee pauseOnHover>
          {MARQUEE_ITEMS.map((item) => (
            <span
              key={item}
              className="text-[15px] font-medium tracking-[6px] text-[rgba(201,168,76,0.2)]"
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
            <p className="mb-4 text-[14px] font-medium tracking-[5px] text-[#C9A84C]">
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
                      <p className="mb-1 text-[14px] font-semibold tracking-[3px]">
                        {card.label}
                      </p>
                      <p className="text-[16px] text-[rgba(245,245,240,0.35)]">
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

      {/* ── Mid-page CTA ── */}
      <div className="flex justify-center py-12">
        <Link
          href="/apply"
          className="btn-fill-gold rounded-lg px-12 py-4 text-[16px] font-semibold uppercase tracking-[4px] transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5"
        >
          APPLY FOR MEMBERSHIP &rarr;
        </Link>
      </div>

      {/* ── How It Works — Timeline ── */}
      <section className="px-6 py-24">
        <SectionReveal>
          <p className="mb-4 text-center text-[14px] tracking-[5px] text-[#C9A84C]">
            THE PROCESS
          </p>
          <h2 className="mb-8 text-center font-cormorant text-[clamp(28px,3vw,40px)] font-bold">
            Four Steps. That&apos;s It.
          </h2>
        </SectionReveal>

        <Timeline
          data={HOW_IT_WORKS_STEPS.map((step) => ({
            title: step.number,
            content: (
              <div className="pb-8">
                <h3 className="mb-2 font-cormorant text-2xl font-bold text-[#F5F5F0] md:text-3xl">
                  {step.title}
                </h3>
                <p className="max-w-md text-[15px] leading-relaxed text-[rgba(245,245,240,0.45)]">
                  {step.body}
                </p>
              </div>
            ),
          }))}
        />
      </section>

      {/* ── Testimonials ── */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <SectionReveal>
          <p className="mb-4 text-center text-[14px] tracking-[5px] text-[#C9A84C]">
            MEMBER VOICES
          </p>
          <h2 className="text-center font-cormorant text-[clamp(28px,3vw,40px)] font-bold">
            From the Network
          </h2>
        </SectionReveal>

        <AnimatedTestimonials testimonials={TESTIMONIALS} autoplay />
      </section>

      {/* ── Photo Gallery — Focus Cards ── */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <SectionReveal>
          <p className="mb-4 text-center text-[14px] tracking-[5px] text-[#C9A84C]">
            THE CULTURE
          </p>
          <h2 className="mb-12 text-center font-cormorant text-[clamp(28px,3vw,40px)] font-bold">
            Built by Alignment. Not by Numbers.
          </h2>
        </SectionReveal>

        <FocusCards
          cards={[
            { title: "NIGHT RUN", src: "/images/ttmc-event.jpg" },
            { title: "FLEET LINEUP", src: "/images/luxury-cars-lv.jpg" },
            { title: "COLLECTION", src: "/images/ferrari-f8-tributo.jpg" },
            { title: "TRACK DAY", src: "/images/event-track-day-homestead.jpg" },
          ]}
        />
      </section>

      {/* ── Beam Divider Alt ── */}
      <BeamDivider variant="alt" />

      {/* ── Section 6: Bottom CTA ── */}
      <section className="mx-auto max-w-2xl px-6 py-32 text-center">
        <SectionReveal>
          <div className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-[rgba(201,168,76,0.12)] bg-[rgba(201,168,76,0.02)] px-8 py-20">
            {/* Top gold line */}
            <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />

            <p className="font-cormorant text-[clamp(48px,8vw,96px)] font-bold text-[#C9A84C]">
              48
            </p>
            <p className="font-cormorant text-[clamp(20px,3vw,32px)] text-[#F5F5F0]">
              hours.
            </p>
            <p className="mt-4 mb-10 max-w-sm text-center text-[14px] leading-relaxed text-[rgba(245,245,240,0.4)]">
              That&apos;s how long it takes us to review your application. If
              you&apos;re a fit, you&apos;ll hear from us.
            </p>
            <Link
              href="/apply"
              className="btn-fill-gold rounded-lg px-12 py-4 text-[16px] font-semibold uppercase tracking-[4px] transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5"
            >
              APPLY NOW
            </Link>
          </div>
        </SectionReveal>
      </section>
    </>
  )
}
