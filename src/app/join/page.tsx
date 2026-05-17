"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function JoinPage() {
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    setSigningIn(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/garage/callback",
        },
      });
      if (authError) {
        setError("We couldn't start sign-in. Please try again.");
        setSigningIn(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSigningIn(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-6 py-24">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(201,168,76,0.06)] blur-[120px]" />
        <div className="absolute right-0 top-0 left-0 h-px bg-gradient-to-r from-transparent via-[rgba(201,168,76,0.25)] to-transparent" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-xl border border-[rgba(201,168,76,0.2)] bg-[#111111] px-8 py-12 text-center">
          {/* Wordmark */}
          <div className="mb-10 text-[11px] tracking-[4px] text-[#C9A84C]">
            TTMC
          </div>

          {/* Label */}
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-[rgba(201,168,76,0.4)]" />
            <span className="text-[10px] uppercase tracking-[3px] text-[#C9A84C]">
              Garage Pass
            </span>
            <span className="h-px w-8 bg-[rgba(201,168,76,0.4)]" />
          </div>

          {/* Headline */}
          <h1 className="font-cormorant text-[clamp(30px,5vw,40px)] font-bold leading-tight text-[#F5F5F0]">
            Get Your Garage Pass
          </h1>

          {/* Subcopy */}
          <p className="mx-auto mt-5 max-w-sm text-[15px] font-light leading-relaxed text-[rgba(245,245,240,0.45)]">
            Free access to the world of Top Tier Miami Club. See what members
            experience &mdash; then apply when you&apos;re ready.
          </p>

          {/* CTA */}
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="mt-10 w-full rounded-lg bg-[#C9A84C] px-6 py-4 text-[12px] font-semibold uppercase tracking-[3px] text-[#0A0A0A] transition-all duration-300 hover:bg-[#E8D48B] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signingIn ? "Connecting…" : "Continue with Google"}
          </button>

          {error && (
            <p className="mt-4 text-[12px] text-[#E53E3E]">{error}</p>
          )}

          {/* Footnote */}
          <p className="mt-8 text-[11px] tracking-[1px] text-[rgba(245,245,240,0.3)]">
            No cost. No commitment. Just a look inside.
          </p>
        </div>
      </div>
    </div>
  );
}
