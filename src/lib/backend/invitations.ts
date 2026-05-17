// SERVER-ONLY. Invitation requests admin. Simple status/delete go direct
// (service-role). "Send invitation" and "Make member" delegate to V1's
// existing, battle-tested edge functions (kept as the source of truth) —
// we forward the admin's user JWT so the functions' has_role/has_any_role
// gate still applies exactly as in V1. Service-role; API routes only.

import { createServiceClient } from "@/lib/supabase-server";

export const INVITE_STATUSES = [
  "PENDING",
  "APPROVED",
  "CONVERTED",
  "REJECTED",
] as const;
export type InviteStatus = (typeof INVITE_STATUSES)[number];

export interface InviteRequest {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  age: number | null;
  car_driving: string | null;
  license_plate: string | null;
  type_of_work: string | null;
  instagram_handle: string | null;
  referred_by: string | null;
  selected_tier: string | null;
  status: InviteStatus;
  invitation_token: string | null;
  invitation_sent_at: string | null;
  invitation_expires_at: string | null;
  membership_plan_id: string | null;
  invite_code_id: string | null;
  created_at: string;
  /** Derived: invitation_expires_at in the past. */
  invitation_expired: boolean;
}

export async function listInviteRequests(): Promise<InviteRequest[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("invite_requests")
    .select(
      "id, first_name, last_name, email, phone, age, car_driving, license_plate, type_of_work, instagram_handle, referred_by, selected_tier, status, invitation_token, invitation_sent_at, invitation_expires_at, membership_plan_id, invite_code_id, created_at"
    )
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    ...(r as Omit<InviteRequest, "invitation_expired">),
    invitation_expired:
      !!r.invitation_expires_at &&
      new Date(r.invitation_expires_at as string).getTime() < Date.now(),
  }));
}

export async function setInviteStatus(
  id: string,
  status: string
): Promise<{ ok: boolean; message?: string }> {
  if (!INVITE_STATUSES.includes(status as InviteStatus))
    return { ok: false, message: "Invalid status." };
  const db = createServiceClient();
  const { error } = await db
    .from("invite_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function deleteInviteRequest(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const { error } = await db
    .from("invite_requests")
    .delete()
    .eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

/** Invoke a Supabase edge function forwarding the admin's user JWT so
 *  the function's role gate (has_role / has_any_role) is enforced. */
export async function invokeEdge(
  userToken: string,
  fn: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; message?: string }> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${fn}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true, status: res.status };
    let message = `Action failed (${res.status}).`;
    try {
      const j = (await res.json()) as { error?: string; message?: string };
      message = j.error || j.message || message;
    } catch {
      // keep default
    }
    if (res.status === 401 || res.status === 403) {
      message =
        "This admin account isn't authorized for invitations in V1 " +
        "(needs an admin/founder role). " +
        message;
    }
    return { ok: false, status: res.status, message };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Could not reach the invitation service.",
    };
  }
}
