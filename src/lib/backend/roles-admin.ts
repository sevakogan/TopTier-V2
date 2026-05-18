// SERVER-ONLY. Team & roles over user_roles ⋈ profiles. Granting
// "admin" or "founder" also unlocks the V2 admin panel (see
// admin-auth.requireAdmin). Service-role; API routes only.

import { createServiceClient } from "@/lib/supabase-server";

// Roles meaningful to assign from this screen.
export const ASSIGNABLE_ROLES = [
  "admin",
  "founder",
  "moderator",
  "staff",
] as const;

export interface UserRoles {
  userId: string;
  name: string;
  email: string;
  roles: string[];
}

export async function listUsersAndRoles(): Promise<UserRoles[]> {
  const db = createServiceClient();
  const [{ data: profiles }, { data: roles }] = await Promise.all([
    db.from("profiles").select("id, name, email"),
    db.from("user_roles").select("user_id, role"),
  ]);

  const roleMap = new Map<string, string[]>();
  for (const r of roles ?? []) {
    const k = r.user_id as string;
    const list = roleMap.get(k) ?? [];
    list.push(r.role as string);
    roleMap.set(k, list);
  }

  const rows: UserRoles[] = (profiles ?? []).map((p) => ({
    userId: p.id as string,
    name: (p.name as string | null) ?? "",
    email: (p.email as string | null) ?? "",
    roles: roleMap.get(p.id as string) ?? [],
  }));

  // Staff/admins first, then everyone else by name.
  const weight = (u: UserRoles) =>
    u.roles.includes("founder")
      ? 0
      : u.roles.includes("admin")
        ? 1
        : u.roles.length > 0
          ? 2
          : 3;
  return rows.sort(
    (a, b) =>
      weight(a) - weight(b) ||
      (a.name || a.email).localeCompare(b.name || b.email)
  );
}

export async function grantRole(
  userId: string,
  role: string,
  actorId: string
): Promise<{ ok: boolean; message?: string }> {
  if (!ASSIGNABLE_ROLES.includes(role as (typeof ASSIGNABLE_ROLES)[number]))
    return { ok: false, message: "That role can't be assigned here." };
  const db = createServiceClient();
  const { data: existing } = await db
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", role)
    .maybeSingle();
  if (existing) return { ok: true }; // idempotent
  const { error } = await db
    .from("user_roles")
    .insert({ user_id: userId, role, created_by: actorId });
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function revokeRole(
  userId: string,
  role: string
): Promise<{ ok: boolean; message?: string }> {
  if (role === "founder")
    return {
      ok: false,
      message: "Founder is immutable and can't be revoked here.",
    };
  const db = createServiceClient();
  // Never strip the last admin — avoids locking everyone out.
  if (role === "admin") {
    const { data: admins } = await db
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if ((admins ?? []).length <= 1)
      return {
        ok: false,
        message: "Can't remove the last admin.",
      };
  }
  const { error } = await db
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);
  return error ? { ok: false, message: error.message } : { ok: true };
}
