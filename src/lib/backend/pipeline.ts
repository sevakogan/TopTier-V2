// SERVER-ONLY. The unified Pipeline: every person across the 8 columns,
// computed from V1's real tables. Service-role; call from API routes only.
//
//  Column            Source (V1)
//  ----------------- ---------------------------------------------------
//  New               invite_requests.status = PENDING
//  In Review         invite_requests.status = APPROVED
//  Declined          invite_requests.status = REJECTED
//                    (+ member_profiles status REJECTED)
//  Garage Membership profiles WITHOUT an ACTIVE member_profiles row and
//                    WITHOUT an open invite_request (free signups)
//  Core              member_profiles.tier = CORE        (active)
//  VIP               member_profiles.tier IN (EXECUTIVE, EXECUTIVE_ELITE)
//  Strategic Circle  member_profiles.tier = STRATEGIC   (active)
//  Partners          trusted_partners
//
// Private clubs are hundreds of rows, not millions — we fetch the few
// source tables and bucket in memory (simple, correct, fast enough).

import { createServiceClient } from "@/lib/supabase-server";

export type PipelineStage =
  | "New"
  | "Review"
  | "Garage"
  | "Core"
  | "VIP"
  | "Strategic"
  | "Partners"
  | "Declined";

export type PersonType = "applicant" | "garage" | "member" | "partner";

export interface PipelineItem {
  /** Stable composite id: `${type}:${recordId}` (record differs per type). */
  id: string;
  type: PersonType;
  recordId: string;
  stage: PipelineStage;
  name: string;
  email: string;
  /** One-line context for the card (tier/car/etc.). */
  subtitle: string;
  createdAt: string | null;
}

const ACTIVE = new Set(["ACTIVE", "PAST_DUE"]);

function tierStage(tier: string | null): PipelineStage | null {
  switch (tier) {
    case "CORE":
      return "Core";
    case "EXECUTIVE":
    case "EXECUTIVE_ELITE":
      return "VIP";
    case "STRATEGIC":
      return "Strategic";
    default:
      return null; // ACCESS / null -> not a paid member
  }
}

export async function getPipeline(): Promise<PipelineItem[]> {
  const db = createServiceClient();
  const items: PipelineItem[] = [];

  // --- invite_requests -> New / Review / Declined ---
  const { data: invites } = await db
    .from("invite_requests")
    .select(
      "id, first_name, last_name, email, car_driving, selected_tier, status, created_at"
    )
    .order("created_at", { ascending: false });

  for (const r of invites ?? []) {
    const status = (r.status as string) ?? "PENDING";
    const stage: PipelineStage =
      status === "REJECTED"
        ? "Declined"
        : status === "APPROVED"
          ? "Review"
          : "New";
    const name =
      `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() ||
      (r.email as string) ||
      "Applicant";
    const tier = r.selected_tier ? String(r.selected_tier).toUpperCase() : null;
    items.push({
      id: `applicant:${r.id}`,
      type: "applicant",
      recordId: r.id as string,
      stage,
      name,
      email: (r.email as string) ?? "",
      subtitle: [tier, r.car_driving].filter(Boolean).join(" · ") || "Applicant",
      createdAt: (r.created_at as string) ?? null,
    });
  }

  // --- member_profiles ⋈ profiles -> tier columns / Declined / Garage ---
  const { data: mps } = await db
    .from("member_profiles")
    .select(
      "id, user_id, tier, membership_status, status, membership_started_at, created_at"
    )
    .order("created_at", { ascending: false });

  const memberUserIds = new Set<string>();
  const profileIds = (mps ?? [])
    .map((m) => m.user_id as string | null)
    .filter((x): x is string => Boolean(x));

  const profileMap = new Map<
    string,
    { name: string | null; email: string | null; created_at: string | null }
  >();
  // Pull every profile up front (need it for the Garage bucket too).
  const { data: allProfiles } = await db
    .from("profiles")
    .select("id, name, email, created_at");
  for (const p of allProfiles ?? []) {
    profileMap.set(p.id as string, {
      name: (p.name as string | null) ?? null,
      email: (p.email as string | null) ?? null,
      created_at: (p.created_at as string | null) ?? null,
    });
  }

  for (const m of mps ?? []) {
    const uid = m.user_id as string | null;
    if (uid) memberUserIds.add(uid);
    const prof = uid ? profileMap.get(uid) : undefined;
    const name = prof?.name || prof?.email || "Member";
    const email = prof?.email || "";
    const tier = (m.tier as string | null) ?? null;
    const mStatus =
      (m.status as string | null) ??
      (m.membership_status as string | null) ??
      null;

    const ts = tierStage(tier);
    // V1 dual-column footgun: status and membership_status can disagree.
    // Treat a row as the negative/positive state if EITHER column says so.
    const rejected =
      m.status === "REJECTED" || m.membership_status === "REJECTED";
    let stage: PipelineStage;
    if (rejected) stage = "Declined";
    else if (ts && (ACTIVE.has(mStatus ?? "") || ACTIVE.has(String(m.membership_status))))
      stage = ts;
    else stage = "Garage"; // has a profile row but not an active paid member

    items.push({
      id: `member:${m.id}`,
      type: stage === "Garage" ? "garage" : "member",
      recordId: m.id as string,
      stage,
      name,
      email,
      subtitle:
        stage === "Garage"
          ? "Garage Pass · free"
          : `${tier ?? "—"} · ${mStatus ?? "—"}`,
      createdAt: (m.membership_started_at as string | null) ?? null,
    });
  }

  // --- profiles with NO member_profiles -> Garage Membership ---
  const openInviteEmails = new Set(
    (invites ?? [])
      .filter(
        (r) => r.status === "PENDING" || r.status === "APPROVED"
      )
      .map((r) => String(r.email).toLowerCase())
  );
  for (const [pid, prof] of profileMap.entries()) {
    if (memberUserIds.has(pid)) continue; // already represented as member/garage
    if (prof.email && openInviteEmails.has(prof.email.toLowerCase())) continue; // shown as applicant
    items.push({
      id: `garage:${pid}`,
      type: "garage",
      recordId: pid,
      stage: "Garage",
      name: prof.name || prof.email || "Garage Pass",
      email: prof.email || "",
      subtitle: "Garage Pass · free",
      createdAt: prof.created_at,
    });
  }

  // --- trusted_partners -> Partners ---
  const { data: partners } = await db
    .from("trusted_partners")
    .select("id, name, category, discount_code, is_active, created_at")
    .order("created_at", { ascending: false });

  for (const p of partners ?? []) {
    items.push({
      id: `partner:${p.id}`,
      type: "partner",
      recordId: p.id as string,
      stage: "Partners",
      name: (p.name as string) ?? "Partner",
      email: "",
      subtitle:
        [p.category, p.discount_code].filter(Boolean).join(" · ") || "Partner",
      createdAt: (p.created_at as string | null) ?? null,
    });
  }

  return items;
}
