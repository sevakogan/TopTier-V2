# TTMC V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Top Tier Miami Club website — 4 public pages with premium Aceternity/Magic UI animations, YouTube video hero, Supabase backend, editorial copy.

**Architecture:** Next.js 16 App Router with src/ directory. Aceternity UI + Magic UI copy-paste components for visual effects. GSAP ScrollTrigger for scroll animations. Framer Motion for page transitions. Lenis for smooth scroll. Supabase for auth + database. All public pages are static/SSG. API route handles form submissions.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Supabase, Framer Motion, GSAP, Lenis, Aceternity UI, Magic UI

**Design Spec:** `docs/superpowers/specs/2026-04-07-ttmc-v2-design.md`
**Visual Reference:** `ttmc-v2-preview.html`

---

## File Map

### New Files (Create)
```
src/app/layout.tsx                    — Root layout: fonts, metadata, Lenis provider, cursor glow
src/app/template.tsx                  — Framer Motion AnimatePresence page transition wrapper
src/app/page.tsx                      — Landing page (hero + marquee + experience + CTA)
src/app/events/page.tsx               — Events page
src/app/perks/page.tsx                — Perks page
src/app/apply/page.tsx                — Application form (client component)
src/app/api/apply/route.ts            — POST handler: insert application + notify
src/app/globals.css                   — Design system tokens, custom animations, Tailwind imports
src/components/nav.tsx                — Fixed navigation with scroll state
src/components/footer.tsx             — Site footer
src/components/noise-overlay.tsx      — SVG fractalNoise texture overlay
src/components/cursor-glow.tsx        — Mouse-following gold glow + dot (client)
src/components/scroll-progress.tsx    — Gold progress bar at top (client)
src/components/video-hero.tsx         — YouTube iframe background with tint
src/components/tilt-card.tsx          — 3D perspective hover card (client)
src/components/beam-divider.tsx       — SVG sine-wave beam section dividers
src/components/beam-path.tsx          — Animated beam path illustration (A->B)
src/components/grid-beams.tsx         — Beam connections between icon grid cards
src/components/section-reveal.tsx     — GSAP ScrollTrigger reveal wrapper (client)
src/components/hero-stats.tsx         — Stats with number ticker
src/lib/supabase.ts                   — Supabase client (browser)
src/lib/supabase-server.ts            — Supabase client (server/service role)
src/lib/telegram.ts                   — Telegram notification helper (stubbed)
src/lib/resend.ts                     — Email helper (stubbed)
src/types/index.ts                    — Shared TypeScript types
next.config.ts                        — Next.js configuration
```

### Installed via CLI (shadcn registry)
```
src/components/ui/button.tsx          — shadcn Button
src/components/ui/input.tsx           — shadcn Input
src/components/ui/label.tsx           — shadcn Label
src/components/ui/badge.tsx           — shadcn Badge
src/components/aceternity/background-beams.tsx
src/components/aceternity/spotlight.tsx
src/components/aceternity/text-generate-effect.tsx
src/components/aceternity/text-hover-effect.tsx
src/components/magicui/marquee.tsx
src/components/magicui/number-ticker.tsx
src/components/magicui/shimmer-button.tsx
src/components/magicui/meteors.tsx
```

---

## Phase 1: Project Scaffolding

### Task 1: Create Next.js 16 project

- [ ] **Step 1: Scaffold with create-next-app**

```bash
cd "/Users/seva/Documents/Claude - Code/TopTier-V2"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --turbopack --import-alias "@/*" --use-npm --yes
```

Note: Run from the existing TopTier-V2 directory. The `--yes` flag accepts defaults. This creates Next.js 16 with App Router, TypeScript, Tailwind CSS v4, ESLint, Turbopack, and src/ directory.

- [ ] **Step 2: Verify the scaffold**

```bash
cd "/Users/seva/Documents/Claude - Code/TopTier-V2"
cat package.json | grep -E '"next"|"react"|"tailwindcss"'
ls src/app/layout.tsx src/app/page.tsx
```

Expected: next 16.x, react 19.x, tailwindcss 4.x. Both files should exist.

- [ ] **Step 3: Run dev server to verify**

```bash
npm run dev
```

