"use client";

import { useEffect, useState } from "react";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const scrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const innerHeight = window.innerHeight;
      const max = scrollHeight - innerHeight;
      if (max <= 0) {
        setProgress(0);
        return;
      }
      setProgress((scrollY / max) * 100);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      className="fixed top-0 right-0 left-0 z-[200] h-[3px] bg-[rgba(255,255,255,0.04)]"
      aria-hidden="true"
    >
      <div
        className="h-full"
        style={{
          width: `${progress}%`,
          background:
            "linear-gradient(90deg, #C9A84C 0%, #E8D48B 50%, #ef4444 100%)",
          boxShadow: "0 0 12px rgba(201,168,76,0.4)",
          transition: "width 0.1s",
        }}
      />
    </div>
  );
}
