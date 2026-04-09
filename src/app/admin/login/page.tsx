"use client";

import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/admin/callback",
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
      <div className="text-center max-w-sm w-full px-6">
        <div className="text-[11px] tracking-[4px] text-[#C9A84C] mb-8">
          TTMC
        </div>

        <h1 className="text-[#F5F5F0] text-xl font-semibold mb-8">
          Admin Access
        </h1>

        <button
          onClick={handleGoogleSignIn}
          className="w-full rounded-lg px-6 py-3 text-[11px] tracking-[2px] font-semibold border border-[#C9A84C] text-[#C9A84C] bg-transparent transition-colors hover:bg-[#C9A84C] hover:text-[#0A0A0A]"
        >
          Sign in with Google
        </button>

        <p className="mt-8 text-[rgba(245,245,240,0.2)] text-[11px] tracking-[1px]">
          Authorized administrators only
        </p>
      </div>
    </div>
  );
}
