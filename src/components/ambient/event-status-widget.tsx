"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface EventRow {
  id: string;
  title?: string | null;
  name?: string | null;
  date: string;
  venue?: string | null;
  location?: string | null;
  rsvp_count?: number | null;
  capacity?: number | null;
}

// Sections where the widget should be visible (option 2B).
// Match the `data-ambient-section` attribute on the target sections.
const VISIBLE_SECTIONS = new Set(["experience", "testimonials"]);

function daysUntil(dateStr: string): number {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = eventDate.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * EventStatusWidget
 *
 * Visibility: Option 2B — only visible while the user is viewing the
 * "experience" or "testimonials" section on the landing page.
 * Uses IntersectionObserver on sections tagged with `data-ambient-section`.
 */
export function EventStatusWidget() {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchEvent() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .gte("date", today)
          .order("date", { ascending: true })
          .limit(1);
        if (cancelled) return;
        if (error || !data || data.length === 0) {
          setEvent(null);
          return;
        }
        setEvent(data[0] as EventRow);
      } catch {
        if (!cancelled) setEvent(null);
      }
    }

    fetchEvent();
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

  // Observe the sections tagged with `data-ambient-section`.
  // Track intersection state across sections — widget visible whenever
  // any of the tracked sections is currently in the viewport.
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(
      "[data-ambient-section]"
    );
    if (sections.length === 0) {
      setVisible(false);
      return;
    }

    const activeSections = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        // Compute the next state without mutating across entries until done
        const next = new Set(activeSections);
        for (const entry of entries) {
          const key = (entry.target as HTMLElement).dataset.ambientSection;
          if (!key || !VISIBLE_SECTIONS.has(key)) continue;
          if (entry.isIntersecting) {
            next.add(key);
          } else {
            next.delete(key);
          }
        }
        activeSections.clear();
        next.forEach((k) => activeSections.add(k));
        setVisible(next.size > 0);
      },
      { threshold: 0.15 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [event]);

  if (!event) return null;

  const days = daysUntil(event.date);
  const title = event.title ?? event.name ?? "NEXT RUN";
  const venue = event.venue ?? event.location ?? "";
  const sub =
    event.rsvp_count != null && event.capacity != null
      ? `RSVPs ${event.rsvp_count}/${event.capacity}${venue ? ` · ${venue}` : ""}`
      : venue;

  return (
    <div
      className="fixed bottom-6 left-6 z-[100] hidden min-w-[240px] rounded-xl border border-[rgba(201,168,76,0.25)] bg-[rgba(10,10,10,0.9)] px-[18px] py-[14px] backdrop-blur-xl transition-[opacity,transform] duration-500 ease-out md:block"
      style={{
        animation: reduceMotion
          ? undefined
          : "status-pulse 3s ease-in-out infinite",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        pointerEvents: visible ? "auto" : "none",
      }}
      aria-hidden="true"
    >
      <span
        className="absolute top-[14px] left-[14px] block h-2 w-2 rounded-full bg-[#22c55e]"
        style={{
          boxShadow: "0 0 8px #22c55e",
          animation: reduceMotion
            ? undefined
            : "dot-blink 1.5s ease-in-out infinite",
        }}
      />
      <div className="ml-[14px] mb-[6px] text-[9px] tracking-[3px] text-[#C9A84C]">
        LIVE
      </div>
      <div className="ml-[14px] text-[13px] font-semibold uppercase">
        {title} · {days} DAYS
      </div>
      {sub && (
        <div className="ml-[14px] mt-[2px] text-[11px] text-[rgba(245,245,240,0.45)]">
          {sub}
        </div>
      )}
    </div>
  );
}
