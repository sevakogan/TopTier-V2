# TTMC V2 — Full Design Specification

## Overview

**Project:** Top Tier Miami Club — Premium automotive community website
**Domain:** toptiermiamiclub.com
**Stack:** Next.js 16 (App Router) + Tailwind CSS v4 + Supabase + Vercel
**Design Direction:** Dark luxury editorial — inspired by Zero Bond, duPont Registry, Infinite Machine
**Animation Stack:** Aceternity UI + Magic UI + GSAP ScrollTrigger + Framer Motion + Lenis

---

## Design Philosophy

Understated premium. The site should feel like a magazine editorial, not a nightclub flyer. Copy assumes the reader is sophisticated. Exclusivity is signaled structurally (the application process exists) rather than proclaimed in copy.

Key principles:
- Show, don't tell — sensory details over adjectives
- Restraint over decoration — every effect earns its place
- Depth over flatness — layered visuals create dimensional feel
- Editorial tone — write as if recapping for insiders, not selling to outsiders

---

## Design System

### Colors
```
--dark:       #0A0A0A   (page background)
--dark-2:     #111111   (card backgrounds)
--dark-3:     #1A1A1A   (elevated surfaces)
--gold:       #C9A84C   (primary accent)
--gold-light: #E8D48B   (hover/gradient end)
--gold-dim:   rgba(201,168,76,0.15)
--white:      #F5F5F0   (primary text)
--grey:       rgba(245,245,240,0.45) (body text)
--grey-muted: rgba(245,245,240,0.25) (placeholders)
```

### Typography
```
Display/Headers: 'Cormorant Garamond', serif — weights 400, 600, 700
Body/UI:         'Outfit', sans-serif — weights 300, 400, 500, 600, 700
Labels/Badges:   Outfit 10-11px, tracking 3-5px, uppercase, weight 500-600
```

### Border Radius (Updated — replaces sharp corners)
```
--radius:    12px  (buttons, cards)
--radius-sm: 8px   (inputs, nav CTA, badges)
--radius-lg: 16px  (CTA box, large containers)
Badge radius: 4px
```

### Spacing & Layout
- Max content width: 1100px
- Section padding: py-32 (128px vertical)
- Page padding: px-6
- Card padding: p-6 to p-8
- Gap between cards: 12-16px

### Borders
- Card border: `border border-[rgba(255,255,255,0.05)]`
- Hover card border: `border-[rgba(201,168,76,0.2)]`
- Gold separator: `border-b border-[rgba(201,168,76,0.12)]`

---

## Animation Stack

### NPM Dependencies
```
pnpm add framer-motion gsap @studio-freight/lenis
```

### Copy-Paste Components (no npm)
| Source | Component | Usage |
|--------|-----------|-------|
| Aceternity UI | Background Beams | Hero background (replaces canvas) |
| Aceternity UI | Spotlight | Cursor-following gold spotlight |
| Aceternity UI | Text Generate Effect | Hero title character-by-character reveal |
| Aceternity UI | Lamp Effect | Section heading gold glow reveal |
| Aceternity UI | Animated Beam | Path illustrations connecting elements |
| Magic UI | Marquee | Smooth infinite marquee strip |
| Magic UI | Number Ticker | Stats count-up animation |
| Magic UI | Shimmer Button | Gold sweep across primary CTAs |
| Magic UI | Meteors | Subtle gold meteor trails in background |

### Library-Based
| Library | Usage |
|---------|-------|
| GSAP + ScrollTrigger | Hero pin, scrub-reveal sections, parallax depth |
| Framer Motion | Page transitions (AnimatePresence), spring hover states |
| Lenis | Smooth scroll wrapping entire layout |

### Custom Effects
| Effect | Description |
|--------|-------------|
| Cursor Glow | 400px gold radial gradient following mouse + 6px gold dot |
| Scroll Progress | 2px gold gradient bar at top of page |
| 3D Card Tilt | Perspective transform following cursor on hover (5deg max) |
| Animated Beam Paths | SVG beam illustrations with traveling gold light |
| Beam Dividers | Sine-wave beams with pulsing nodes between sections |
| Grid Beam Connections | Beams connecting icon cards through center point |

