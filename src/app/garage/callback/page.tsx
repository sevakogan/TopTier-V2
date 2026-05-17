"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function GarageCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    async function ensureGaragePass() {
      if (handledRef.current) return;
      handledRef.current = true;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/join");
          return;
        }

        // V1's DB trigger auto-creates the profiles row on signup —
        // the callback creates nothing, it only routes into the Garage.
        router.push("/garage");
      } catch {
        setError("Something went wrong. Please try again.");
        handledRef.current = false;
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        ensureGaragePass();
      }
    });

    // Handle the case where the session is already established on mount.
    ensureGaragePass();

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6">
      <div className="text-center">
        <div className="mb-4 text-[11px] tracking-[4px] text-[#C9A84C]">
          TTMC
        </div>
        {error ? (
          <p className="text-sm text-[#E53E3E]">{error}</p>
        ) : (
          <p className="text-sm text-[rgba(245,245,240,0.45)]">
            Setting up your Garage Pass…
          </p>
        )}
      </div>
    </div>
  );
}
