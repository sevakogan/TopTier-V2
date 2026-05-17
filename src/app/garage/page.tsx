"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getMemberSnapshot } from "@/lib/backend/membership";
import { listActivePartners, summarizeByCategory } from "@/lib/backend/partners";
import type { AccountStage } from "@/lib/backend/types";

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

const STATIC_MEMBER_COUNT = 50;

export default function GaragePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<AccountStage>("garage_pass");
  const [tierDisplay, setTierDisplay] = useState<string>("Garage Pass");
  const [appliedTier, setAppliedTier] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("Driver");
  const [events, setEvents] = useState<EventTeaser[]>([]);
  const [perkCategories, setPerkCategories] = useState<PerkCategoryTeaser[]>(
    []
  );
  const [memberCount, setMemberCount] = useState(STATIC_MEMBER_COUNT);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user;
        if (!session || !user) {
          router.push("/join");
          return;
        }

        const meta = user.user_metadata ?? {};
        const name =
          (typeof meta.full_name === "string" && meta.full_name) ||
          (typeof meta.name === "string" && meta.name) ||
          (user.email ? user.email.split("@")[0] : "Driver");
        if (active) setFirstName(name.split(" ")[0] || "Driver");

        const today = new Date().toISOString().split("T")[0];

        const [snapshot, partners, eventsRes, countRes] = await Promise.all([
          getMemberSnapshot(user.id, user.email ?? ""),
          listActivePartners(),
          supabase
            .from("events")
            .select("id, name, date, is_public")
            .gte("date", today)
            .order("date", { ascending: true }),
          supabase
            .from("member_profiles")
            .select("id", { count: "exact", head: true })
            .eq("membership_status", "ACTIVE"),
        ]);

        if (!active) return;

        setStage(snapshot.stage);
        setTierDisplay(snapshot.tierDisplay);
        setAppliedTier(snapshot.appliedTier);

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

        const categories: PerkCategoryTeaser[] = summarizeByCategory(
          partners
        ).map(({ category, count }) => ({
          key: category,
          label: category.toUpperCase(),
          count,
        }));
        setPerkCategories(categories);

        if (typeof countRes.count === "number" && !countRes.error) {
          setMemberCount(countRes.count);
        }
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
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[rgba(245,245,240,0.45)]">
          Opening the garage…
        </p>
      </div>
    );
  }

  const isPaidMember = stage === "member";
  const isPending = stage === "applied";
  const appliedTierDisplay = appliedTier ? appliedTier.toUpperCase() : null;

  function ConversionBlock() {
    if (isPaidMember) {
      return (
        <div className="rounded-xl border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.04)] px-8 py-10 text-center">
          <p className="font-cormorant text-2xl font-bold text-[#F5F5F0]">
            You&apos;re a {tierDisplay} member
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
          {appliedTierDisplay && (
            <p className="mt-3 text-[11px] uppercase tracking-[3px] text-[#C9A84C]">
              {appliedTierDisplay}
            </p>
          )}
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
          {isPaidMember ? `${tierDisplay} Member` : "Garage Pass"}
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
