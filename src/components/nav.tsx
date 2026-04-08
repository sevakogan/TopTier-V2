"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "HOME" },
  { href: "/events", label: "EVENTS" },
  { href: "/perks", label: "PERKS" },
] as const;

export function Nav() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const currentY = window.scrollY;
      const goingUp = currentY < lastScrollY.current;
      const isMobile = window.innerWidth < 768;

      setScrolled(currentY > 60);

      // On mobile: always visible. On desktop: hide on scroll down.
      if (isMobile || currentY < 100) {
        setVisible(true);
      } else if (goingUp) {
        setVisible(true);
      } else if (currentY - lastScrollY.current > 10) {
        setVisible(false);
      }

      lastScrollY.current = currentY;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed top-0 right-0 left-0 z-100 flex justify-center px-3 pt-3 transition-all duration-400 md:px-6 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <nav
        className={`flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-2 transition-all duration-500 md:justify-center md:gap-6 md:px-5 md:py-2.5 ${
          scrolled
            ? "rounded-full border border-[rgba(201,168,76,0.12)] bg-[rgba(10,10,10,0.85)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl"
            : "rounded-full border border-transparent bg-[rgba(10,10,10,0.5)] backdrop-blur-md md:bg-transparent md:backdrop-blur-none"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex shrink-0 cursor-none items-center gap-2">
          <Image
            src="/images/ttmc-logo.png"
            alt="TTMC"
            width={28}
            height={28}
            className="rounded-full"
          />
          <span className="hidden text-[14px] font-medium tracking-[3px] text-[rgba(245,245,240,0.6)] sm:block">
            TTMC
          </span>
        </Link>

        {/* Links — visible on ALL screen sizes */}
        <div className="flex items-center gap-3 sm:gap-6">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`gold-underline relative cursor-none pb-0.5 text-[11px] tracking-[2px] transition-colors sm:text-[14px] ${
                  isActive
                    ? "text-[#C9A84C]"
                    : "text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-[#C9A84C] to-[#E8D48B]" />
                )}
              </Link>
            );
          })}

          <Link
            href="/apply"
            className="btn-fill-gold cursor-none rounded-full px-4 py-1.5 text-[10px] font-semibold tracking-[2px] sm:px-5 sm:text-[13px] sm:tracking-[3px]"
          >
            APPLY
          </Link>
        </div>
      </nav>
    </div>
  );
}
