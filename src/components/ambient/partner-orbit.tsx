"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const FALLBACK_PARTNERS = [
  "MPH CLUB",
  "SHIFT ARCADE",
  "TUNEHAUS",
  "LUXESHINE",
] as const;

const POSITIONS = [
  // top
  { top: "-24px", left: "50%", transform: "translateX(-50%)" },
  // right
  { top: "50%", right: "-24px", transform: "translateY(-50%)" },
  // bottom
  { bottom: "-24px", left: "50%", transform: "translateX(-50%)" },
  // left
  { top: "50%", left: "-24px", transform: "translateY(-50%)" },
] as const;

export function PartnerOrbit() {
  const [partners, setPartners] = useState<readonly string[]>(FALLBACK_PARTNERS);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchPartners() {
      try {
        const { data, error } = await supabase
          .from("perks")
          .select("name")
          .eq("is_active", true)
          .order("sort_order")
          .limit(4);
        if (cancelled) return;
        if (error || !data || data.length === 0) return;
        const names = data
          .map((row: { name: string | null }) => row.name)
          .filter((n): n is string => Boolean(n));
        if (names.length > 0) {
          setPartners(names);
        }
      } catch {
        // keep fallback
      }
    }

    fetchPartners();
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

  const ringAnim = reduceMotion
    ? undefined
    : { animation: "orbit-rotate 40s linear infinite" };
  const counterAnim = reduceMotion
    ? undefined
    : { animation: "orbit-counter 40s linear infinite" };

  return (
    <div className="relative flex h-[400px] w-full items-center justify-center">
      <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.05)] text-[10px] tracking-[2px] text-[#C9A84C]">
        TTMC
      </div>
      <div
        className="absolute top-1/2 left-1/2 h-[400px] w-[400px] rounded-full border border-dashed border-[rgba(201,168,76,0.1)]"
        style={{
          transform: "translate(-50%, -50%)",
          ...ringAnim,
        }}
      >
        {partners.slice(0, 4).map((name, i) => (
          <div
            key={`${name}-${i}`}
            className="absolute whitespace-nowrap rounded-[20px] border border-[rgba(201,168,76,0.2)] bg-[rgba(10,10,10,0.8)] px-[14px] py-[6px] text-[10px] font-semibold tracking-[2px] text-[rgba(245,245,240,0.6)]"
            style={{
              ...POSITIONS[i],
              ...counterAnim,
            }}
          >
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}
