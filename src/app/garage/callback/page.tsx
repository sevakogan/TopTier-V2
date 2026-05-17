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

        const { data: existing } = await supabase
          .from("members")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!existing) {
          const metadata = user.user_metadata ?? {};
          const name =
            (typeof metadata.full_name === "string" && metadata.full_name) ||
            (typeof metadata.name === "string" && metadata.name) ||
            (user.email ? user.email.split("@")[0] : "Member");

          const { error: insertError } = await supabase
            .from("members")
            .insert({
              user_id: user.id,
              name,
              email: user.email ?? "",
              tier: "garage",
              status: "garage_pass",
            });

          if (insertError) {
            setError(
              "We couldn't finish setting up your Garage Pass. Please try again."
            );
            handledRef.current = false;
            return;
          }
        }

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
