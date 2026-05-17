"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type MemberRow = {
  name: string | null;
  status: string | null;
  tier: string | null;
};

type EventTeaser = {
  id: string;
  title: string;
  monthYear: string;
};

type PerkCategoryTeaser = {
  key: string;
  label: string;
  count: number;
};

const PAID_TIERS = new Set(["Core", "VIP", "Strategic"]);

const PERK_CATEGORY_LABELS: Record<string, string> = {
  automotive: "AUTOMOTIVE",
  dining: "DINING & NIGHTLIFE",
  lifestyle: "LIFESTYLE",
};

const PERK_CATEGORY_ORDER = ["automotive", "dining", "lifestyle"];

function Lock({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="5"
        y="10.5"
        width="14"
        height="9.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M8 10.5V8a4 4 0 0 1 8 0v2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MembersOnlyDivider() {
  return (
    <div className="my-1 flex items-center gap-3">
      <span className="h-px flex-1 bg-[rgba(201,168,76,0.12)]" />
      <span className="text-[9px] uppercase tracking-[3px] text-[rgba(201,168,76,0.4)]">
        members only
      </span>
      <span className="h-px flex-1 bg-[rgba(201,168,76,0.12)]" />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] uppercase tracking-[4px] text-[#C9A84C]">
      {children}
    </p>
  );
}

export default function GaragePage() {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<MemberRow | null>(null);
  const [events, setEvents] = useState<EventTeaser[]>([]);
  const [perkCategories, setPerkCategories] = useState<PerkCategoryTeaser[]>(
    []
  );
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const today = new Date().toISOString().split("T")[0];

        const [memberRes, eventsRes, perksRes, countRes] = await Promise.all([
          supabase
            .from("members")
            .select("name, status, tier")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("events")
            .select("id, name, date, is_public")
            .gte("date", today)
            .order("date", { ascending: true }),
          supabase.from("perks").select("category, is_active"),
          supabase
            .from("members")
            .select("id", { count: "exact", head: true })
            .eq("status", "active"),
        ]);

        if (!active) return;

        if (memberRes.data) {
          setMember(memberRes.data as MemberRow);
        }

        const rawEvents = (eventsRes.data ?? []) as Array<{
          id: string;
          name: string | null;
          date: string;
          is_public: boolean | null;
        }>;

        const teaserEvents: EventTeaser[] = rawEvents
          .filter((e) => e.is_public !== false)
          .slice(0, 5)
          .map((e) => ({
            id: e.id,
            title: e.name ?? "Untitled Run",
            monthYear: new Date(e.date).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            }),
          }));
        setEvents(teaserEvents);

        const rawPerks = (perksRes.data ?? []) as Array<{
          category: string | null;
          is_active: boolean | null;
        }>;
        const counts = new Map<string, number>();
        for (const perk of rawPerks) {
          if (perk.is_active === false) continue;
          const key = (perk.category ?? "").toLowerCase();
          if (!PERK_CATEGORY_LABELS[key]) continue;
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const categories: PerkCategoryTeaser[] = PERK_CATEGORY_ORDER.filter(
          (key) => counts.has(key)
        ).map((key) => ({
          key,
          label: PERK_CATEGORY_LABELS[key],
          count: counts.get(key) ?? 0,
        }));
        setPerkCategories(categories);

        setMemberCount(countRes.count ?? 0);
      } catch {
        // Silent fallback — the dashboard degrades to empty states.
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[rgba(245,245,240,0.45)]">
          Opening the garage…
        </p>
      </div>
    );
  }

  const firstName = (member?.name ?? "Driver").split(" ")[0];
  const status = member?.status ?? "garage_pass";
  const tier = member?.tier ?? "garage";

  const isPaidMember = PAID_TIERS.has(tier);
  const isPending = status === "pending_membership";

  function ConversionBlock() {
    if (isPaidMember) {
      return (
        <div className="rounded-xl border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.04)] px-8 py-10 text-center">
          <p className="font-cormorant text-2xl font-bold text-[#F5F5F0]">
            You&apos;re a {tier} member
          </p>
          <p className="mt-3 text-[14px] text-[rgba(245,245,240,0.45)]">
            Your full member dashboard is coming soon.
          </p>
        </div>
      );
    }

    if (isPending) {
      return (
        <div className="rounded-xl border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.04)] px-8 py-10 text-center">
          <p className="font-cormorant text-2xl font-bold text-[#F5F5F0]">
            Application under review
          </p>
          <p className="mt-3 text-[14px] text-[rgba(245,245,240,0.45)]">
            We respond within 48 hours. Keep an eye on your inbox.
          </p>
        </div>
      );
    }

    return (
      <div className="relative overflow-hidden rounded-xl border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.04)] px-8 py-10 text-center">
        <div className="absolute right-0 top-0 left-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />
        <p className="font-cormorant text-[clamp(26px,4vw,36px)] font-bold text-[#F5F5F0]">
          Ready to go further?
        </p>
        <p className="mx-auto mt-4 max-w-md text-[15px] font-light leading-relaxed text-[rgba(245,245,240,0.45)]">
          Membership unlocks every event, every partner, every introduction.
        </p>
        <Link
          href="/garage/membership"
          className="mt-8 inline-block rounded-lg bg-[#C9A84C] px-10 py-4 text-[12px] font-semibold uppercase tracking-[3px] text-[#0A0A0A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#E8D48B]"
        >
          Apply for Membership &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      {/* Welcome header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-cormorant text-[clamp(28px,5vw,42px)] font-bold text-[#F5F5F0]">
          Welcome to the Garage, {firstName}
        </h1>
        <span className="rounded-full border border-[rgba(201,168,76,0.4)] px-4 py-1.5 text-[10px] uppercase tracking-[3px] text-[#C9A84C]">
          {isPaidMember ? `${tier} Member` : "Garage Pass"}
        </span>
      </div>

      <p className="mt-4 text-[15px] font-light leading-relaxed text-[rgba(245,245,240,0.45)]">
        You&apos;re seeing the shape of it. Members see all of it.
      </p>

      {/* Top conversion block */}
      <div className="mt-10">
        <ConversionBlock />
      </div>

      {/* What members experience */}
      <div className="mt-16">
        <SectionLabel>What Members Experience</SectionLabel>
        <h2 className="font-cormorant text-2xl font-bold text-[#F5F5F0]">
          Upcoming Experiences
        </h2>

        <div className="mt-6 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111]">
          {events.length === 0 ? (
            <div className="px-6 py-12 text-center text-[14px] text-[rgba(245,245,240,0.45)]">
              New runs announced soon.
            </div>
          ) : (
            events.map((event, idx) => (
              <div
                key={event.id}
                className={`px-6 py-5 ${
                  idx > 0
                    ? "border-t border-[rgba(255,255,255,0.04)]"
                    : ""
                }`}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-cormorant text-xl font-semibold text-[#F5F5F0]">
                    {event.title}
                  </p>
                  <span className="shrink-0 text-[12px] uppercase tracking-[2px] text-[rgba(245,245,240,0.45)]">
                    {event.monthYear}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[12px] italic text-[rgba(245,245,240,0.3)]">
                  <Lock className="h-3.5 w-3.5 text-[rgba(201,168,76,0.5)]" />
                  <span className="select-none blur-[0.5px]">
                    Location revealed to members
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Perks teaser */}
      <div className="mt-16">
        <SectionLabel>The Partner Network</SectionLabel>
        <h2 className="font-cormorant text-2xl font-bold text-[#F5F5F0]">
          Member Perks
        </h2>

        {perkCategories.length === 0 ? (
          <div className="mt-6 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] px-6 py-12 text-center text-[14px] text-[rgba(245,245,240,0.45)]">
            Partners being onboarded now.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {perkCategories.map((cat) => (
              <div
                key={cat.key}
                className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-6 transition-colors hover:border-[rgba(201,168,76,0.2)]"
              >
                <p className="text-[10px] uppercase tracking-[3px] text-[#C9A84C]">
                  {cat.label}
                </p>
                <p className="mt-3 font-cormorant text-3xl font-bold text-[#F5F5F0]">
                  {cat.count}
                  <span className="ml-2 text-[13px] font-normal not-italic text-[rgba(245,245,240,0.45)]">
                    partner{cat.count === 1 ? "" : "s"}
                  </span>
                </p>
                <div className="mt-5 flex items-center gap-2 text-[11px] italic text-[rgba(245,245,240,0.3)]">
                  <Lock className="h-3.5 w-3.5 text-[rgba(201,168,76,0.5)]" />
                  <span className="select-none blur-[0.5px]">
                    Brands &amp; codes unlock with membership
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* The Network stat */}
      <div className="mt-16">
        <MembersOnlyDivider />
        <div className="mt-8 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] px-8 py-12 text-center">
          <p className="font-cormorant text-[clamp(56px,12vw,88px)] font-bold leading-none text-[#C9A84C]">
            {memberCount}
          </p>
          <p className="mt-4 text-[12px] uppercase tracking-[4px] text-[#F5F5F0]">
            Vetted Members
          </p>
          <p className="mt-2 text-[12px] text-[rgba(245,245,240,0.3)]">
            Growing every month
          </p>
        </div>
      </div>

      {/* Bottom conversion block */}
      <div className="mt-16">
        <ConversionBlock />
      </div>
    </div>
  );
}