---

## Hero Section

### Background Layers (bottom to top)
1. YouTube video loop (muted, autoplay) — `https://www.youtube.com/watch?v=9PJvvkkmQ2Q`
2. Dark tint overlay (75% opacity `rgba(10,10,10,0.75)`)
3. Background Beams (Aceternity)
4. Spotlight (follows cursor)
5. Meteors (subtle gold diagonal streaks)
6. Noise overlay (25% opacity, fixed)
7. Content (z-index: 10)

### Content
- Label: `EST. MMXXV · MIAMI` (flanked by gold lines)
- Title: `TOP TIER` / `MIAMI CLUB` — Text Generate Effect (char by char with blur-to-sharp)
- Subtitle: *"The convoy is the experience. The dinner is the connection."* (Cormorant Garamond italic)
- Primary CTA: `APPLY FOR MEMBERSHIP →` (Shimmer Button)
- Secondary CTA: `EXPLORE` (outline button)
- Stats: `50 VETTED MEMBERS` / `30 PRIVATE EVENTS` / `EST. 2025 · MIAMI, FL` (Number Ticker)
- No scroll indicator — Lenis invites scrolling naturally

### Section Transition
- Beam Divider (sine-wave SVG with pulsing gold nodes)

---

## Marquee Strip

- Magic UI Marquee component
- Content: `NIGHT RUNS · VENUE TAKEOVERS · PRIVATE DINNERS · SUPERCAR CONVOYS · NETWORKING`
- 13px, tracking 6px, gold at 20% opacity
- Bordered top and bottom with `rgba(201,168,76,0.08)`

---

## Experience Section ("THE EXPERIENCE")

### Layout
2-column grid: editorial copy left, icon grid right

### Background
Animated Beam Path — large S-curve SVG tracing behind entire section with "A" and "B" labels at endpoints. Gold light travels the full path continuously.

### Left Column
- Lamp Effect reveals heading
- Label: `THE EXPERIENCE`
- Title: `Point A → Point B`
- Copy:
  > "We meet at a curated venue — a gallery, a rooftop, a private dining room. Then we ride. Twenty cars through the causeway at midnight. *Headlights cutting through Biscayne. Drone overhead.*"
  >
  > "The destination is a second venue. But the convoy is the point. This is how connections are made — at 60 miles per hour."

### Right Column — Icon Grid
2x2 grid with beam connections (cross pattern + arcs through center):
- `VETTED` — "Every member, personally reviewed"
- `PRIVATE` — "Venues you won't find on Google"
- `CONNECTED` — "Intros that change trajectories"
- `AUTOMOTIVE` — "200+ cars. Zero posers."

Cards have 3D perspective tilt on hover.

---

## Bottom CTA

- Beam Divider above
- Rounded container with gold top-line accent
- Content:
  > **48** (large Cormorant number)
  > **hours.**
  > "That's how long it takes us to review your application. If you're a fit, you'll hear from us."
  > `APPLY NOW` (Shimmer Button)

---

## Events Page (`/events`)

### Header
- Lamp Effect on heading
- Label: `MEMBER EVENTS`
- Title: `Where We've Been`
- Subtitle: "Every event is invitation-only. Here's what our members have experienced."

### Event Cards
Vertical stack, 12px gap, rounded corners. Each card has:
- Left color accent bar (3px, visible on hover)
- 3D tilt on hover
- Editorial tone descriptions

**Event Data (rewritten):**

1. **TTMC x Shift Arcade Takeover** | MAY 2026 | VENUE ACTIVATION | gold
   > "Twenty-three cars lined up outside Shift Arcade in Wynwood. Inside, members raced each other on full-motion simulators. At midnight, the convoy rolled out through Wynwood. Drone footage is still circulating."

2. **Midnight Run: Key Biscayne** | APR 2026 | NIGHT RUN | blue
   > "Twenty cars through the causeway under the moonlight. Photo stops at the bridge. The convoy pulled into a private waterfront spot for dinner. Nobody posted the location."

