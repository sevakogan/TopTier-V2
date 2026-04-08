import { SectionReveal } from "@/components/section-reveal";
import { TiltCard } from "@/components/tilt-card";

export const metadata = {
  title: "Events — Top Tier Miami Club",
  description: "Where we've been. Every event is invitation-only.",
};

const events = [
  {
    title: "TTMC × Shift Arcade Takeover",
    date: "MAY 2026",
    location: "Shift Arcade, Wynwood",
    type: "VENUE ACTIVATION",
    description:
      "Twenty-three cars lined up outside Shift Arcade in Wynwood. Inside, members raced each other on full-motion simulators. At midnight, the convoy rolled out through Wynwood. Drone footage is still circulating.",
    color: "bg-[#C9A84C]",
  },
  {
    title: "Midnight Run: Key Biscayne",
    date: "APR 2026",
    location: "Brickell → Key Biscayne",
    type: "NIGHT RUN",
    description:
      "Twenty cars through the causeway under the moonlight. Photo stops at the bridge. The convoy pulled into a private waterfront spot for dinner. Nobody posted the location.",
    color: "bg-blue-500",
  },
  {
    title: "Nick Castle's VIP Night",
    date: "MAR 2026",
    location: "Nick Castle's, Miami Beach",
    type: "PRIVATE DINNER",
    description:
      "One of Miami's most reserved venues. Twelve members at the table. No phones. The kind of introductions that don't happen at networking events.",
    color: "bg-purple-500",
  },
  {
    title: "SCS × Hard Rock Cruise",
    date: "FEB 2026",
    location: "Hard Rock → Bayfront Park",
    type: "COLLABORATION",
    description:
      "Joint cruise with Supercar Society. Forty exotics rolling through Biscayne. Local media covered it. Two new sponsorship deals closed that night.",
    color: "bg-red-500",
  },
  {
    title: "Wynwood Art Basel Run",
    date: "DEC 2025",
    location: "Wynwood Arts District",
    type: "SPECIAL EVENT",
    description:
      "Art Basel weekend. Exotics parked at curated murals across Wynwood. Select non-members were invited. Content from that night is still making rounds.",
    color: "bg-pink-500",
  },
  {
    title: "Founders Circle Dinner",
    date: "NOV 2025",
    location: "Undisclosed",
    type: "INNER CIRCLE",
    description:
      "Quarterly. Twelve seats. No phones. Deal flow conversations and direct intros that changed businesses.",
    color: "bg-emerald-500",
  },
] as const;

export default function EventsPage() {
  return (
    <main className="max-w-4xl mx-auto pt-36 pb-32 px-6">
      <SectionReveal>
        <p className="text-[10px] tracking-[5px] text-[#C9A84C] mb-4">
          MEMBER EVENTS
        </p>
        <h1 className="font-cormorant text-[clamp(36px,5vw,64px)] font-bold">
          Where We&apos;ve <span className="text-[#C9A84C]">Been</span>
        </h1>
        <p className="text-[15px] text-[rgba(245,245,240,0.4)] max-w-lg leading-relaxed mt-4">
          Every event is invitation-only. Here&apos;s what our members have
          experienced.
        </p>
      </SectionReveal>

      <div className="mt-16 space-y-3">
        {events.map((event, index) => (
          <SectionReveal key={event.title} delay={0.06 * index}>
            <TiltCard>
              <div className="border border-[rgba(255,255,255,0.05)] p-8 rounded-xl relative overflow-hidden group transition-colors hover:border-[rgba(201,168,76,0.2)] hover:bg-[rgba(201,168,76,0.015)]">
                <div
                  className={`absolute left-0 top-0 bottom-0 w-[3px] ${event.color} opacity-0 group-hover:opacity-100 transition-opacity`}
                />

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] tracking-[2px] font-semibold text-[#C9A84C] border border-[rgba(201,168,76,0.3)] px-2 py-0.5 rounded">
                      {event.type}
                    </span>
                    <span className="text-[11px] text-[rgba(245,245,240,0.3)]">
                      {event.date}
                    </span>
                  </div>
                  <span className="text-[12px] text-[rgba(245,245,240,0.3)]">
                    {"\uD83D\uDCCD"} {event.location}
                  </span>
                </div>

                <h2 className="font-cormorant text-2xl font-semibold mt-3 group-hover:text-[#C9A84C] transition-colors">
                  {event.title}
                </h2>

                <p className="text-[13px] text-[rgba(245,245,240,0.35)] leading-relaxed mt-3 max-w-2xl">
                  {event.description}
                </p>
              </div>
            </TiltCard>
          </SectionReveal>
        ))}
      </div>
    </main>
  );
}
