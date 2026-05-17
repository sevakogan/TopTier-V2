"use client";

import { useEffect, useState } from "react";
import { SectionReveal } from "@/components/section-reveal";
import { TiltCard } from "@/components/tilt-card";
import { listActivePartners } from "@/lib/backend/partners";
import type { PartnerCard } from "@/lib/backend/types";

interface CategoryGroup {
  readonly key: string;
  readonly icon: string;
  readonly label: string;
  readonly partners: readonly PartnerCard[];
}

const CATEGORY_ICONS: Record<string, string> = {
  automotive: "🏎",
  dining: "⭐",
  "dining & nightlife": "⭐",
  nightlife: "⭐",
  lifestyle: "👑",
  "lifestyle & experiences": "👑",
  experiences: "👑",
};

function iconFor(category: string): string {
  return CATEGORY_ICONS[category.trim().toLowerCase()] ?? "✨";
}

function groupByCategory(partners: PartnerCard[]): CategoryGroup[] {
  const map = new Map<string, PartnerCard[]>();
  for (const p of partners) {
    const key = (p.category || "Other").trim();
    const existing = map.get(key) ?? [];
    map.set(key, [...existing, p]);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, list]) => ({
      key,
      icon: iconFor(key),
      label: key.toUpperCase(),
      partners: list,
    }));
}

export function PerksList() {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const partners = await listActivePartners();
        if (active) setGroups(groupByCategory(partners));
      } catch {
        // Silent fallback — page degrades to an empty state.
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="max-w-5xl mx-auto pt-36 pb-32 px-6">
      <SectionReveal>
        <p className="text-[14px] tracking-[5px] text-[#C9A84C] mb-4">
          SPONSOR NETWORK
        </p>
        <h1 className="font-cormorant text-[clamp(36px,5vw,64px)] font-bold">
          Member <span className="text-[#C9A84C]">Perks</span>
        </h1>
        <p className="text-[15px] text-[rgba(245,245,240,0.4)] max-w-lg leading-relaxed mt-4">
          Your membership unlocks access across our vetted sponsor network.
        </p>
      </SectionReveal>

      {!loading && groups.length === 0 ? (
        <div className="mt-16 border border-[rgba(255,255,255,0.05)] p-12 rounded-xl text-center text-[15px] text-[rgba(245,245,240,0.4)]">
          Partners being onboarded now.
        </div>
      ) : (
        <div className="mt-16 space-y-16">
          {groups.map((category) => (
            <SectionReveal key={category.label}>
              <div className="flex items-center gap-3 border-b border-[rgba(201,168,76,0.12)] pb-4 mb-6">
                <span className="text-[#C9A84C]">{category.icon}</span>
                <span className="text-[14px] tracking-[4px] font-semibold text-[#C9A84C]">
                  {category.label}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {category.partners.map((perk, perkIndex) => (
                  <SectionReveal key={perk.id} delay={0.06 * perkIndex}>
                    <TiltCard>
                      <div className="border border-[rgba(255,255,255,0.05)] p-6 rounded-xl group transition-colors hover:border-[rgba(201,168,76,0.2)] hover:bg-[rgba(201,168,76,0.02)]">
                        <div className="flex justify-between items-start gap-3">
                          <h3 className="font-cormorant text-lg font-semibold group-hover:text-[#C9A84C] transition-colors">
                            {perk.name}
                          </h3>
                          {perk.website && (
                            <a
                              href={perk.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="bg-[#C9A84C] text-[#0a0a0a] text-[13px] tracking-[1px] font-bold px-2 py-0.5 rounded shrink-0 hover:bg-[#E8D48B] transition-colors"
                            >
                              VISIT
                            </a>
                          )}
                        </div>

                        {perk.description && (
                          <p className="text-[13px] text-[rgba(245,245,240,0.35)] leading-relaxed mt-2">
                            {perk.description}
                          </p>
                        )}
                      </div>
                    </TiltCard>
                  </SectionReveal>
                ))}
              </div>
            </SectionReveal>
          ))}
        </div>
      )}
    </main>
  );
}
