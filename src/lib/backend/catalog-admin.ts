// SERVER-ONLY. Catalog = the non-EXPERIENCE `listings` (cars, boats,
// services). Events owns type=EXPERIENCE; this owns the rest. Same
// table, disjoint filter. Service-role; API routes only.

import { createServiceClient } from "@/lib/supabase-server";

export const CATALOG_TYPES = [
  "CAR_RENTAL",
  "BOAT_RENTAL",
  "SERVICE",
] as const;
export type CatalogType = (typeof CATALOG_TYPES)[number];

export interface CatalogItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_color: string | null;
  daily_price_cents: number | null;
  hourly_price_cents: number | null;
  currency: string | null;
  location_city: string | null;
  location_country: string | null;
  category: string | null;
  images: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
}

const COLS =
  "id, type, title, description, vehicle_brand, vehicle_model, vehicle_year, vehicle_color, daily_price_cents, hourly_price_cents, currency, location_city, location_country, category, images, is_active, is_featured, display_order";

export async function listCatalog(): Promise<CatalogItem[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("listings")
    .select(COLS)
    .neq("type", "EXPERIENCE")
    .order("display_order", { ascending: true });
  return (data ?? []) as CatalogItem[];
}

export interface CatalogInput {
  type?: string;
  title?: string;
  description?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
  vehicle_color?: string | null;
  daily_price_cents?: number | null;
  hourly_price_cents?: number | null;
  currency?: string | null;
  location_city?: string | null;
  location_country?: string | null;
  category?: string | null;
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  display_order?: number;
}

const TEXT = [
  "description",
  "vehicle_brand",
  "vehicle_model",
  "vehicle_color",
  "currency",
  "location_city",
  "location_country",
  "category",
] as const;
const NUM = [
  "vehicle_year",
  "daily_price_cents",
  "hourly_price_cents",
] as const;

function buildRow(input: CatalogInput): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.type !== undefined) row.type = input.type;
  if (input.title !== undefined) row.title = input.title.trim();
  for (const k of TEXT)
    if (input[k] !== undefined) row[k] = input[k] === "" ? null : input[k];
  for (const k of NUM)
    if (input[k] !== undefined)
      row[k] =
        input[k] == null || Number.isNaN(input[k])
          ? null
          : Math.floor(Number(input[k]));
  if (Array.isArray(input.images))
    row.images = input.images.map((s) => String(s).trim()).filter(Boolean);
  if (input.is_active !== undefined) row.is_active = Boolean(input.is_active);
  if (input.is_featured !== undefined)
    row.is_featured = Boolean(input.is_featured);
  if (input.display_order !== undefined)
    row.display_order = Math.max(0, Math.floor(input.display_order));
  return row;
}

export async function createCatalog(
  input: CatalogInput
): Promise<{ ok: boolean; message?: string }> {
  if (!input.title?.trim() || !input.type)
    return { ok: false, message: "Title and type are required." };
  if (input.type === "EXPERIENCE")
    return { ok: false, message: "Experiences are managed under Events." };
  const db = createServiceClient();
  const { data: top } = await db
    .from("listings")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await db.from("listings").insert({
    ...buildRow(input),
    type: input.type,
    title: input.title.trim(),
    is_active: input.is_active ?? true,
    is_featured: input.is_featured ?? false,
    rsvp_enabled: false,
    current_bookings: 0,
    display_order:
      input.display_order ??
      ((top?.display_order as number | undefined) ?? 0) + 1,
  });
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function updateCatalog(
  id: string,
  input: CatalogInput
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const { error } = await db
    .from("listings")
    .update(buildRow(input))
    .eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function deleteCatalog(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  // Guard: never let a catalog delete touch an EXPERIENCE row.
  const { data: row } = await db
    .from("listings")
    .select("type")
    .eq("id", id)
    .maybeSingle();
  if (!row) return { ok: false, message: "Not found." };
  if (row.type === "EXPERIENCE")
    return { ok: false, message: "That's an event — delete it under Events." };
  const { error } = await db.from("listings").delete().eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}