Visit http://localhost:3000 — should show the default Next.js page.

- [ ] **Step 4: Commit scaffold**

```bash
git add -A
git commit -m "chore: scaffold Next.js 16 project with Tailwind v4"
```

---

### Task 2: Install dependencies

- [ ] **Step 1: Install animation libraries**

```bash
npm install framer-motion gsap lenis
```

Note: `lenis` (not `@studio-freight/lenis` — package was renamed).

- [ ] **Step 2: Install Supabase client**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 3: Install shadcn CLI and init**

```bash
npx shadcn@latest init -d
```

This initializes shadcn with defaults. When prompted, select the "new-york" style and use the default CSS variables.

- [ ] **Step 4: Install shadcn base components**

```bash
npx shadcn@latest add button input label badge
```

- [ ] **Step 5: Install Aceternity UI components**

```bash
npx shadcn@latest add "https://ui.aceternity.com/registry/background-beams.json"
npx shadcn@latest add "https://ui.aceternity.com/registry/spotlight.json"
npx shadcn@latest add "https://ui.aceternity.com/registry/text-generate-effect.json"
npx shadcn@latest add "https://ui.aceternity.com/registry/text-hover-effect.json"
```

If any of these fail (registry URL changed), fall back to manually creating the component files from Aceternity UI docs.

- [ ] **Step 6: Install Magic UI components**

```bash
npx shadcn@latest add "https://magicui.design/r/marquee"
npx shadcn@latest add "https://magicui.design/r/number-ticker"
npx shadcn@latest add "https://magicui.design/r/shimmer-button"
npx shadcn@latest add "https://magicui.design/r/meteors"
```

- [ ] **Step 7: Verify all installs**

```bash
ls src/components/ui/
npm ls framer-motion gsap lenis @supabase/supabase-js
```

Expected: button.tsx, input.tsx, label.tsx, badge.tsx in ui/. All npm packages listed.

- [ ] **Step 8: Commit dependencies**

```bash
git add -A
git commit -m "chore: install animation libs, Supabase, shadcn, Aceternity, Magic UI"
```

---

## Phase 2: Design System & Global Layout

### Task 3: Global CSS — design tokens and animations

- [ ] **Step 1: Write globals.css**

Replace `src/app/globals.css` with the full design system. This includes:
- Tailwind v4 import
- CSS custom properties for all colors
- Custom scrollbar styles
- Selection color
- Reveal animation classes
- Beam animation keyframes
- Marquee keyframes
- Shimmer keyframes
- Char reveal keyframes
- Meteor keyframes
- Gold pulse keyframes
- Noise overlay styles

