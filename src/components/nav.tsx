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
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const currentY = window.scrollY;
      const goingUp = currentY < lastScrollY.current;

      setScrolled(currentY > 60);

      if (currentY < 100) {
        setVisible(true);
      } else if (goingUp) {
        setVisible(true);
      } else if (currentY - lastScrollY.current > 10) {
        setVisible(false);
        setMobileOpen(false);
      }

      lastScrollY.current = currentY;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div
      className={`fixed top-0 right-0 left-0 z-100 flex justify-center px-6 pt-3 transition-all duration-400 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <nav
        className={`flex max-w-3xl items-center gap-6 px-5 py-2.5 transition-all duration-500 ${
          scrolled
            ? "rounded-full border border-[rgba(201,168,76,0.12)] bg-[rgba(10,10,10,0.85)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl"
            : "rounded-full border border-transparent bg-transparent"
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
          <span className="hidden text-[10px] tracking-[3px] font-medium text-[rgba(245,245,240,0.6)] sm:block">
            TTMC
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`gold-underline relative cursor-none pb-0.5 text-[10px] tracking-[2px] transition-colors ${
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
            className="btn-fill-gold cursor-none rounded-full px-5 py-1.5 text-[9px] tracking-[3px] font-semibold"
          >
            APPLY
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex cursor-none flex-col gap-1.5 md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          <span
            className={`block h-px w-5 bg-[#F5F5F0] transition-all duration-300 ${
              mobileOpen ? "translate-y-[3.5px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-px w-5 bg-[#F5F5F0] transition-all duration-300 ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-px w-5 bg-[#F5F5F0] transition-all duration-300 ${
              mobileOpen ? "-translate-y-[3.5px] -rotate-45" : ""
            }`}
          />
        </button>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 top-[56px] z-50 flex flex-col items-center justify-center gap-10 bg-[#0A0A0A]/98 md:hidden">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`cursor-none text-lg tracking-[6px] transition-colors ${
                    isActive ? "text-[#C9A84C]" : "text-[#F5F5F0]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/apply"
              className="btn-fill-gold cursor-none rounded-full px-8 py-3 text-sm tracking-[4px]"
            >
              APPLY
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}
