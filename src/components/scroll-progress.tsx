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
      className="fixed top-0 left-0 z-[1000] h-0.5"
      style={{
        width: `${progress}%`,
        background: "linear-gradient(90deg, #C9A84C, #E8D48B)",
      }}
      aria-hidden="true"
    />
  );
}