Reference the design spec for exact values:
- `--dark: #0A0A0A`, `--gold: #C9A84C`, `--white: #F5F5F0`, etc.
- `--radius: 12px`, `--radius-sm: 8px`, `--radius-lg: 16px`
- All `@keyframes` from the preview HTML

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add design system tokens and animation keyframes"
```

---

### Task 4: Root layout with fonts and providers

- [ ] **Step 1: Write src/app/layout.tsx**

```tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { NoiseOverlay } from "@/components/noise-overlay";
import { CursorGlow } from "@/components/cursor-glow";
import { ScrollProgress } from "@/components/scroll-progress";
import { LenisProvider } from "@/components/lenis-provider";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Top Tier Miami Club — Miami's Automotive Community",
  description: "The convoy is the experience. The dinner is the connection. Miami's premier automotive community.",
  openGraph: {
    title: "Top Tier Miami Club",
    description: "The convoy is the experience. The dinner is the connection.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${outfit.variable}`}>
      <body className="bg-[#0A0A0A] text-[#F5F5F0] font-outfit overflow-x-hidden">
        <LenisProvider>
          <NoiseOverlay />
          <CursorGlow />
          <ScrollProgress />
          <Nav />
          <main className="relative z-10">{children}</main>
          <Footer />
        </LenisProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Write src/components/lenis-provider.tsx (client component)**

```tsx
"use client";

import { ReactNode, useEffect } from "react";
import Lenis from "lenis";

export function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return <>{children}</>;
}
```

- [ ] **Step 3: Write src/app/template.tsx (page transitions)**

```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/template.tsx src/components/lenis-provider.tsx
git commit -m "feat: root layout with fonts, Lenis smooth scroll, page transitions"
```

---

### Task 5: Global UI components (noise, cursor, scroll progress)

- [ ] **Step 1: Write src/components/noise-overlay.tsx**

SVG fractalNoise pattern, fixed position, z-1, pointer-events none, 25% opacity. Pure CSS, no client JS needed — a server component.

- [ ] **Step 2: Write src/components/cursor-glow.tsx (client component)**

`"use client"` — tracks mousemove, renders two divs:
- 400px gold radial gradient at 7% opacity (glow)
- 6px gold dot
- Hidden on touch devices (`ontouchstart` check)
- Uses `requestAnimationFrame` for smooth tracking

- [ ] **Step 3: Write src/components/scroll-progress.tsx (client component)**

`"use client"` — tracks scroll position, renders 2px gold gradient bar fixed at top.
Width = `(scrollY / (scrollHeight - innerHeight)) * 100%`.

- [ ] **Step 4: Verify by running dev server**

```bash
npm run dev
```

Visit http://localhost:3000 — should see noise texture, cursor glow following mouse, and scroll progress bar.

- [ ] **Step 5: Commit**

```bash
git add src/components/noise-overlay.tsx src/components/cursor-glow.tsx src/components/scroll-progress.tsx
git commit -m "feat: noise overlay, cursor glow, scroll progress bar"
```

---

### Task 6: Navigation component

- [ ] **Step 1: Write src/components/nav.tsx (client component)**

`"use client"` — Fixed nav with:
- Logo (T circle + "TOP TIER MIAMI" text)
- Links: HOME, EVENTS, PERKS (using Next.js `Link`)
- CTA: APPLY button (rounded 8px, gold outline)
- Scroll state: transparent initially, frosted glass after 60px scroll
- Active page detection via `usePathname()`
- Mobile: hamburger toggle → full-screen overlay
- Gold underline animation on hover (CSS pseudo-element)
- All links use `next/link` for client-side navigation

- [ ] **Step 2: Verify navigation renders and scroll state works**

- [ ] **Step 3: Commit**

```bash
git add src/components/nav.tsx
git commit -m "feat: navigation with scroll state, mobile menu, active page"
```

---

### Task 7: Footer component

- [ ] **Step 1: Write src/components/footer.tsx**

Server component. Border-top, flex between:
- Left: "c 2026 Top Tier Miami Club. All rights reserved." (Cormorant Garamond)
- Right: Instagram + Telegram SVG icons linking to @toptiermiamiclub

- [ ] **Step 2: Commit**

```bash
git add src/components/footer.tsx
git commit -m "feat: footer with social icons"
```

---

## Phase 3: Shared Components

### Task 8: Video hero background

- [ ] **Step 1: Write src/components/video-hero.tsx**

Server component. Renders:
- Container: absolute positioned, fills parent, overflow hidden
- YouTube iframe: `src="https://www.youtube.com/embed/9PJvvkkmQ2Q?autoplay=1&mute=1&loop=1&playlist=9PJvvkkmQ2Q&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"` — oversized (180vw/180vh) centered via transform to avoid black bars
- Tint overlay div: `bg-[rgba(10,10,10,0.75)]` absolute inset-0
- Use env var `NEXT_PUBLIC_YT_VIDEO_ID` with fallback to `9PJvvkkmQ2Q`

- [ ] **Step 2: Commit**

```bash
git add src/components/video-hero.tsx
git commit -m "feat: YouTube video hero background with tint overlay"
```

---

### Task 9: Tilt card, beam dividers, beam path, grid beams

- [ ] **Step 1: Write src/components/tilt-card.tsx (client component)**

`"use client"` — wrapper that tracks mousemove on the element, applies `perspective(800px) rotateX/rotateY` transform. Props: `children`, `className`. Max rotation: 5deg. Resets on mouse leave. Uses `onMouseMove` and `onMouseLeave`.

- [ ] **Step 2: Write src/components/beam-divider.tsx**

Server component. SVG sine-wave path with:
- Background path at 6% gold opacity
- Animated path with stroke-dasharray + stroke-dashoffset animation (CSS)
- Pulsing gold node circles
- Accepts `variant` prop for different curve shapes
- Uses `linearGradient` in SVG defs for the traveling light effect

- [ ] **Step 3: Write src/components/beam-path.tsx**

Server component. Large S-curve SVG for the Experience section with A/B labels and traveling gold beam. Same stroke-dasharray animation technique.

- [ ] **Step 4: Write src/components/grid-beams.tsx**

Server component. SVG overlay for the icon grid with cross pattern + arc connections between 4 corners through center. Animated beams travel along paths.

- [ ] **Step 5: Write src/components/section-reveal.tsx (client component)**

`"use client"` — uses GSAP ScrollTrigger. Wraps children, animates from `opacity: 0, y: 40` to `opacity: 1, y: 0` when scrolled into view. Accepts `delay` prop. Registers ScrollTrigger plugin on mount.

```tsx
"use client";

import { useRef, useEffect, ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function SectionReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/tilt-card.tsx src/components/beam-divider.tsx src/components/beam-path.tsx src/components/grid-beams.tsx src/components/section-reveal.tsx
git commit -m "feat: tilt card, beam dividers, beam path, grid beams, section reveal"
```

---

### Task 10: Hero stats with number ticker

- [ ] **Step 1: Write src/components/hero-stats.tsx (client component)**

Uses the Magic UI NumberTicker component (installed in Task 2). Renders 3 stats:
- `50` + "VETTED MEMBERS"
- `30` + "PRIVATE EVENTS"
- `EST. 2025` + "MIAMI, FL"

First two use NumberTicker, third is plain text with the same ticker animation.

- [ ] **Step 2: Commit**

```bash
git add src/components/hero-stats.tsx
git commit -m "feat: hero stats with number ticker animation"
```

---

## Phase 4: Pages

### Task 11: Landing page (home)

- [ ] **Step 1: Write src/app/page.tsx**

This is the main landing page composing all sections. Structure:

```
<section> Hero
  <VideoHero />
  <BackgroundBeams /> (from Aceternity)
  <Spotlight /> (from Aceternity)
  <Meteors /> (from Magic UI)
  — Label: EST. MMXXV · MIAMI
  — Title: TOP TIER / MIAMI CLUB (TextHoverEffect — SVG gradient outline on hover, from x.ai)
  — Subtitle: italic Cormorant copy
  — Buttons: ShimmerButton (primary) + outline (secondary)
  — HeroStats
</section>
<BeamDivider />
<section> Marquee
  <Marquee /> (from Magic UI)
</section>
<section> Experience
  <BeamPath /> (background)
  — Left: Lamp reveal + "THE EXPERIENCE" + "Point A → Point B" + editorial copy
  — Right: Icon grid with <GridBeams /> + 4 <TiltCard /> cards
</section>
<BeamDivider variant="alt" />
<section> Bottom CTA
  — "48" big number + "hours." + body copy + ShimmerButton
</section>
```

Each section wrapped in `<SectionReveal>` for scroll animations.
Hero content uses staggered delays for entrance animation.
All text uses the rewritten editorial copy from the design spec.

- [ ] **Step 2: Verify landing page renders**

```bash
npm run dev
```

Visit http://localhost:3000 — verify all sections, animations, video background, beams, cursor glow.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: landing page with hero, marquee, experience, CTA"
```

---

### Task 12: Events page

- [ ] **Step 1: Write src/app/events/page.tsx**

Structure:
- Header section with lamp reveal: "MEMBER EVENTS" / "Where We've Been"
- 6 event cards in vertical stack
- Each card wrapped in `<TiltCard>` + `<SectionReveal>` with staggered delay
- Left color accent bar (3px) per event type
- Editorial copy for all 6 events (from design spec)
- Event badges, dates, locations, descriptions

Event data defined as a const array at top of file (no database query for public events — these are hardcoded showcase events).

- [ ] **Step 2: Verify events page**

Visit http://localhost:3000/events — verify all cards render, tilt works, reveal animations fire on scroll.

- [ ] **Step 3: Commit**

```bash
git add src/app/events/page.tsx
git commit -m "feat: events page with editorial event cards"
```

---

### Task 13: Perks page

- [ ] **Step 1: Write src/app/perks/page.tsx**

Structure:
- Header with lamp reveal: "SPONSOR NETWORK" / "Member Perks"
- 3 category sections: AUTOMOTIVE, DINING & NIGHTLIFE, LIFESTYLE & EXPERIENCES
- Each category has a gold separator header with icon
- 2-column grid of perk cards within each category
- Each perk card: TiltCard wrapper, name, discount badge, description, credibility line
- All perk data hardcoded as const arrays (public page shows info, not codes)

- [ ] **Step 2: Verify perks page**

Visit http://localhost:3000/perks — verify categories, cards, tilt, badges.

- [ ] **Step 3: Commit**

```bash
git add src/app/perks/page.tsx
git commit -m "feat: perks page with sponsor categories and tilt cards"
```

---

### Task 14: Apply page (2-step form)

- [ ] **Step 1: Write src/app/apply/page.tsx (client component)**

`"use client"` — 2-step application form with local state:

State: `step` (1 or 2), `submitted` (boolean), `submitting` (boolean), `formData` object.

Step 1: name, email, phone, instagram fields + CONTINUE button
Step 2: car, modifications, source fields + BACK/SUBMIT buttons

Progress bar: 2-segment gold bar.

On submit:
1. Set `submitting: true`
2. POST to `/api/apply` with formData
3. If success, set `submitted: true`
4. If error, show error toast

Success screen: checkmark icon + "Application Received" (TextGenerateEffect) + body copy.

All inputs use the shadcn Input component with custom gold focus styles.
Background: subtle BackgroundBeams behind form.
Wrapped in SectionReveal for entrance.

- [ ] **Step 2: Write the form submission handler (client-side fetch)**

```tsx
async function handleSubmit() {
  setSubmitting(true);
  try {
    const res = await fetch("/api/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) throw new Error("Failed to submit");
    setSubmitted(true);
  } catch {
    alert("Something went wrong. Please try again.");
  } finally {
    setSubmitting(false);
  }
}
```

- [ ] **Step 3: Verify form flow**

Visit http://localhost:3000/apply — test step 1 → step 2 → submit (will fail until API route exists, that's expected).

- [ ] **Step 4: Commit**

```bash
git add src/app/apply/page.tsx
git commit -m "feat: 2-step application form with success state"
```

---

## Phase 5: Backend

### Task 15: Types

- [ ] **Step 1: Write src/types/index.ts**

```tsx
export type ApplicationStatus = "pending" | "approved" | "rejected";

export type Application = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  car: string | null;
  modifications: string | null;
  source: string | null;
  status: ApplicationStatus;
  created_at: string;
};

export type ApplicationFormData = {
  name: string;
  email: string;
  phone: string;
  instagram: string;
  car: string;
  modifications: string;
  source: string;
};

export type EventType =
  | "venue_activation"
  | "night_run"
  | "private_dinner"
  | "collaboration"
  | "special_event"
  | "inner_circle";

export type PerkCategory = "automotive" | "dining" | "lifestyle";
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: TypeScript types for application, events, perks"
```

---

### Task 16: Supabase client + server helpers

- [ ] **Step 1: Write src/lib/supabase.ts (browser client)**

```tsx
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 2: Write src/lib/supabase-server.ts (service role for API routes)**

```tsx
import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

- [ ] **Step 3: Write .env.local.example**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
NEXT_PUBLIC_YT_VIDEO_ID=9PJvvkkmQ2Q
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts src/lib/supabase-server.ts .env.local.example
git commit -m "feat: Supabase client and server helpers"
```

---

### Task 17: Telegram + Resend stubs

- [ ] **Step 1: Write src/lib/telegram.ts**

```tsx
export async function notifyTelegram(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("[Telegram stub] Would send:", message);
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
  });
}
```

- [ ] **Step 2: Write src/lib/resend.ts**

```tsx
export async function sendConfirmationEmail(
  to: string,
  name: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("[Resend stub] Would send confirmation to:", to);
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "Top Tier Miami Club <noreply@thelevelteam.com>",
      to,
      subject: "Application Received — Top Tier Miami Club",
      html: `<p>Hey ${name},</p><p>We received your application. Our team reviews every submission personally. If you're a fit, expect to hear from us within 48 hours.</p><p>— TTMC</p>`,
    }),
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/telegram.ts src/lib/resend.ts
git commit -m "feat: Telegram notification and Resend email stubs"
```

---

### Task 18: API route — POST /api/apply

- [ ] **Step 1: Write src/app/api/apply/route.ts**

```tsx
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { notifyTelegram } from "@/lib/telegram";
import { sendConfirmationEmail } from "@/lib/resend";
import type { ApplicationFormData } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: ApplicationFormData = await request.json();

    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { error } = await supabase.from("applications").insert({
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      instagram: body.instagram || null,
      car: body.car || null,
      modifications: body.modifications || null,
      source: body.source || null,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save application" },
        { status: 500 }
      );
    }

    // Fire and forget — don't block response
    notifyTelegram(
      `<b>New TTMC Application</b>\n\nName: ${body.name}\nEmail: ${body.email}\nCar: ${body.car || "N/A"}\nIG: ${body.instagram || "N/A"}\nSource: ${body.source || "N/A"}`
    ).catch(console.error);

    sendConfirmationEmail(body.email, body.name).catch(console.error);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
