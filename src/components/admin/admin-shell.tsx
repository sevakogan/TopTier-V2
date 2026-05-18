"use client";

// The admin frame: the sidebar is an independent, always-mounted fixed
// rail; only the <main> content swaps on navigation. Content margin
// tracks the collapse state so the bar feels completely separate.

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { useAdminChrome } from "@/components/admin/admin-chrome";

export function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed } = useAdminChrome();
  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans">
      <AdminSidebar />
      <main
        className={`min-h-screen p-8 transition-[margin] duration-200 ${
          collapsed ? "ml-[68px]" : "ml-[240px]"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
