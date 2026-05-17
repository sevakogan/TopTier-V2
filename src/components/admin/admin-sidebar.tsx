"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type UserInfo = {
  name: string;
  email: string;
};

const MANAGEMENT_LINKS = [
  { href: "/admin", label: "Pipeline", icon: "📊", showBadge: true },
  { href: "/admin/events", label: "Events", icon: "📅", showBadge: false },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo>({ name: "", email: "" });
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;

        if (session?.user) {
          setUser({
            name: session.user.user_metadata?.full_name ?? "Admin",
            email: session.user.email ?? "",
          });
        }

        const token = session?.access_token;
        if (!token) return;

        const res = await fetch("/api/admin/pipeline", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const payload = (await res.json()) as {
          items?: { stage: string }[];
        };
        if (!active) return;

        const newCount = (payload.items ?? []).filter(
          (i) => i.stage === "New"
        ).length;
        setPendingCount(newCount);
      } catch {
        // Silent — badge simply stays hidden.
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [pathname]);

  function isActive(href: string): boolean {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore — still navigate away.
    }
    router.push("/");
  }

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[240px] bg-[#111111] border-r border-[rgba(255,255,255,0.06)] flex flex-col z-50 font-sans">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 pt-6 pb-8">
        <div className="w-7 h-7 rounded-full border border-[#C9A84C] flex items-center justify-center text-xs font-bold text-[#C9A84C]">
          T
        </div>
        <span className="text-[11px] tracking-[3px] font-semibold text-[rgba(245,245,240,0.45)]">
          TTMC CRM
        </span>
      </div>

      {/* Management section */}
      <div className="px-4 flex-1">
        <div className="text-[10px] tracking-[2px] text-[rgba(245,245,240,0.25)] px-2 mb-2">
          MANAGEMENT
        </div>
        <nav className="flex flex-col gap-0.5">
          {MANAGEMENT_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                  active
                    ? "bg-[rgba(201,168,76,0.1)] text-[#C9A84C]"
                    : "text-[rgba(245,245,240,0.45)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#F5F5F0]"
                }`}
              >
                <span className="text-sm">{link.icon}</span>
                <span>{link.label}</span>
                {link.showBadge && pendingCount > 0 && (
                  <span className="ml-auto bg-[#C9A84C] text-[#0A0A0A] rounded-full px-2 text-[10px] font-bold leading-[18px]">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User info + Sign Out */}
      <div className="px-4 pb-4">
        <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-3">
          <div className="text-[9px] tracking-[2px] text-[#C9A84C] mb-1">
            ADMIN
          </div>
          <div className="text-[13px] font-semibold text-[#F5F5F0] truncate">
            {user.name || "Admin"}
          </div>
          <div className="text-[11px] text-[rgba(245,245,240,0.25)] truncate">
            {user.email}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-2 w-full rounded-lg px-3 py-2 text-[12px] font-medium text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0] hover:bg-[rgba(255,255,255,0.04)] transition-all duration-150 text-left"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