```

- [ ] **Step 2: Test the endpoint locally (without Supabase)**

The endpoint will fail gracefully if Supabase env vars aren't set — it'll log the error and return 500. Once Supabase is configured, it'll work.

```bash
curl -X POST http://localhost:3000/api/apply \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","car":"2024 GT3"}'
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/apply/route.ts
git commit -m "feat: application API route with Supabase insert + notifications"
```

---

## Phase 6: Polish & Deploy

### Task 19: Metadata, OG image, and SEO

- [ ] **Step 1: Add per-page metadata**

Each page file (`events/page.tsx`, `perks/page.tsx`, `apply/page.tsx`) exports metadata:

```tsx
export const metadata = {
  title: "Events — Top Tier Miami Club",
  description: "Where we've been. Every event is invitation-only.",
};
```

- [ ] **Step 2: Create placeholder OG image**

Place a 1200x630 dark image with gold "TOP TIER MIAMI CLUB" text at `public/og-image.jpg`. Can be replaced with a proper design later.

- [ ] **Step 3: Add .gitignore entries**

Ensure `.env.local` is in `.gitignore` (should be by default from create-next-app).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: per-page metadata and OG image"
```

---

### Task 20: Build verification

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Fix any TypeScript or build errors.

- [ ] **Step 2: Run production preview**

