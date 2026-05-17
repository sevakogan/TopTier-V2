// SERVER-ONLY. Single source of truth for admin gating on API routes.
// Verifies the Supabase user from the Bearer token, then checks the
// email allowlist. Returns the token (for forwarding to edge functions
// that gate on the user JWT) plus the verified identity.

import { createClient } from "@supabase/supabase-js";

export const ADMIN_EMAILS = new Set([
  "sevakogan@gmail.com",
  "seva@thelevelteam.com",
  "daotoptiermiami@aol.com",
]);

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

  if (!user?.email || !ADMIN_EMAILS.has(user.email)) return null;
  return { token, userId: user.id, email: user.email };
}

/** Plan-name → membership tier (mirrors V1 PLAN_TO_TIER, by name). */
export function planNameToTier(name: string | null): string {
  const n = (name ?? "").toLowerCase();
  if (n.includes("strategic")) return "STRATEGIC";
  if (n.includes("vip") || n.includes("executive")) return "EXECUTIVE";
  if (n.includes("core")) return "CORE";
  return "ACCESS";
}
