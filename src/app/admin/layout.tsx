"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AdminDataProvider } from "@/components/admin/admin-data";
import { AdminChromeProvider } from "@/components/admin/admin-chrome";
import { AdminShell } from "@/components/admin/admin-shell";


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [denied, setDenied] = useState(false);
  // Once auth resolves we never show the full-screen loader again, so
  // client navigation can never blank the shell.
  const resolved = useRef(false);

  const isPublicRoute =
    pathname.includes("/login") || pathname.includes("/callback");

  useEffect(() => {
    if (isPublicRoute) {
      setLoading(false);
      setAuthorized(true);
      return;
    }

    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/admin/login");
        return;
      }

      // Unified gate: allowlist OR admin/founder role (server-decided).
      try {
        const res = await fetch("/api/admin/me", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (res.ok) setAuthorized(true);
        else setDenied(true);
      } catch {
        setDenied(true);
      }
      resolved.current = true;
      setLoading(false);
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isPublicRoute) {
        router.push("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, isPublicRoute]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (loading && !resolved.current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <div className="text-[11px] tracking-[4px] text-[#C9A84C] mb-4">
            TTMC
          </div>
          <p className="text-[rgba(245,245,240,0.4)] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <div className="text-[11px] tracking-[4px] text-[#C9A84C] mb-4">
            TTMC
          </div>
          <p className="text-[#F5F5F0] text-lg font-semibold mb-2">
            Access Denied
          </p>
          <p className="text-[rgba(245,245,240,0.4)] text-sm mb-6">
            Your account is not authorized for admin access.
          </p>
          <button
            onClick={() =>
              supabase.auth.signOut().then(() => router.push("/"))
            }
            className="rounded-lg px-6 py-2 text-[11px] tracking-[2px] font-semibold border border-[#C9A84C] text-[#C9A84C] bg-transparent transition-colors hover:bg-[#C9A84C] hover:text-[#0A0A0A]"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <AdminChromeProvider>
      <AdminDataProvider>
        <AdminShell>{children}</AdminShell>
      </AdminDataProvider>
    </AdminChromeProvider>
  );
}