```bash
npm run start
```

Visit http://localhost:3000 — verify all pages, animations, navigation, form flow.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: production build fixes"
```

---

### Task 21: Supabase schema setup

- [ ] **Step 1: Create supabase-schema.sql**

Write the full schema file at the project root (from the design spec). Includes:
- `applications` table
- `members` table
- `events` table
- `event_rsvps` table
- `perks` table
- RLS policies

- [ ] **Step 2: Commit**

```bash
git add supabase-schema.sql
git commit -m "feat: Supabase schema with RLS policies"
```

The user will run this SQL in their Supabase dashboard after creating the project.

---

### Task 22: Deploy to Vercel

- [ ] **Step 1: Create GitHub repo and push**

```bash
gh repo create TopTier-V2 --public --source=. --remote=origin
git push -u origin main
```

- [ ] **Step 2: Deploy to Vercel**

```bash
npx vercel --yes
```

Or link via Vercel dashboard. Set environment variables in Vercel project settings.

- [ ] **Step 3: Verify deployment**

Visit the Vercel preview URL. Check all pages load, animations work, form submits (once Supabase is configured).

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| 1: Scaffold | 1-2 | Working Next.js 16 project with all dependencies |
| 2: Design System | 3-7 | Global layout, fonts, nav, footer, noise, cursor, scroll bar |
| 3: Components | 8-10 | Video hero, tilt cards, beams, section reveal, stats |
| 4: Pages | 11-14 | All 4 public pages with full content and animations |
| 5: Backend | 15-18 | Types, Supabase, API route, email/Telegram stubs |
| 6: Polish | 19-22 | SEO, build verify, schema, deploy |
