"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const FALLBACK_COUNT = 50;

/**
 * MemberCountPill
 *
 * Visibility: Option 1B — only visible while in the hero section.
 * Fades out once the user scrolls past the first viewport height.
 */
export function MemberCountPill() {
  const [count, setCount] = useState<number>(FALLBACK_COUNT);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [inHero, setInHero] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      try {
        const { count: rows, error } = await supabase
          .from("members")
          .select("id", { count: "exact", head: true });
        if (cancelled) return;
        if (error || !rows || rows <= 0) {
          setCount(FALLBACK_COUNT);
          return;
        }
        setCount(rows);
      } catch {
        if (!cancelled) setCount(FALLBACK_COUNT);
      }
    }

    fetchCount();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Option 1B: visible in hero only. Hero occupies roughly 100vh.
  // Treat anything past 70% of the viewport as "past hero".
  useEffect(() => {
    function onScroll() {
      setInHero(window.scrollY < window.innerHeight * 0.7);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const animation = reduceMotion
    ? undefined
    : "pill-pulse 4s ease-in-out infinite";

  return (
    <div
      className="fixed top-1/2 right-6 z-[100] hidden -translate-y-1/2 flex-col items-center gap-1 rounded-full border border-[rgba(201,168,76,0.2)] bg-[rgba(10,10,10,0.85)] px-3 py-4 backdrop-blur-xl transition-[opacity,transform] duration-500 ease-out md:flex"
      style={{
        animation,
        opacity: inHero ? 1 : 0,
        transform: inHero
          ? "translateY(-50%) translateX(0)"
          : "translateY(-50%) translateX(40px)",
        pointerEvents: inHero ? "auto" : "none",
      }}
      aria-hidden="true"
    >
      <div className="font-cormorant text-2xl font-bold text-[#C9A84C]">
        {count}
      </div>
      <div
        className="my-1 text-[8px] tracking-[2px] text-[rgba(245,245,240,0.45)]"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        MEMBERS
      </div>
      <div className="text-[9px] tracking-[1px] text-[#22c55e]">+3 ↑</div>
    </div>
  );
}
