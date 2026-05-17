"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type EmailMode = "magic" | "password";
type PasswordIntent = "new" | "returning";

export default function JoinPage() {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "google" | "magic" | "password">(
    null
  );
  const [emailMode, setEmailMode] = useState<EmailMode>("magic");
  const [pwIntent, setPwIntent] = useState<PasswordIntent>("new");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  const redirectTo =
    typeof window !== "undefined"
      ? window.location.origin + "/garage/callback"
      : undefined;

  async function handleGoogle() {
    setError(null);
    setBusy("google");
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (authError) {
        setError("We couldn't start sign-in. Please try again.");
        setBusy(null);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(null);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Enter your email to receive a sign-in link.");
      return;
    }
    setBusy("magic");
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });
      if (otpError) {
        setError("We couldn't send the link. Check the email and try again.");
        setBusy(null);
        return;
      }
      setMagicSent(true);
      setBusy(null);
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(null);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and a password.");
      return;
    }
    if (pwIntent === "new" && password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    setBusy("password");
    try {
      if (pwIntent === "new") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (signUpError) {
          const msg = signUpError.message.toLowerCase();
          if (msg.includes("already")) {
            setError(
              "That email already has an account. Switch to “Returning”."
            );
          } else {
            setError("We couldn't create the account. Please try again.");
          }
          setBusy(null);
          return;
        }
        // If email confirmation is required there is no session yet.
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setMagicSent(true); // reuse "check your email" confirmation state
          setBusy(null);
          return;
        }
        router.push("/garage/callback");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError("Email or password is incorrect.");
        setBusy(null);
        return;
      }
      router.push("/garage/callback");
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(null);
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

          {magicSent ? (
            <>
              <div className="mb-5 flex items-center justify-center gap-3">
                <span className="h-px w-8 bg-[rgba(201,168,76,0.4)]" />
                <span className="text-[10px] uppercase tracking-[3px] text-[#C9A84C]">
                  Check your email
                </span>
                <span className="h-px w-8 bg-[rgba(201,168,76,0.4)]" />
              </div>
              <h1 className="font-cormorant text-[clamp(28px,5vw,38px)] font-bold leading-tight text-[#F5F5F0]">
                The door is in your inbox
              </h1>
              <p className="mx-auto mt-5 max-w-sm text-[15px] font-light leading-relaxed text-[rgba(245,245,240,0.45)]">
                We sent a sign-in link to{" "}
                <span className="text-[rgba(245,245,240,0.7)]">{email}</span>.
                Open it on this device to enter the Garage.
              </p>
              <button
                onClick={() => {
                  setMagicSent(false);
                  setError(null);
                }}
                className="mt-10 text-[12px] tracking-[1px] text-[rgba(245,245,240,0.4)] underline decoration-[rgba(201,168,76,0.4)] underline-offset-4 transition-colors hover:text-[#C9A84C]"
              >
                Use a different method
              </button>
            </>
          ) : (
            <>
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
                Free access to the world of Top Tier Miami Club. See what
                members experience &mdash; then apply when you&apos;re ready.
              </p>

              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={busy !== null}
                className="mt-9 w-full rounded-lg bg-[#C9A84C] px-6 py-4 text-[12px] font-semibold uppercase tracking-[3px] text-[#0A0A0A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#E8D48B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "google" ? "Connecting…" : "Continue with Google"}
              </button>

              {/* Divider */}
              <div className="my-7 flex items-center gap-4">
                <span className="h-px flex-1 bg-[rgba(255,255,255,0.08)]" />
                <span className="text-[10px] uppercase tracking-[2px] text-[rgba(245,245,240,0.3)]">
                  or with email
                </span>
                <span className="h-px flex-1 bg-[rgba(255,255,255,0.08)]" />
              </div>

              {/* Email method toggle */}
              <div className="mb-5 flex rounded-lg border border-[rgba(255,255,255,0.08)] p-1">
                {(["magic", "password"] as EmailMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setEmailMode(m);
                      setError(null);
                    }}
                    className={`flex-1 rounded-md px-3 py-2 text-[11px] uppercase tracking-[2px] transition-colors ${
                      emailMode === m
                        ? "bg-[rgba(201,168,76,0.15)] text-[#C9A84C]"
                        : "text-[rgba(245,245,240,0.4)] hover:text-[rgba(245,245,240,0.7)]"
                    }`}
                  >
                    {m === "magic" ? "Magic link" : "Password"}
                  </button>
                ))}
              </div>

              {emailMode === "magic" ? (
                <form onSubmit={handleMagicLink} className="space-y-3 text-left">
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0A0A0A] px-4 py-3.5 text-[14px] text-[#F5F5F0] outline-none transition-colors placeholder:text-[rgba(245,245,240,0.25)] focus:border-[rgba(201,168,76,0.5)]"
                  />
                  <button
                    type="submit"
                    disabled={busy !== null}
                    className="w-full rounded-lg border border-[rgba(201,168,76,0.4)] px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[3px] text-[#C9A84C] transition-all duration-300 hover:bg-[rgba(201,168,76,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy === "magic" ? "Sending…" : "Email me a sign-in link"}
                  </button>
                  <p className="pt-1 text-center text-[11px] tracking-[1px] text-[rgba(245,245,240,0.3)]">
                    No password. We email you a one-time link.
                  </p>
                </form>
              ) : (
                <form onSubmit={handlePassword} className="space-y-3 text-left">
                  <div className="mb-1 flex rounded-lg border border-[rgba(255,255,255,0.08)] p-1">
                    {(["new", "returning"] as PasswordIntent[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setPwIntent(p);
                          setError(null);
                        }}
                        className={`flex-1 rounded-md px-3 py-1.5 text-[10px] uppercase tracking-[2px] transition-colors ${
                          pwIntent === p
                            ? "bg-[rgba(201,168,76,0.12)] text-[#C9A84C]"
                            : "text-[rgba(245,245,240,0.35)] hover:text-[rgba(245,245,240,0.6)]"
                        }`}
                      >
                        {p === "new" ? "New here" : "Returning"}
                      </button>
                    ))}
                  </div>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0A0A0A] px-4 py-3.5 text-[14px] text-[#F5F5F0] outline-none transition-colors placeholder:text-[rgba(245,245,240,0.25)] focus:border-[rgba(201,168,76,0.5)]"
                  />
                  <input
                    type="password"
                    autoComplete={
                      pwIntent === "new" ? "new-password" : "current-password"
                    }
                    placeholder={
                      pwIntent === "new"
                        ? "Create a password (8+ characters)"
                        : "Your password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0A0A0A] px-4 py-3.5 text-[14px] text-[#F5F5F0] outline-none transition-colors placeholder:text-[rgba(245,245,240,0.25)] focus:border-[rgba(201,168,76,0.5)]"
                  />
                  <button
                    type="submit"
                    disabled={busy !== null}
                    className="w-full rounded-lg border border-[rgba(201,168,76,0.4)] px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[3px] text-[#C9A84C] transition-all duration-300 hover:bg-[rgba(201,168,76,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy === "password"
                      ? "Working…"
                      : pwIntent === "new"
                        ? "Create Garage Pass"
                        : "Sign in"}
                  </button>
                </form>
              )}

              {error && (
                <p className="mt-4 text-[12px] text-[#E53E3E]">{error}</p>
              )}

              {/* Footnote */}
              <p className="mt-8 text-[11px] tracking-[1px] text-[rgba(245,245,240,0.3)]">
                No cost. No commitment. Just a look inside.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