3. **Nick Castle's VIP Night** | MAR 2026 | PRIVATE DINNER | purple
   > "One of Miami's most reserved venues. Twelve members at the table. No phones. The kind of introductions that don't happen at networking events."

4. **SCS x Hard Rock Cruise** | FEB 2026 | COLLABORATION | red
   > "Joint cruise with Supercar Society. Forty exotics rolling through Biscayne. Local media covered it. Two new sponsorship deals closed that night."

5. **Wynwood Art Basel Run** | DEC 2025 | SPECIAL EVENT | pink
   > "Art Basel weekend. Exotics parked at curated murals across Wynwood. Select non-members were invited. Content from that night is still making rounds."

6. **Founders Circle Dinner** | NOV 2025 | INNER CIRCLE | emerald
   > "Quarterly. Twelve seats. No phones. Deal flow conversations and direct intros that changed businesses."

---

## Perks Page (`/perks`)

### Header
- Lamp Effect on heading
- Label: `SPONSOR NETWORK`
- Title: `Member Perks`
- Subtitle: "Your membership unlocks access across our vetted sponsor network."

### Categories with Cards
2-column grid per category. Each perk card has:
- 3D tilt on hover
- Gold border glow on hover
- Credibility line (italic, gold at 50% opacity)

**AUTOMOTIVE:**
- Priority Detailing — LuxeShine | 25% OFF | "Miami's highest-rated ceramic studio"
- Performance Tuning — TuneHaus | 15% OFF | "Featured in DriveTribe"
- Premium Tint — Tint Masters | 20% OFF | "Trusted by 40+ TTMC members"
- Exotic Storage — Miami Vault | PRIORITY | "Used by collectors citywide"

**DINING & NIGHTLIFE:**
- Nick Castle's Miami Beach | COMP TABLE
- Zuma Miami | 15% OFF | "Michelin-recognized Japanese cuisine"
- LIV & STORY VIP | BOTTLE DEAL

**LIFESTYLE & EXPERIENCES:**
- Shift Arcade Wynwood | FREE SESSION
- XO Private Aviation | 10% OFF
- Prestige Watch Group | VIP ACCESS
- South Beach Yacht Club | DAY PASS

---

## Apply Page (`/apply`)

### 2-Step Form
Background Beams (subtle, dimmed) behind form.

**Step 1:**
- FULL NAME, EMAIL, PHONE, INSTAGRAM
- `CONTINUE >` button

**Step 2:**
- CAR — YEAR, MAKE, MODEL
- MODIFICATIONS
- HOW DID YOU HEAR ABOUT US?
- BACK / SUBMIT APPLICATION

### Progress Bar
2-segment gold bar at top.

### On Submit
1. Insert into Supabase `applications` table
2. Send Telegram notification (stubbed)
3. Send confirmation email via Resend (stubbed)
4. Show success: Text Generate Effect on "Application Received"
   > "We review every application personally. If you're a fit, expect to hear from us within 48 hours."

---

## Navigation

```
[Logo: T circle + "TOP TIER MIAMI"]     [HOME] [EVENTS] [PERKS] [APPLY]
```

- Fixed, transparent initially, frosted glass on scroll
- Mobile: hamburger -> full-screen overlay
- `APPLY` is bordered button, turns solid gold on hover
- Active page: gold text + animated gold underline
- Rounded CTA button (8px)

---

## Global Components

### Cursor Glow
- 400px gold radial gradient (7% opacity) following mouse
- 6px solid gold dot
- Hidden on touch devices

### Noise Overlay
- Fixed, 25% opacity, SVG fractalNoise pattern

### Scroll Progress
- 2px gold gradient bar at very top of viewport

### Beam Dividers
- SVG sine-wave paths between major sections
- Pulsing gold node dots
- Traveling gold light animation

### Footer
- Border-top: rgba(255,255,255,0.05)
- Left: "c 2026 Top Tier Miami Club. All rights reserved."
- Right: Instagram + Telegram icons

---

## Supabase Schema

