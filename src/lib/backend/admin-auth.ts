// SERVER-ONLY. Single source of truth for admin gating on API routes.
// Verifies the Supabase user from the Bearer token, then checks the
// email allowlist. Returns the token (for forwarding to edge functions
// that gate on the user JWT) plus the verified identity.

import { createClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase-server";

// Bootstrap allowlist — can't be locked out even if user_roles is empty.
export const ADMIN_EMAILS = new Set([
  "sevakogan@gmail.com",
  "seva@thelevelteam.com",
  "daotoptiermiami@aol.com",
]);

/** Roles that grant V2 admin-panel access. */
export const ADMIN_ROLES = new Set(["admin", "founder"]);

export interface AdminIdentity {
  token: string;
  userId: string;
  email: string;
}

export async function requireAdmin(
  req: Request
): Promise<AdminIdentity | null> {
  const token = (req.headers.get("authorization") ?? "").replace(
    /^Bearer\s+/i,
    ""
  );
  if (!token) return null;

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const {
    data: { user },
  } = await client.auth.getUser(token);
  if (!user?.email) return null;

  // Allowed via bootstrap allowlist OR an admin/founder role grant
  // (managed in the Roles & Users screen).
  if (ADMIN_EMAILS.has(user.email))
    return { token, userId: user.id, email: user.email };

  try {
    const db = createServiceClient();
    const { data } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    if ((data ?? []).some((r) => ADMIN_ROLES.has(r.role as string)))
      return { token, userId: user.id, email: user.email };
  } catch {
    // role check failed → fall through to deny
  }
  return null;
}

/** Plan-name → membership tier (mirrors V1 PLAN_TO_TIER, by name). */
export function planNameToTier(name: string | null): string {
  const n = (name ?? "").toLowerCase();
  if (n.includes("strategic")) return "STRATEGIC";
  if (n.includes("vip") || n.includes("executive")) return "EXECUTIVE";
  if (n.includes("core")) return "CORE";
  return "ACCESS";
}
