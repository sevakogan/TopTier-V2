"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type MemberRow = {
  status: string | null;
  tier: string | null;
  membership_interest: string | null;
};

type TierKey = "Core" | "VIP" | "Strategic";

type Tier = {
  key: TierKey;
  name: string;
  price: string;
  cadence: string;
  popular: boolean;
  features: string[];
};

const PAID_TIERS = new Set<string>(["Core", "VIP", "Strategic"]);

const TIERS: Tier[] = [
  {
    key: "Core",
    name: "Core",
    price: "$700",
    cadence: "/ year",
    popular: false,
    features: [
      "Access to all member events (RSVP)",
      "Full partner network + discount codes",
      "Member directory",
      "Monthly run + curated experience",
    ],
  },
  {
    key: "VIP",
    name: "VIP",
    price: "$3,000",
    cadence: "/ year",
    popular: true,
    features: [
      "Everything in Core",
      "Priority RSVP + reserved placement",
      "Private secondary gatherings",
      "Concierge access",
      "Priority media coverage at events",
    ],
  },
  {
    key: "Strategic",
    name: "Strategic Circle",
    price: "$6,000",
    cadence: "/ year",
    popular: false,
    features: [
      "Everything in VIP",
      "Co-host up to 3 curated experiences",
      "Direct founder access",
      "Strategic ecosystem visibility",
      "Deal-flow introductions",
    ],
  },
];

const TIER_LABELS: Record<string, string> = {
  Core: "Core",
  VIP: "VIP",
  Strategic: "Strategic Circle",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] uppercase tracking-[4px] text-[#C9A84C]">
      {children}
    </p>
  );
}

function Check({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M5 12.5l4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackLink() {
  return (
    <Link
      href="/garage"
      className="inline-flex items-center text-[12px] uppercase tracking-[2px] text-[rgba(245,245,240,0.45)] transition-colors hover:text-[#C9A84C]"
    >
      &larr; Back to the Garage
    </Link>
  );
}

function ReviewState({ tier }: { tier: string | null }) {
  const tierLabel = tier ? TIER_LABELS[tier] ?? tier : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <BackLink />

      <div className="relative mt-10 overflow-hidden rounded-xl border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.04)] px-8 py-14 text-center">
        <div className="absolute right-0 top-0 left-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(201,168,76,0.4)] bg-[rgba(201,168,76,0.06)]">
          <Check className="h-7 w-7 text-[#C9A84C]" />
        </div>

        <p className="mt-7 font-cormorant text-[clamp(26px,4vw,36px)] font-bold text-[#F5F5F0]">
          Application received
        </p>

        {tierLabel && (
          <p className="mt-4 text-[11px] uppercase tracking-[3px] text-[#C9A84C]">
            {tierLabel}
          </p>
        )}

        <p className="mx-auto mt-5 max-w-md text-[15px] font-light leading-relaxed text-[rgba(245,245,240,0.45)]">
          We review every application personally. Expect to hear from us within
          48 hours. You&apos;ll keep your Garage Pass access in the meantime.
        </p>

        <Link
          href="/garage"
          className="mt-9 inline-block rounded-lg bg-[#C9A84C] px-10 py-4 text-[12px] font-semibold uppercase tracking-[3px] text-[#0A0A0A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#E8D48B]"
        >
          &larr; Back to the Garage
        </Link>
      </div>
    </div>
  );
}

function AlreadyMemberState({ tier }: { tier: string }) {
  const tierLabel = TIER_LABELS[tier] ?? tier;

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <BackLink />

      <div className="mt-10 rounded-xl border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.04)] px-8 py-14 text-center">
        <p className="font-cormorant text-[clamp(26px,4vw,36px)] font-bold text-[#F5F5F0]">
          You&apos;re already a {tierLabel} member
        </p>
        <p className="mx-auto mt-4 max-w-md text-[15px] font-light leading-relaxed text-[rgba(245,245,240,0.45)]">
          Your access is active. Everything the network offers is open to you.
        </p>
        <Link
          href="/garage"
          className="mt-9 inline-block rounded-lg bg-[#C9A84C] px-10 py-4 text-[12px] font-semibold uppercase tracking-[3px] text-[#0A0A0A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#E8D48B]"
        >
          &larr; Back to the Garage
        </Link>
      </div>
    </div>
  );
}

