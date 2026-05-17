"use client";

// The canonical V2 admin side-drawer shell — scrim fade, right slide-in,
// Esc-to-close, standard padding + close button. Every feature drawer
// uses this so layout + behavior stay identical across the admin.

import { useEffect } from "react";

export function AdminDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[460px] max-w-[95vw] bg-[#0d0d0d] border-l border-[rgba(255,255,255,0.07)] z-50 overflow-y-auto transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {open && (
          <div className="p-7">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="float-right text-[20px] leading-none text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
            >
              ✕
            </button>
            <div className="text-[19px] font-bold leading-tight text-[#F5F5F0]">
              {title}
            </div>
            {subtitle && (
              <div className="text-[12px] text-[rgba(245,245,240,0.45)] mt-1 mb-4">
                {subtitle}
              </div>
            )}
            <div className={subtitle ? "" : "mt-4"}>{children}</div>
          </div>
        )}
      </aside>
    </>
  );
}
