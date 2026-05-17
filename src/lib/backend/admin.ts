// SERVER-ONLY admin reads/writes against V1's real tables.
// V2 admin is email-allowlisted (not a V1 user_roles='admin'), so V1 RLS
// would block it — every admin data path uses the service-role client and
// must be called from an API route, never the browser.

// NOTE: service-role only. Import exclusively from API route handlers.
import { createServiceClient } from "@/lib/supabase-server";
import {
  type AdminApplicant,
  type AdminMember,
  type V1Tier,
  type V1InviteStatus,
  type V1MembershipStatus,
  type V1SelectedTier,
  tierToDisplay,
} from "./types";

export async function listApplicants(
  status?: V1InviteStatus
): Promise<AdminApplicant[]> {
  const db = createServiceClient();
  let q = db
    .from("invite_requests")
    .select(
      "id, first_name, last_name, email, phone, instagram_handle, car_driving, selected_tier, status, referred_by, created_at"
    )
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id as string,
    firstName: (r.first_name as string) ?? "",
    lastName: (r.last_name as string) ?? "",
    email: (r.email as string) ?? "",
    phone: (r.phone as string | null) ?? null,
    instagram: (r.instagram_handle as string | null) ?? null,
    car: (r.car_driving as string | null) ?? null,
    selectedTier: (r.selected_tier as V1SelectedTier | null) ?? null,
    status: (r.status as V1InviteStatus) ?? "PENDING",
    referredBy: (r.referred_by as string | null) ?? null,
    createdAt: (r.created_at as string) ?? "",
  }));
}

export async function updateApplicantStatus(
  id: string,
  status: V1InviteStatus
): Promise<boolean> {
  const db = createServiceClient();
  const { error } = await db
    .from("invite_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  instagram_handle: string | null;
}

export async function listMembers(): Promise<AdminMember[]> {
  const db = createServiceClient();

  const { data: mps, error } = await db
    .from("member_profiles")
    .select(
      "id, user_id, tier, membership_status, status, membership_started_at, membership_expires_at"
    )
    .order("created_at", { ascending: false });
  if (error || !mps) return [];

  const userIds = mps
    .map((m) => m.user_id as string | null)
    .filter((x): x is string => Boolean(x));

  const profileById = new Map<string, ProfileRow>();
  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from("profiles")
      .select("id, name, email, phone, instagram_handle")
      .in("id", userIds);
    for (const p of (profiles as ProfileRow[]) ?? []) {
      profileById.set(p.id, p);
    }
  }

  return mps.map((m) => {
    const p = m.user_id
      ? profileById.get(m.user_id as string)
      : undefined;
    const tier = (m.tier as V1Tier | null) ?? null;
    const mStatus =
      (m.membership_status as V1MembershipStatus | null) ??
      (m.status as V1MembershipStatus | null) ??
      null;
    return {
      memberProfileId: m.id as string,
      userId: (m.user_id as string | null) ?? null,
      name: p?.name ?? "—",
      email: p?.email ?? "—",
      phone: p?.phone ?? null,
      instagram: p?.instagram_handle ?? null,
      tier,
      tierDisplay: tierToDisplay(tier),
      membershipStatus: mStatus,
      startedAt: (m.membership_started_at as string | null) ?? null,
      expiresAt: (m.membership_expires_at as string | null) ?? null,
    };
  });
}

/** Insert a new inbound application — mirrors V1 submit-invite-request shape. */
export async function createInviteRequest(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  instagram?: string | null;
  car?: string | null;
  selectedTier?: V1SelectedTier | null;
  referredBy?: string | null;
}): Promise<{ ok: boolean; duplicate?: boolean; error?: string }> {
  const db = createServiceClient();

  // V1's edge function rejects a second application from the same email.
  // Re-applications from a Garage Pass user are expected, so only block
  // when there is already an OPEN (PENDING/APPROVED) request.
  const { data: existing } = await db
    .from("invite_requests")
    .select("id, status")
    .eq("email", input.email)
    .in("status", ["PENDING", "APPROVED"])
    .limit(1)
    .maybeSingle();
  if (existing) return { ok: false, duplicate: true };

  const { error } = await db.from("invite_requests").insert({
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    phone: input.phone ?? null,
    instagram_handle: input.instagram ?? null,
    car_driving: input.car ?? null,
    selected_tier: input.selectedTier ?? null,
    referred_by: input.referredBy ?? null,
    status: "PENDING" satisfies V1InviteStatus,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
