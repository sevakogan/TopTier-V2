"use client";

// Tap any image to view it big. Full-screen overlay; click anywhere
// or press Esc to close. Controlled via `src`.

import { useEffect } from "react";

export function ImageLightbox({
  src,
  onClose,
}: {
  src: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!src) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-6 cursor-zoom-out"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-5 right-6 text-[26px] leading-none text-[rgba(245,245,240,0.6)] hover:text-[#F5F5F0]"
      >
        ✕
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Full size"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] max-w-[94vw] rounded-lg object-contain shadow-2xl"
      />
    </div>
  );
}
