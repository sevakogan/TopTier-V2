"use client";

import { useEffect, useRef } from "react";

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const hiddenRef = useRef(false);

  useEffect(() => {
    const isTouch =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    if (isTouch) {
      hiddenRef.current = true;
      document.body.style.cursor = "auto";
      return;
    }

    document.body.style.cursor = "none";

    function onMouseMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }

    let rafId: number;

    function tick() {
      const { x, y } = mouseRef.current;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${x - 200}px, ${y - 200}px)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${x - 3}px, ${y - 3}px)`;
      }
      rafId = requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", onMouseMove);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
      document.body.style.cursor = "";
    };
  }, []);

  if (hiddenRef.current) return null;

  return (
    <>
      <div
        ref={glowRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] h-[400px] w-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[10000] h-1.5 w-1.5 rounded-full bg-[#C9A84C]"
        aria-hidden="true"
      />
    </>
  );
}
