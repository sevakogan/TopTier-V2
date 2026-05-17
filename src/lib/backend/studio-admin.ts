// SERVER-ONLY. Studio: client inquiries + a quote builder on top of
// studio_packages. Service-role; API routes only.

import { createServiceClient } from "@/lib/supabase-server";

export const STUDIO_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "WON",
  "LOST",
] as const;

export interface StudioPackage {
  id: string;
  name: string;
  category: string;
  base_price_cents: number;
  typical_range_min_cents: number | null;
  typical_range_max_cents: number | null;
  duration_minutes: number | null;
  deliverables: string | null;
  description: string | null;
  is_active: boolean;
}

export interface StudioQuote {
  id: string;
  inquiry_id: string | null;
  package_id: string | null;
  quote_total_cents: number;
  deposit_cents: number;
  deposit_percentage: number;
  status: string | null;
  notes: string | null;
  created_at: string;
}

export interface StudioInquiry {
  id: string;
  reference_number: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  service_category: string;
  package_id: string | null;
  package_name: string | null;
  project_description: string;
  preferred_date: string | null;
  estimated_cars: number | null;
  estimated_people: number | null;
  primary_goal: string | null;
  status: string;
  internal_notes: string | null;
  created_at: string;
  quotes: StudioQuote[];
}

export async function getStudio(): Promise<{
  inquiries: StudioInquiry[];
  packages: StudioPackage[];
}> {
  const db = createServiceClient();

  const { data: pkgs } = await db
    .from("studio_packages")
    .select(
      "id, name, category, base_price_cents, typical_range_min_cents, typical_range_max_cents, duration_minutes, deliverables, description, is_active"
    )
    .order("display_order", { ascending: true });
  const packages = (pkgs ?? []) as StudioPackage[];
  const pkgName = new Map(packages.map((p) => [p.id, p.name]));

  const { data: rows } = await db
    .from("studio_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  const ids = (rows ?? []).map((r) => r.id as string);
  const quotesBy = new Map<string, StudioQuote[]>();
  if (ids.length > 0) {
    const { data: qs } = await db
      .from("studio_quotes")
      .select(
        "id, inquiry_id, package_id, quote_total_cents, deposit_cents, deposit_percentage, status, notes, created_at"
      )
      .in("inquiry_id", ids);
    for (const q of qs ?? []) {
      const k = q.inquiry_id as string;
      const list = quotesBy.get(k) ?? [];
      list.push(q as StudioQuote);
      quotesBy.set(k, list);
    }
  }

  const inquiries: StudioInquiry[] = (rows ?? []).map((r) => ({
    id: r.id as string,
    reference_number: (r.reference_number as string | null) ?? null,
    full_name: (r.full_name as string) ?? "",
    email: (r.email as string) ?? "",
    phone: (r.phone as string | null) ?? null,
    service_category: (r.service_category as string) ?? "",
    package_id: (r.package_id as string | null) ?? null,
    package_name: r.package_id
      ? (pkgName.get(r.package_id as string) ?? null)
      : null,
    project_description: (r.project_description as string) ?? "",
    preferred_date: (r.preferred_date as string | null) ?? null,
    estimated_cars: (r.estimated_cars as number | null) ?? null,
    estimated_people: (r.estimated_people as number | null) ?? null,
    primary_goal: (r.primary_goal as string | null) ?? null,
    status: (r.status as string) ?? "NEW",
    internal_notes: (r.internal_notes as string | null) ?? null,
    created_at: r.created_at as string,
    quotes: quotesBy.get(r.id as string) ?? [],
  }));

  return { inquiries, packages };
}

export async function setInquiry(
  id: string,
  patch: { status?: string; internal_notes?: string }
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.internal_notes !== undefined)
    row.internal_notes = patch.internal_notes;
  const { error } = await db
    .from("studio_inquiries")
    .update(row)
    .eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function createQuote(input: {
  inquiryId: string;
  packageId: string;
  depositPercentage: number;
  adjustmentCents?: number;
  adjustmentNote?: string;
  notes?: string;
}): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const { data: pkg } = await db
    .from("studio_packages")
    .select("name, base_price_cents")
    .eq("id", input.packageId)
    .maybeSingle();
  if (!pkg) return { ok: false, message: "Pick a valid package." };

  const base = (pkg.base_price_cents as number) ?? 0;
  const adj = Math.round(input.adjustmentCents ?? 0);
  const total = Math.max(0, base + adj);
  const pct = Math.min(100, Math.max(0, input.depositPercentage || 0));
  const deposit = Math.round((total * pct) / 100);

  const { error } = await db.from("studio_quotes").insert({
    inquiry_id: input.inquiryId,
    package_id: input.packageId,
    custom_adjustment_cents: adj || null,
    adjustment_note: input.adjustmentNote || null,
    quote_total_cents: total,
    deposit_cents: deposit,
    deposit_percentage: pct,
    quote_items: [
      { label: pkg.name as string, amount_cents: base },
      ...(adj ? [{ label: "Adjustment", amount_cents: adj }] : []),
    ],
    notes: input.notes || null,
    status: "DRAFT",
  });
  if (error) return { ok: false, message: error.message };

  await db
    .from("studio_inquiries")
    .update({ status: "QUOTED", updated_at: new Date().toISOString() })
    .eq("id", input.inquiryId);
  return { ok: true };
}
