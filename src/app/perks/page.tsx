import { SectionReveal } from "@/components/section-reveal";
import { TiltCard } from "@/components/tilt-card";

export const metadata = {
  title: "Perks — Top Tier Miami Club",
  description: "Member perks across our vetted sponsor network.",
};

interface Perk {
  readonly name: string;
  readonly sponsor?: string;
  readonly badge: string;
  readonly description: string;
  readonly credibility?: string;
}

interface Category {
  readonly icon: string;
  readonly label: string;
  readonly perks: readonly Perk[];
}

const categories: readonly Category[] = [
  {
    icon: "\uD83C\uDFCE",
    label: "AUTOMOTIVE",
    perks: [
      {
        name: "Priority Detailing",
        sponsor: "LuxeShine",
        badge: "25% OFF",
        description:
          "Ceramic coating, PPF, and full detail packages at member rates.",
        credibility: "Miami's highest-rated ceramic studio",
      },
      {
        name: "Performance Tuning",
        sponsor: "TuneHaus",
        badge: "15% OFF",
        description:
          "ECU tuning, exhaust upgrades, and performance packages for exotics.",
        credibility: "Featured in DriveTribe",
      },
      {
        name: "Premium Tint",
        sponsor: "Tint Masters",
        badge: "20% OFF",
        description:
          "Ceramic tint, PPF, and vinyl wraps from Miami's top-rated shop.",
        credibility: "Trusted by 40+ TTMC members",
      },
      {
        name: "Exotic Storage",
        sponsor: "Miami Vault",
        badge: "PRIORITY",
        description:
          "Climate-controlled storage with concierge pickup and delivery.",
        credibility: "Used by collectors citywide",
      },
    ],
  },
  {
    icon: "\u2B50",
    label: "DINING & NIGHTLIFE",
    perks: [
      {
        name: "Nick Castle's Miami Beach",
        badge: "COMP TABLE",
        description:
          "Reserved table for TTMC members on select nights. No cover, no wait.",
      },
      {
        name: "Zuma Miami",
        badge: "15% OFF",
        description:
          "Contemporary Japanese cuisine in the heart of Brickell. Member pricing on omakase.",
        credibility: "Michelin-recognized Japanese cuisine",
      },
      {
        name: "LIV & STORY VIP",
        badge: "BOTTLE DEAL",
        description:
          "Priority entry and bottle service packages at Miami's top nightlife venues.",
      },
    ],
  },
  {
    icon: "\uD83D\uDC51",
    label: "LIFESTYLE & EXPERIENCES",
    perks: [
      {
        name: "Shift Arcade Wynwood",
        badge: "FREE SESSION",
        description:
          "Complimentary simulator session for members. Group bookings available.",
      },
      {
        name: "XO Private Aviation",
        badge: "10% OFF",
        description:
          "Private jet and shared charter flights at member rates. Miami to anywhere.",
      },
      {
        name: "Prestige Watch Group",
        badge: "VIP ACCESS",
        description:
          "Pre-release access and member pricing on luxury timepieces.",
      },
      {
        name: "South Beach Yacht Club",
        badge: "DAY PASS",
        description:
          "Complimentary day pass for members. Access to marina, lounge, and events.",
      },
    ],
  },
] as const;

export default function PerksPage() {
  return (
    <main className="max-w-5xl mx-auto pt-36 pb-32 px-6">
      <SectionReveal>
        <p className="text-[10px] tracking-[5px] text-[#C9A84C] mb-4">
          SPONSOR NETWORK
        </p>
        <h1 className="font-cormorant text-[clamp(36px,5vw,64px)] font-bold">
          Member <span className="text-[#C9A84C]">Perks</span>
        </h1>
        <p className="text-[15px] text-[rgba(245,245,240,0.4)] max-w-lg leading-relaxed mt-4">
          Your membership unlocks access across our vetted sponsor network.
        </p>
      </SectionReveal>

      <div className="mt-16 space-y-16">
        {categories.map((category) => (
          <SectionReveal key={category.label}>
            <div className="flex items-center gap-3 border-b border-[rgba(201,168,76,0.12)] pb-4 mb-6">
              <span className="text-[#C9A84C]">{category.icon}</span>
              <span className="text-[10px] tracking-[4px] font-semibold text-[#C9A84C]">
                {category.label}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {category.perks.map((perk, perkIndex) => (
                <SectionReveal key={perk.name} delay={0.06 * perkIndex}>
                  <TiltCard>
                    <div className="border border-[rgba(255,255,255,0.05)] p-6 rounded-xl group transition-colors hover:border-[rgba(201,168,76,0.2)] hover:bg-[rgba(201,168,76,0.02)]">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="font-cormorant text-lg font-semibold group-hover:text-[#C9A84C] transition-colors">
                          {perk.name}
                          {perk.sponsor && (
                            <span className="text-[12px] text-[rgba(245,245,240,0.3)] font-sans font-normal ml-2">
                              {perk.sponsor}
                            </span>
                          )}
                        </h3>
                        <span className="bg-[#C9A84C] text-[#0a0a0a] text-[9px] tracking-[1px] font-bold px-2 py-0.5 rounded shrink-0">
                          {perk.badge}
                        </span>
                      </div>

                      <p className="text-[13px] text-[rgba(245,245,240,0.35)] leading-relaxed mt-2">
                        {perk.description}
                      </p>

                      {perk.credibility && (
                        <p className="text-[11px] text-[rgba(201,168,76,0.5)] mt-2 italic">
                          {perk.credibility}
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
    </main>
  );
}
