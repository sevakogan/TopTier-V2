"use client";

// Marketing chrome (smooth-scroll, cursor glow, nav/footer, ambient
// animations) belongs to the public site only. The /admin CRM gets a
// plain, static shell — no animations, normal cursor, no ambient pill.

import { usePathname } from "next/navigation";
import { LenisProvider } from "@/components/lenis-provider";
import { CursorGlow } from "@/components/cursor-glow";
import { ScrollProgress } from "@/components/scroll-progress";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { MemberCountPill } from "@/components/ambient/member-count-pill";
import { EventStatusWidget } from "@/components/ambient/event-status-widget";
import { MiamiSkyline } from "@/components/ambient/miami-skyline";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <LenisProvider>
      <CursorGlow />
      <ScrollProgress />
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
      <MemberCountPill />
      <EventStatusWidget />
      <MiamiSkyline />
    </LenisProvider>
  );
}
