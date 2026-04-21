"use client";

import { useEffect, useState } from "react";

const DOT_COUNT = 8;

export function ConvoyTrail() {
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
      className="my-10 flex items-center justify-center gap-2 opacity-50"
      aria-hidden="true"
    >
      {Array.from({ length: DOT_COUNT }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[#C9A84C]"
          style={
            reduceMotion
              ? undefined
              : {
                  animation: "convoy-pulse 2s ease-in-out infinite",
                  animationDelay: `${i * 0.15}s`,
                }
          }
        />
      ))}
      <span
        className="text-sm text-[#C9A84C]"
        style={
          reduceMotion
            ? undefined
            : {
                animation: "convoy-pulse 2s ease-in-out infinite",
                animationDelay: "1.2s",
              }
        }
      >
        →
      </span>
    </div>
  );
}
