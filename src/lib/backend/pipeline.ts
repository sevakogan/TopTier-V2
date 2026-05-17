// SERVER-ONLY. The unified Pipeline, split into two derived views:
//
//  LEADS   (invite_requests — the acquisition funnel)
//   New              status=PENDING, unclaimed
//   InReview         status=PENDING, claimed_by set (an admin is working it)
//   PaymentRequested status=APPROVED (invite/payment link sent)
//   Declined         status=REJECTED  (+ rejected/suspended member_profiles)
//
//  CLIENTS (active relationships)
//   Garage           profile w/o an active paid member_profiles row
//   Core             member_profiles.tier = CORE        (active)
//   VIP              member_profiles.tier IN (EXECUTIVE, EXECUTIVE_ELITE)
//   Strategic        member_profiles.tier = STRATEGIC   (active)
//   Partners         trusted_partners
//
// CONVERTED invites drop out of Leads automatically — they now exist as a
// member_profiles row and surface in Clients. The claim columns
// (claimed_by/claimed_at) are OPTIONAL: if the migration hasn't run yet
// the In Review layer is simply inert (everything PENDING reads as New).
//
// Private clubs are hundreds of rows — fetch the few source tables and
// bucket in memory (simple, correct, fast enough).

import { createServiceClient } from "@/lib/supabase-server";

export type LeadStage =
  | "New"
  | "InReview"
  | "PaymentRequested"
  | "Declined";
export type ClientStage =
  | "Garage"
  | "Core"
  | "VIP"
  | "Strategic"
  | "Partners";
export type PipelineStage = LeadStage | ClientStage;
export type PipelineGroup = "lead" | "client";

export type PersonType = "applicant" | "garage" | "member" | "partner";

export interface PipelineItem {
  /** Stable composite id: `${type}:${recordId}`. */
  id: string;
  type: PersonType;
  recordId: string;
  group: PipelineGroup;
  stage: PipelineStage;
  name: string;
  email: string;
  phone: string;
  /** One-line context for the card (tier/car/etc.). */
  subtitle: string;
  createdAt: string | null;
  /** Lead claim ("In Review"): who is working it + since when. */
  claimedByEmail: string | null;
  claimedAt: string | null;
}

const ACTIVE = new Set(["ACTIVE", "PAST_DUE"]);

