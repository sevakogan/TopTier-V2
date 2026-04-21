"use client";

import { useEffect, useState } from "react";

const WINDOWS: Array<{ x: number; y: number }> = [
  { x: 70, y: 70 }, { x: 80, y: 70 },
  { x: 130, y: 85 }, { x: 140, y: 90 },
  { x: 190, y: 50 }, { x: 200, y: 60 },
  { x: 250, y: 80 }, { x: 310, y: 40 },
  { x: 320, y: 50 }, { x: 370, y: 65 },
  { x: 430, y: 75 }, { x: 490, y: 55 },
  { x: 550, y: 70 }, { x: 610, y: 45 },
  { x: 670, y: 70 }, { x: 730, y: 35 },
  { x: 790, y: 60 }, { x: 850, y: 80 },
  { x: 910, y: 50 }, { x: 970, y: 70 },
  { x: 1030, y: 90 }, { x: 1090, y: 55 },
  { x: 1150, y: 75 }, { x: 1210, y: 45 },
  { x: 1270, y: 65 }, { x: 1330, y: 85 },
];

function delayForIndex(i: number): string {
  // Match the preview's nth-child(odd|3n|5n) staggering loosely
  if ((i + 1) % 5 === 0) return "3s";
  if ((i + 1) % 3 === 0) return "2s";
  if ((i + 1) % 2 === 1) return "1s";
  return "0s";
}

/**
 * MiamiSkyline
 *
 * Visibility: Option 3C — always visible as a fixed bottom band.
 * Acts as a grounding element that keeps the "Miami" identity
 * present on every section of every page.
 */
export function MiamiSkyline() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-[1] flex h-[120px] items-end justify-center"
      style={{ opacity: 0.5 }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="xMidYMax slice"
        className="h-[120px] w-full"
        style={{ opacity: 0.5 }}
      >
        <path
          d="M0,120 L0,90 L60,90 L60,60 L120,60 L120,80 L180,80 L180,40 L240,40 L240,70 L300,70 L300,30 L360,30 L360,55 L420,55 L420,75 L480,75 L480,45 L540,45 L540,65 L600,65 L600,35 L660,35 L660,60 L720,60 L720,25 L780,25 L780,50 L840,50 L840,70 L900,70 L900,40 L960,40 L960,60 L1020,60 L1020,80 L1080,80 L1080,45 L1140,45 L1140,65 L1200,65 L1200,35 L1260,35 L1260,55 L1320,55 L1320,75 L1380,75 L1380,50 L1440,50 L1440,120 Z"
          fill="rgba(0,0,0,0.95)"
          stroke="rgba(201,168,76,0.15)"
          strokeWidth={1}
        />
        {WINDOWS.map((w, i) => (
          <rect
            key={`${w.x}-${w.y}`}
            x={w.x}
            y={w.y}
            width={4}
            height={4}
            fill="rgba(201,168,76,0.5)"
            style={
              reduceMotion
                ? { opacity: 0.6 }
                : {
                    animation: "window-flicker 5s ease-in-out infinite",
                    animationDelay: delayForIndex(i),
                  }
            }
          />
        ))}
      </svg>
    </div>
  );
}