export default function MembershipPage() {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<MemberRow | null>(null);
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (active) setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("members")
          .select("status, tier, membership_interest")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!active) return;

        if (data) {
          setMember(data as MemberRow);
        }
      } catch {
        // Silent fallback — the page degrades to the application form.
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit() {
    if (!selectedTier || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Your session expired. Please sign in again.");
        setSubmitting(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("members")
        .update({
          status: "pending_membership",
          membership_interest: selectedTier,
          applied_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        setError(
          "We couldn't submit your application. Please try again in a moment."
        );
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError(
        "We couldn't submit your application. Please try again in a moment."
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[rgba(245,245,240,0.45)]">
          Opening membership…
        </p>
      </div>
    );
  }

  const status = member?.status ?? "garage_pass";
  const tier = member?.tier ?? "garage";

  if (PAID_TIERS.has(tier)) {
    return <AlreadyMemberState tier={tier} />;
  }

  if (submitted) {
    return <ReviewState tier={selectedTier} />;
  }

  if (status === "pending_membership") {
    return <ReviewState tier={member?.membership_interest ?? null} />;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <BackLink />

      {/* Header */}
      <div className="mt-10">
        <SectionLabel>Membership</SectionLabel>
        <h1 className="font-cormorant text-[clamp(28px,5vw,42px)] font-bold text-[#F5F5F0]">
          Choose Your Lane
        </h1>
        <p className="mt-4 max-w-xl text-[15px] font-light leading-relaxed text-[rgba(245,245,240,0.45)]">
          Three tiers. Every one unlocks the full network. The difference is
          depth of access.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {TIERS.map((t) => {
          const isSelected = selectedTier === t.key;
          return (
            <div
              key={t.key}
              className={`relative flex flex-col rounded-xl border bg-[#111111] p-7 transition-colors duration-300 ${
                isSelected
                  ? "border-[#C9A84C]"
                  : t.popular
                    ? "border-[rgba(201,168,76,0.35)]"
                    : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(201,168,76,0.2)]"
              } ${t.popular ? "lg:-translate-y-3" : ""}`}
            >
              {t.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-[rgba(201,168,76,0.4)] bg-[#0A0A0A] px-4 py-1.5 text-[10px] uppercase tracking-[3px] text-[#C9A84C]">
                  Most Popular
                </span>
              )}

              <p className="text-[11px] uppercase tracking-[4px] text-[#C9A84C]">
                {t.name}
              </p>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-cormorant text-[clamp(36px,5vw,48px)] font-bold leading-none text-[#F5F5F0]">
                  {t.price}
                </span>
                <span className="text-[13px] text-[rgba(245,245,240,0.45)]">
                  {t.cadence}
                </span>
              </div>

              <div className="mt-7 h-px bg-[rgba(201,168,76,0.12)]" />

              <ul className="mt-7 flex-1 space-y-4">
                {t.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-[14px] font-light leading-relaxed text-[rgba(245,245,240,0.7)]"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A84C]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => setSelectedTier(t.key)}
                aria-pressed={isSelected}
                className={`mt-9 w-full rounded-lg px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[3px] transition-all duration-300 ${
                  isSelected
                    ? "bg-[#C9A84C] text-[#0A0A0A]"
                    : "border border-[rgba(201,168,76,0.35)] text-[#C9A84C] hover:border-[#C9A84C] hover:bg-[rgba(201,168,76,0.06)]"
                }`}
              >
                {isSelected ? "Selected" : `Select ${t.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Submit */}
      <div className="mt-14 text-center">
        {error && (
          <p className="mb-6 text-[13px] text-[#E53E3E]">{error}</p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedTier || submitting}
          className="inline-block rounded-lg bg-[#C9A84C] px-12 py-4 text-[12px] font-semibold uppercase tracking-[3px] text-[#0A0A0A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#E8D48B] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:bg-[#C9A84C]"
        >
          {submitting ? "Submitting…" : "Submit Application"}
        </button>

        <p className="mt-5 text-[12px] font-light text-[rgba(245,245,240,0.3)]">
          Every application is reviewed personally. You keep your Garage Pass
          while we review.
        </p>
      </div>
    </div>
  );
}