function tierStage(tier: string | null): ClientStage | null {
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

  // --- profiles up front (needed for members, garage, claim emails) ---
  const profileMap = new Map<
    string,
    {
      name: string | null;
      email: string | null;
      phone: string | null;
      created_at: string | null;
    }
  >();
  const { data: allProfiles } = await db
    .from("profiles")
    .select("id, name, email, phone, created_at");
  for (const p of allProfiles ?? []) {
    profileMap.set(p.id as string, {
      name: (p.name as string | null) ?? null,
      email: (p.email as string | null) ?? null,
      phone: (p.phone as string | null) ?? null,
      created_at: (p.created_at as string | null) ?? null,
    });
  }

  // --- invite_requests -> Leads ---
  const { data: invites } = await db
    .from("invite_requests")
    .select(
      "id, first_name, last_name, email, phone, car_driving, selected_tier, status, created_at"
    )
    .order("created_at", { ascending: false });

  // Optional claim columns — best-effort; inert until the migration runs.
  const claimMap = new Map<
    string,
    { by: string | null; at: string | null }
  >();
  try {
    const { data: claims, error } = await db
      .from("invite_requests")
      .select("id, claimed_by, claimed_at");
    if (!error) {
      for (const c of claims ?? []) {
        claimMap.set(c.id as string, {
          by: (c.claimed_by as string | null) ?? null,
          at: (c.claimed_at as string | null) ?? null,
        });
      }
    }
  } catch {
    // columns not present yet — claims stay empty
  }

  for (const r of invites ?? []) {
    const status = (r.status as string) ?? "PENDING";
    if (status === "CONVERTED") continue; // now a member -> Clients side

    const claim = claimMap.get(r.id as string);
    const claimedBy = claim?.by ?? null;
    const stage: LeadStage =
      status === "REJECTED"
        ? "Declined"
        : status === "APPROVED"
          ? "PaymentRequested"
          : claimedBy
            ? "InReview"
            : "New";

    const name =
      `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() ||
      (r.email as string) ||
      "Applicant";
    const tier = r.selected_tier
      ? String(r.selected_tier).toUpperCase()
      : null;
    items.push({
      id: `applicant:${r.id}`,
      type: "applicant",
      recordId: r.id as string,
      group: "lead",
      stage,
      name,
      email: (r.email as string) ?? "",
      phone: (r.phone as string) ?? "",
      subtitle:
        [tier, r.car_driving].filter(Boolean).join(" · ") || "Applicant",
      createdAt: (r.created_at as string) ?? null,
      claimedByEmail: claimedBy
        ? (profileMap.get(claimedBy)?.email ?? "an admin")
        : null,
      claimedAt: claim?.at ?? null,
    });
  }

  // --- member_profiles ⋈ profiles -> Clients tiers / Garage / Declined ---
  const { data: mps } = await db
    .from("member_profiles")
    .select(
      "id, user_id, tier, membership_status, status, membership_started_at, created_at"
    )
    .order("created_at", { ascending: false });

  const memberUserIds = new Set<string>();

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
    // V1 dual-column footgun: treat REJECTED in EITHER column as declined.
    const rejected =
      m.status === "REJECTED" || m.membership_status === "REJECTED";

    if (rejected) {
      items.push({
        id: `member:${m.id}`,
        type: "member",
        recordId: m.id as string,
        group: "lead",
        stage: "Declined",
        name,
        email,
        phone: prof?.phone || "",
        subtitle: `${tier ?? "—"} · ${mStatus ?? "—"}`,
        createdAt: (m.membership_started_at as string | null) ?? null,
        claimedByEmail: null,
        claimedAt: null,
      });
      continue;
    }

    const isActive =
      !!ts &&
      (ACTIVE.has(mStatus ?? "") ||
        ACTIVE.has(String(m.membership_status)));
    const stage: ClientStage = isActive ? ts! : "Garage";

    items.push({
      id: `member:${m.id}`,
      type: stage === "Garage" ? "garage" : "member",
      recordId: m.id as string,
      group: "client",
      stage,
      name,
      email,
      phone: prof?.phone || "",
      subtitle:
        stage === "Garage"
          ? "Garage Pass · free"
          : `${tier ?? "—"} · ${mStatus ?? "—"}`,
      createdAt: (m.membership_started_at as string | null) ?? null,
      claimedByEmail: null,
      claimedAt: null,
    });
  }

  // --- profiles with NO member_profiles -> Garage (Clients) ---
  const openInviteEmails = new Set(
    (invites ?? [])
      .filter((r) => r.status === "PENDING" || r.status === "APPROVED")
      .map((r) => String(r.email).toLowerCase())
  );
  for (const [pid, prof] of profileMap.entries()) {
    if (memberUserIds.has(pid)) continue;
    if (prof.email && openInviteEmails.has(prof.email.toLowerCase()))
      continue;
    items.push({
      id: `garage:${pid}`,
      type: "garage",
      recordId: pid,
      group: "client",
      stage: "Garage",
      name: prof.name || prof.email || "Garage Pass",
      email: prof.email || "",
      phone: prof.phone || "",
      subtitle: "Garage Pass · free",
      createdAt: prof.created_at,
      claimedByEmail: null,
      claimedAt: null,
    });
  }

  // --- trusted_partners -> Partners (Clients) ---
  const { data: partners } = await db
    .from("trusted_partners")
    .select(
      "id, name, category, contact_phone, discount_code, is_active, created_at"
    )
    .order("created_at", { ascending: false });

  for (const p of partners ?? []) {
    items.push({
      id: `partner:${p.id}`,
      type: "partner",
      recordId: p.id as string,
      group: "client",
      stage: "Partners",
      name: (p.name as string) ?? "Partner",
      email: "",
      phone: (p.contact_phone as string | null) ?? "",
      subtitle:
        [p.category, p.discount_code].filter(Boolean).join(" · ") ||
        "Partner",
      createdAt: (p.created_at as string | null) ?? null,
      claimedByEmail: null,
      claimedAt: null,
    });
  }

  return items;
}
