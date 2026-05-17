"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function GarageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [firstName, setFirstName] = useState("");

  const isCallbackRoute = pathname?.includes("/callback") ?? false;

  useEffect(() => {
    if (isCallbackRoute) {
      setLoading(false);
      setAuthorized(true);
      return;
    }

    let active = true;

    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/join");
          return;
        }

        if (!active) return;

        const metadata = session.user.user_metadata ?? {};
        const fullName =
          (typeof metadata.full_name === "string" && metadata.full_name) ||
          (typeof metadata.name === "string" && metadata.name) ||
          (session.user.email
            ? session.user.email.split("@")[0]
            : "Member");

        setFirstName(fullName.split(" ")[0]);
        setAuthorized(true);
        setLoading(false);
      } catch {
        if (active) router.push("/join");
      }
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isCallbackRoute) {
        router.push("/join");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, isCallbackRoute]);

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      // Sign-out failures still route the user out for a clean state.
    }
    router.push("/");
  }

  if (isCallbackRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <div className="mb-4 text-[11px] tracking-[4px] text-[#C9A84C]">
            TTMC
          </div>
          <p className="text-sm text-[rgba(245,245,240,0.45)]">Loading…</p>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Minimal top bar */}
      <header className="sticky top-0 z-30 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,10,0.85)] backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-[11px] tracking-[4px] text-[#C9A84C]">
            TTMC
          </span>
          <div className="flex items-center gap-5">
            {firstName && (
              <span className="text-[12px] text-[rgba(245,245,240,0.45)]">
                {firstName}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="text-[11px] uppercase tracking-[2px] text-[rgba(245,245,240,0.45)] transition-colors hover:text-[#C9A84C]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
