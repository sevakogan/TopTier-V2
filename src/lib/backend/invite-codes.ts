// SERVER-ONLY. Reusable invite codes CRUD over the live `invite_codes`
// table (shared V1 schema). Service-role; API routes only.

import { createServiceClient } from "@/lib/supabase-server";

export interface InviteCode {
  id: string;
  code: string;
  description: string | null;
  membership_plan_id: string | null;
  membership_plan_name: string | null;
  max_uses: number | null;
  current_uses: number;
  auto_approve: boolean;
  skip_payment: boolean;
  discount_type: "percentage" | "fixed" | null;
  discount_value: number | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** Derived: INACTIVE → EXPIRED → EXHAUSTED → ACTIVE. */
  computed_status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "EXHAUSTED";
}

export interface InviteCodeInput {
  code: string;
  description?: string | null;
  membership_plan_id?: string | null;
  max_uses?: number | null;
  auto_approve?: boolean;
  skip_payment?: boolean;
  discount_type?: "percentage" | "fixed" | null;
  discount_value?: number | null;
  expires_at?: string | null;
  is_active?: boolean;
}

function computeStatus(
  r: {
    is_active: boolean;
    expires_at: string | null;
    max_uses: number | null;
    current_uses: number;
  }
): InviteCode["computed_status"] {
  if (!r.is_active) return "INACTIVE";
  if (r.expires_at && new Date(r.expires_at).getTime() < Date.now())
    return "EXPIRED";
  if (r.max_uses != null && r.current_uses >= r.max_uses)
    return "EXHAUSTED";
  return "ACTIVE";
}

interface PlanJoin {
  name: string | null;
}

export async function listInviteCodes(): Promise<InviteCode[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("invite_codes")
    .select("*, membership_plans(name)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => {
    const plan = r.membership_plans as PlanJoin | null;
    return {
      id: r.id as string,
      code: r.code as string,
      description: (r.description as string | null) ?? null,
      membership_plan_id: (r.membership_plan_id as string | null) ?? null,
      membership_plan_name: plan?.name ?? null,
      max_uses: (r.max_uses as number | null) ?? null,
      current_uses: (r.current_uses as number) ?? 0,
      auto_approve: Boolean(r.auto_approve),
      skip_payment: Boolean(r.skip_payment),
      discount_type:
        (r.discount_type as "percentage" | "fixed" | null) ?? null,
      discount_value: (r.discount_value as number | null) ?? null,
      expires_at: (r.expires_at as string | null) ?? null,
      is_active: Boolean(r.is_active),
      created_at: r.created_at as string,
      updated_at: r.updated_at as string,
      computed_status: computeStatus({
        is_active: Boolean(r.is_active),
        expires_at: (r.expires_at as string | null) ?? null,
        max_uses: (r.max_uses as number | null) ?? null,
        current_uses: (r.current_uses as number) ?? 0,
      }),
    };
  });
}

function clean(input: InviteCodeInput) {
  return {
    code: input.code.trim().toUpperCase(),
    description: input.description?.trim() || null,
    membership_plan_id: input.membership_plan_id || null,
    max_uses:
      input.max_uses == null || Number.isNaN(input.max_uses)
        ? null
        : Math.max(1, Math.floor(input.max_uses)),
    auto_approve: Boolean(input.auto_approve),
    skip_payment: Boolean(input.skip_payment),
    discount_type: input.discount_type || null,
    discount_value:
      input.discount_value == null || Number.isNaN(input.discount_value)
        ? null
        : Math.max(0, Math.floor(input.discount_value)),
    expires_at: input.expires_at || null,
    is_active: input.is_active ?? true,
  };
}

export async function createInviteCode(
  input: InviteCodeInput
): Promise<{ ok: boolean; message?: string }> {
  if (!input.code?.trim())
    return { ok: false, message: "A code is required." };
  const db = createServiceClient();
  const { error } = await db.from("invite_codes").insert(clean(input));
  if (error) {
    return {
      ok: false,
      message: error.message.includes("duplicate")
        ? "That code already exists."
        : error.message,
    };
  }
  return { ok: true };
}

export async function updateInviteCode(
  id: string,
  input: Partial<InviteCodeInput>
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const patch: Record<string, unknown> = {};
  if (input.code !== undefined) patch.code = input.code.trim().toUpperCase();
  if (input.description !== undefined)
    patch.description = input.description?.trim() || null;
  if (input.membership_plan_id !== undefined)
    patch.membership_plan_id = input.membership_plan_id || null;
  if (input.max_uses !== undefined)
    patch.max_uses =
      input.max_uses == null ? null : Math.max(1, Math.floor(input.max_uses));
  if (input.auto_approve !== undefined)
    patch.auto_approve = Boolean(input.auto_approve);
  if (input.skip_payment !== undefined)
    patch.skip_payment = Boolean(input.skip_payment);
  if (input.discount_type !== undefined)
    patch.discount_type = input.discount_type || null;
  if (input.discount_value !== undefined)
    patch.discount_value =
      input.discount_value == null
        ? null
        : Math.max(0, Math.floor(input.discount_value));
  if (input.expires_at !== undefined)
    patch.expires_at = input.expires_at || null;
  if (input.is_active !== undefined)
    patch.is_active = Boolean(input.is_active);

  const { error } = await db
    .from("invite_codes")
    .update(patch)
    .eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function deleteInviteCode(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const { data: row } = await db
    .from("invite_codes")
    .select("current_uses")
    .eq("id", id)
    .maybeSingle();
  if (row && (row.current_uses as number) > 0) {
    return {
      ok: false,
      message:
        "This code has already been used — deactivate it instead of deleting.",
    };
  }
  const { error } = await db.from("invite_codes").delete().eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

/** Random TTMC-XXXX-XXXX (ambiguous chars excluded). */
export function generateCode(): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const block = () =>
    Array.from(
      { length: 4 },
      () => charset[Math.floor(Math.random() * charset.length)]
    ).join("");
  return `TTMC-${block()}-${block()}`;
}
