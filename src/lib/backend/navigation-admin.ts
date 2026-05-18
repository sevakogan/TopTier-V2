// SERVER-ONLY. Site navigation (navigation_items): CRUD + reorder +
// toggle. Service-role; API routes only.

import { createServiceClient } from "@/lib/supabase-server";

export interface NavItem {
  id: string;
  label: string;
  route: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

export async function listNav(): Promise<NavItem[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("navigation_items")
    .select("id, label, route, icon_name, display_order, is_active")
    .order("display_order", { ascending: true });
  return (data ?? []) as NavItem[];
}

export interface NavInput {
  label?: string;
  route?: string;
  icon_name?: string;
  is_active?: boolean;
}

function row(input: NavInput): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (input.label !== undefined) r.label = input.label.trim();
  if (input.route !== undefined) r.route = input.route.trim();
  if (input.icon_name !== undefined)
    r.icon_name = input.icon_name.trim() || "circle";
  if (input.is_active !== undefined)
    r.is_active = Boolean(input.is_active);
  return r;
}

export async function createNav(
  input: NavInput
): Promise<{ ok: boolean; message?: string }> {
  if (!input.label?.trim() || !input.route?.trim())
    return { ok: false, message: "Label and route are required." };
  const db = createServiceClient();
  const { data: top } = await db
    .from("navigation_items")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await db.from("navigation_items").insert({
    ...row(input),
    label: input.label.trim(),
    route: input.route.trim(),
    icon_name: input.icon_name?.trim() || "circle",
    is_active: input.is_active ?? true,
    display_order:
      ((top?.display_order as number | undefined) ?? 0) + 1,
  });
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function updateNav(
  id: string,
  input: NavInput
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const { error } = await db
    .from("navigation_items")
    .update(row(input))
    .eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function deleteNav(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const { error } = await db
    .from("navigation_items")
    .delete()
    .eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function reorderNav(
  id: string,
  dir: "up" | "down"
): Promise<{ ok: boolean; message?: string }> {
  const db = createServiceClient();
  const { data: all } = await db
    .from("navigation_items")
    .select("id, display_order")
    .order("display_order", { ascending: true });
  const list = all ?? [];
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return { ok: false, message: "Not found." };
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= list.length) return { ok: true };
  const a = list[idx];
  const b = list[swap];
  await db
    .from("navigation_items")
    .update({ display_order: b.display_order as number })
    .eq("id", a.id as string);
  await db
    .from("navigation_items")
    .update({ display_order: a.display_order as number })
    .eq("id", b.id as string);
  return { ok: true };
}
