"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN") {
          router.push("/admin");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
      <div className="text-center">
        <div className="text-[11px] tracking-[4px] text-[#C9A84C] mb-4">
          TTMC
        </div>
        <p className="text-[rgba(245,245,240,0.4)] text-sm">
          Authenticating...
        </p>
      </div>
    </div>
  );
}
