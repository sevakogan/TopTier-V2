// SERVER-ONLY. Trusted-partners + partner-offers admin CRUD over the
// live V1 schema. Service-role; API routes only. (Public read side lives
// in ./partners.ts — keep them separate.)

import { createServiceClient } from "@/lib/supabase-server";

export interface PartnerOffer {
  id: string;
  partner_id: string;
  title: string;
  access_level: string;
  redemption_type: string;
  code_value: string | null;
  redemption_instructions: string | null;
  status: string;
  expires_at: string | null;
}

export interface PartnerRow {
  id: string;
  name: string;
  category: string;
  description: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  benefit_details: string | null;
  discount_code: string | null;
  visibility_tier: string | null;
  package: string | null;
  paid_status: string | null;
  pay_link: string | null;
  internal_notes: string | null;
  partner_tier: string;
  partner_status: string;
  is_active: boolean;
  is_featured: boolean;
  featured_until: string | null;
  display_order: number;
  /** is_featured OR featured_until in the future. */
  featured: boolean;
  offers: PartnerOffer[];
}

const PARTNER_COLS =
  "id, name, category, description, contact_name, contact_email, contact_phone, website, logo_url, hero_image_url, benefit_details, discount_code, visibility_tier, package, paid_status, pay_link, internal_notes, partner_tier, partner_status, is_active, is_featured, featured_until, display_order";

function isFeatured(is_featured: boolean, until: string | null): boolean {
  if (is_featured) return true;
  return until ? new Date(until).getTime() > Date.now() : false;
}

export async function listPartners(): Promise<PartnerRow[]> {
  const db = createServiceClient();
  const { data: partners } = await db
    .from("trusted_partners")
    .select(PARTNER_COLS)
    .order("display_order", { ascending: true });

  const ids = (partners ?? []).map((p) => p.id as string);
  const offersByPartner = new Map<string, PartnerOffer[]>();
  if (ids.length > 0) {
    const { data: offers } = await db
      .from("partner_offers")
      .select(
        "id, partner_id, title, access_level, redemption_type, code_value, redemption_instructions, status, expires_at"
      )
      .in("partner_id", ids);
    for (const o of offers ?? []) {
      const pid = o.partner_id as string;
      const list = offersByPartner.get(pid) ?? [];
      list.push(o as PartnerOffer);
      offersByPartner.set(pid, list);
    }
  }

  return (partners ?? []).map((p) => ({
    ...(p as Omit<PartnerRow, "featured" | "offers">),
    featured: isFeatured(
      Boolean(p.is_featured),
      (p.featured_until as string | null) ?? null
    ),
    offers: offersByPartner.get(p.id as string) ?? [],
  }));
}

export interface PartnerInput {
  name: string;
  category: string;
  description?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  logo_url?: string | null;
  hero_image_url?: string | null;
  benefit_details?: string | null;
  discount_code?: string | null;
  visibility_tier?: string | null;
  package?: string | null;
  paid_status?: string | null;
  pay_link?: string | null;
  internal_notes?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  featured_until?: string | null;
  display_order?: number;
}

const TEXT_FIELDS: (keyof PartnerInput)[] = [
  "description",
  "contact_name",
  "contact_email",
  "contact_phone",
  "website",
  "logo_url",
  "hero_image_url",
  "benefit_details",
  "discount_code",
  "visibility_tier",
  "package",
  "paid_status",
  "pay_link",
  "internal_notes",
  "featured_until",
];

export async function createPartner(
  input: PartnerInput
): Promise<{ ok: boolean; message?: string }> {
  if (!input.name?.trim() || !input.category?.trim())
    return { ok: false, message: "Name and category are required." };
  const db = createServiceClient();
  const { data: top } = await db
    .from("trusted_partners")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder =
    input.display_order ??
    ((top?.display_order as number | undefined) ?? 0) + 1;

  const row: Record<string, unknown> = {
    name: input.name.trim(),
    category: input.category.trim(),
    is_active: input.is_active ?? true,
    is_featured: input.is_featured ?? false,
    display_order: nextOrder,
    partner_tier: "SUPPORTER",
    partner_status: "PENDING",
  };
  for (const f of TEXT_FIELDS) {
    const v = input[f];
    if (v !== undefined) row[f] = v === "" ? null : v;
  }
  const { error } = await db.from("trusted_partners").insert(row);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function updatePartner(
  id: string,
  input: Partial<PartnerInput>
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.category !== undefined) patch.category = input.category.trim();
  if (input.is_active !== undefined)
    patch.is_active = Boolean(input.is_active);
  if (input.is_featured !== undefined)
    patch.is_featured = Boolean(input.is_featured);
  if (input.display_order !== undefined)
    patch.display_order = Math.max(0, Math.floor(input.display_order));
  for (const f of TEXT_FIELDS) {
    if (input[f] !== undefined) patch[f] = input[f] === "" ? null : input[f];
  }
  const { error } = await db
    .from("trusted_partners")
    .update(patch)
    .eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function deletePartner(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  await db.from("partner_offers").delete().eq("partner_id", id);
  const { error } = await db
    .from("trusted_partners")
    .delete()
    .eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export interface OfferInput {
  partner_id: string;
  title: string;
  access_level?: string;
  redemption_type?: string;
  code_value?: string | null;
  redemption_instructions?: string | null;
  status?: string;
  expires_at?: string | null;
}

export async function createOffer(
  input: OfferInput
): Promise<{ ok: boolean; message?: string }> {
  if (!input.partner_id || !input.title?.trim())
    return { ok: false, message: "Partner and title are required." };
  const db = createServiceClient();
  const { error } = await db.from("partner_offers").insert({
    partner_id: input.partner_id,
    title: input.title.trim(),
    access_level: input.access_level || "ALL",
    redemption_type: input.redemption_type || "code",
    code_value: input.code_value || null,
    redemption_instructions: input.redemption_instructions || null,
    status: input.status || "ACTIVE",
    expires_at: input.expires_at || null,
  });
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function updateOffer(
  id: string,
  input: Partial<OfferInput>
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const patch: Record<string, unknown> = {};
  for (const k of [
    "title",
    "access_level",
    "redemption_type",
    "code_value",
    "redemption_instructions",
    "status",
    "expires_at",
  ] as const) {
    if (input[k] !== undefined)
      patch[k] = input[k] === "" ? null : input[k];
  }
  const { error } = await db
    .from("partner_offers")
    .update(patch)
    .eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function deleteOffer(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const { error } = await db.from("partner_offers").delete().eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}
