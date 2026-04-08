"use client";

import { useEffect, useState } from "react";
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
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <nav
      className="fixed top-0 right-0 left-0 z-100 flex h-[72px] items-center justify-between px-6 transition-all duration-300"
      style={
        scrolled
          ? {
              backgroundColor: "rgba(10,10,10,0.92)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderBottom: "1px solid rgba(201,168,76,0.12)",
            }
          : {
              backgroundColor: "transparent",
            }
      }
    >
      {/* Logo */}
      <Link href="/" className="flex cursor-none items-center gap-3">
        <Image src="/images/ttmc-logo.png" alt="TTMC" width={36} height={36} className="rounded-full" />
        <div className="flex items-center gap-1 text-[11px] tracking-[4px]">
          <span className="font-sans text-[#F5F5F0]">TOP TIER</span>
          <span className="font-sans text-[#C9A84C]">MIAMI</span>
        </div>
      </Link>

      {/* Desktop links */}
      <div className="hidden items-center gap-8 md:flex">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`gold-underline cursor-none text-[10px] tracking-[3px] transition-colors ${
                isActive
                  ? "text-[#C9A84C] after:w-full"
                  : "text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]"
              }`}
              style={
                isActive
                  ? {
                      position: "relative",
                    }
                  : undefined
              }
            >
              {link.label}
              {isActive && (
                <span
                  className="absolute bottom-[-2px] left-0 h-px w-full"
                  style={{
                    background: "linear-gradient(90deg, #C9A84C, #E8D48B)",
                  }}
                />
              )}
            </Link>
          );
        })}

        <Link
          href="/apply"
          className="cursor-none rounded-lg border border-[#C9A84C] px-5 py-2 text-[10px] tracking-[3px] text-[#C9A84C] transition-all hover:bg-[#C9A84C] hover:text-[#0A0A0A]"
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
        <div className="fixed inset-0 top-[72px] z-50 flex flex-col items-center justify-center gap-10 bg-[#0A0A0A]/98 md:hidden">
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
            className="cursor-none rounded-lg border border-[#C9A84C] px-8 py-3 text-sm tracking-[4px] text-[#C9A84C] transition-all hover:bg-[#C9A84C] hover:text-[#0A0A0A]"
          >
            APPLY
          </Link>
        </div>
      )}
    </nav>
  );
}
