// SERVER-ONLY. Payments + revenue over the live `payments` table.
// No FK to profiles — V1 merges the member name client-side; we do the
// same merge server-side. Service-role; API routes only.

import { createServiceClient } from "@/lib/supabase-server";

export const PAYMENT_STATUSES = [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "REFUNDED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_TYPES = [
  "MEMBERSHIP",
  "EVENT_TICKET",
  "BOOKING_DEPOSIT",
  "SPONSORSHIP",
  "PARTNER_LISTING",
] as const;

export interface PaymentRow {
  id: string;
  memberName: string;
  memberEmail: string;
  amountCents: number;
  currency: string;
  type: string;
  status: PaymentStatus;
  stripeRef: string | null;
  createdAt: string;
}

export interface PaymentStats {
  totalRevenueCents: number;
  succeeded: number;
  pending: number;
  failed: number;
  refunded: number;
  count: number;
}

export async function getPayments(): Promise<{
  payments: PaymentRow[];
  stats: PaymentStats;
}> {
  const db = createServiceClient();
  const { data: rows } = await db
    .from("payments")
    .select(
      "id, user_id, amount_cents, currency, type, status, stripe_payment_intent_id, stripe_checkout_session_id, created_at"
    )
    .order("created_at", { ascending: false });

  const list = rows ?? [];
  const userIds = Array.from(
    new Set(list.map((r) => r.user_id as string).filter(Boolean))
  );

  const profileMap = new Map<string, { name: string; email: string }>();
  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id as string, {
        name: (p.name as string | null) ?? "",
        email: (p.email as string | null) ?? "",
      });
    }
  }

  const payments: PaymentRow[] = list.map((r) => {
    const prof = profileMap.get(r.user_id as string);
    return {
      id: r.id as string,
      memberName: prof?.name || prof?.email || "Unknown",
      memberEmail: prof?.email || "",
      amountCents: (r.amount_cents as number) ?? 0,
      currency: ((r.currency as string) ?? "usd").toUpperCase(),
      type: (r.type as string) ?? "—",
      status: (r.status as PaymentStatus) ?? "PENDING",
      stripeRef:
        (r.stripe_payment_intent_id as string | null) ??
        (r.stripe_checkout_session_id as string | null) ??
        null,
      createdAt: r.created_at as string,
    };
  });

  const stats: PaymentStats = {
    totalRevenueCents: payments
      .filter((p) => p.status === "SUCCEEDED")
      .reduce((s, p) => s + p.amountCents, 0),
    succeeded: payments.filter((p) => p.status === "SUCCEEDED").length,
    pending: payments.filter((p) => p.status === "PENDING").length,
    failed: payments.filter((p) => p.status === "FAILED").length,
    refunded: payments.filter((p) => p.status === "REFUNDED").length,
    count: payments.length,
  };

  return { payments, stats };
}

export async function updatePaymentStatus(
  id: string,
  status: string
): Promise<{ ok: boolean; message?: string }> {
  if (!PAYMENT_STATUSES.includes(status as PaymentStatus))
    return { ok: false, message: "Invalid status." };
  const db = createServiceClient();
  const { error } = await db
    .from("payments")
    .update({ status })
    .eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function deletePayment(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const { error } = await db.from("payments").delete().eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}