```sql
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  instagram TEXT,
  car TEXT,
  modifications TEXT,
  source TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  application_id UUID REFERENCES applications(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  instagram TEXT,
  car TEXT,
  modifications TEXT,
  tier TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  type TEXT,
  description TEXT,
  capacity INT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE event_rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  member_id UUID REFERENCES members(id),
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, member_id)
);

CREATE TABLE perks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  discount TEXT NOT NULL,
  description TEXT,
  code TEXT,
  url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

-- RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read" ON applications FOR SELECT
  USING (auth.email() IN ('sevakogan@gmail.com', 'seva@thelevelteam.com'));

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own data" ON members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin all" ON members FOR ALL
  USING (auth.email() IN ('sevakogan@gmail.com', 'seva@thelevelteam.com'));
```

---

## File Structure

```
TopTier-V2/
|-- src/
|   |-- app/
|   |   |-- layout.tsx              # Root layout, fonts, Lenis, cursor glow
|   |   |-- template.tsx            # Framer Motion AnimatePresence
|   |   |-- page.tsx                # Landing
|   |   |-- events/page.tsx
|   |   |-- perks/page.tsx
|   |   |-- apply/page.tsx
|   |   |-- members/
|   |   |   |-- layout.tsx          # Auth-gated
|   |   |   |-- page.tsx
|   |   |   |-- events/page.tsx
|   |   |   |-- perks/page.tsx
|   |   |   |-- profile/page.tsx
|   |   |   |-- waiver/page.tsx
|   |   |-- api/
|   |   |   |-- apply/route.ts
|   |   |   |-- webhook/stripe/route.ts
|   |   |-- globals.css
|   |-- components/
|   |   |-- ui/                     # shadcn (Button, Input, Label, Badge)
|   |   |-- aceternity/
|   |   |   |-- background-beams.tsx
|   |   |   |-- spotlight.tsx
|   |   |   |-- lamp.tsx
|   |   |   |-- text-generate-effect.tsx
|   |   |   |-- animated-beam.tsx
|   |   |-- magicui/
|   |   |   |-- marquee.tsx
|   |   |   |-- number-ticker.tsx
|   |   |   |-- shimmer-button.tsx
|   |   |   |-- meteors.tsx
|   |   |-- canvas-bg.tsx
|   |   |-- noise-overlay.tsx
|   |   |-- nav.tsx
|   |   |-- footer.tsx
|   |   |-- cursor-glow.tsx
|   |   |-- scroll-progress.tsx
|   |   |-- tilt-card.tsx
|   |   |-- beam-divider.tsx
|   |   |-- beam-path.tsx
|   |   |-- video-hero.tsx
|   |   |-- page-transition.tsx
|   |-- hooks/
|   |   |-- use-gsap.ts
|   |   |-- use-lenis.ts
|   |   |-- use-cursor-position.ts
|   |-- lib/
|   |   |-- supabase.ts
|   |   |-- resend.ts
|   |   |-- telegram.ts
|   |-- types/
|       |-- index.ts
|-- public/
|   |-- og-image.jpg
|-- tailwind.config.ts
|-- next.config.ts
|-- tsconfig.json
|-- package.json
```

---

## DO NOT Rules (Updated)

- DO NOT remove or simplify animations
- DO NOT use Inter, Roboto, or system fonts
- DO NOT use purple, blue, or any color outside the palette (except event accent colors)
- DO NOT show membership tiers/pricing on public pages
- DO NOT use "F1" or "Formula 1" — use "formula racing" or "open-wheel"
- DO NOT use sharp corners — all elements use the radius system above
- DO NOT use words "exclusive", "curated", "bespoke", "world-class" in copy — show, don't tell

---

## Deployment

```
Framework: Next.js
Build: next build
Node: 20.x
Domain: toptiermiamiclub.com -> Vercel

Environment Variables:
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  RESEND_API_KEY          (stub)
  TELEGRAM_BOT_TOKEN      (stub)
  TELEGRAM_CHAT_ID        (stub)
  NEXT_PUBLIC_YT_VIDEO_ID=9PJvvkkmQ2Q
```

---

## Reference

- Visual prototype: `ttmc-v2-preview.html` (in repo root)
- Original spec: provided by user in conversation
- Inspiration: Zero Bond (zerobondny.com), duPont Registry, Infinite Machine, Awwwards automotive sites
