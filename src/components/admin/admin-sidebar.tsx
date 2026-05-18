"use client";

import { memo, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAdminPipeline } from "@/components/admin/admin-data";
import { useAdminChrome } from "@/components/admin/admin-chrome";

type UserInfo = { name: string; email: string };

const MANAGEMENT_LINKS = [
  { href: "/admin", label: "Pipeline", icon: "📊", showBadge: true },
  { href: "/admin/events", label: "Events", icon: "📅", showBadge: false },
  { href: "/admin/catalog", label: "Catalog", icon: "🚗", showBadge: false },
  { href: "/admin/studio", label: "Studio", icon: "🎬", showBadge: false },
  { href: "/admin/rentals", label: "Rentals", icon: "🔑", showBadge: false },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: "📕",
    showBadge: false,
  },
  {
    href: "/admin/invite-codes",
    label: "Invite Codes",
    icon: "🎟️",
    showBadge: false,
  },
  {
    href: "/admin/partners",
    label: "Partners",
    icon: "🤝",
    showBadge: false,
  },
  {
    href: "/admin/payments",
    label: "Payments",
    icon: "💳",
    showBadge: false,
  },
  {
    href: "/admin/roles",
    label: "Team & Roles",
    icon: "🛡️",
    showBadge: false,
  },
];

function AdminSidebarInner() {
  const pathname = usePathname();
  const router = useRouter();
  const { items } = useAdminPipeline();
  const { collapsed, toggle } = useAdminChrome();
  const [user, setUser] = useState<UserInfo>({ name: "", email: "" });

  const pendingCount = items.filter((i) => i.stage === "New").length;

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || !session?.user) return;
      setUser({
        name: session.user.user_metadata?.full_name ?? "Admin",
        email: session.user.email ?? "",
      });
    });
    return () => {
      active = false;
    };
  }, []);

  function isActive(href: string): boolean {
    return href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(href);
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore — still navigate away
    }
    router.push("/");
  }

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 bg-[#111111] border-r border-[rgba(255,255,255,0.06)] flex flex-col z-50 font-sans transition-[width] duration-200 ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      {/* Logo + minimize toggle */}
      <div
        className={`flex items-center pt-6 pb-8 ${
          collapsed ? "flex-col gap-3 px-0" : "gap-2.5 px-6"
        }`}
      >
        <div className="w-7 h-7 shrink-0 rounded-full border border-[#C9A84C] flex items-center justify-center text-xs font-bold text-[#C9A84C]">
          T
        </div>
        {!collapsed && (
          <span className="text-[11px] tracking-[3px] font-semibold text-[rgba(245,245,240,0.45)] flex-1">
            TTMC CRM
          </span>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand menu" : "Minimize menu"}
          title={collapsed ? "Expand" : "Minimize"}
          className="w-6 h-6 rounded-md flex items-center justify-center text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      {/* Nav */}
      <div className={`flex-1 ${collapsed ? "px-2" : "px-4"}`}>
        {!collapsed && (
          <div className="text-[10px] tracking-[2px] text-[rgba(245,245,240,0.25)] px-2 mb-2">
            MANAGEMENT
          </div>
        )}
        <nav className="flex flex-col gap-0.5">
          {MANAGEMENT_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                title={collapsed ? link.label : undefined}
                className={`flex items-center rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  collapsed
                    ? "justify-center px-0 py-2.5"
                    : "gap-2.5 px-3 py-2.5"
                } ${
                  active
                    ? "bg-[rgba(201,168,76,0.1)] text-[#C9A84C]"
                    : "text-[rgba(245,245,240,0.45)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#F5F5F0]"
                }`}
              >
                <span className="text-sm relative">
                  {link.icon}
                  {collapsed &&
                    link.showBadge &&
                    pendingCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-[#C9A84C] text-[#0A0A0A] rounded-full px-1 text-[9px] font-bold leading-[14px]">
                        {pendingCount}
                      </span>
                    )}
                </span>
                {!collapsed && <span>{link.label}</span>}
                {!collapsed &&
                  link.showBadge &&
                  pendingCount > 0 && (
                    <span className="ml-auto bg-[#C9A84C] text-[#0A0A0A] rounded-full px-2 text-[10px] font-bold leading-[18px]">
                      {pendingCount}
                    </span>
                  )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User + sign out */}
      <div className={`pb-4 ${collapsed ? "px-2" : "px-4"}`}>
        {collapsed ? (
          <button
            type="button"
            onClick={handleSignOut}
            title={`Sign out (${user.email})`}
            className="w-full h-9 rounded-lg flex items-center justify-center text-[12px] font-bold text-[#C9A84C] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)]"
          >
            {(user.name || user.email || "A")
              .charAt(0)
              .toUpperCase()}
          </button>
        ) : (
          <>
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
          </>
        )}
      </div>
    </aside>
  );
}

// No props: memo means the bar re-renders ONLY for its own state
// (active link / collapse / pipeline badge) — never because the route
// or page content changed.
export const AdminSidebar = memo(AdminSidebarInner);
