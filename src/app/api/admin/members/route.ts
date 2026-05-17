// Admin: read the real V1 member_profiles ⋈ profiles roster (service role).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { listMembers } from "@/lib/backend/admin";

const ADMIN_EMAILS = new Set([
  "sevakogan@gmail.com",
  "seva@thelevelteam.com",
  "daotoptiermiami@aol.com",
]);

async function requireAdmin(request: NextRequest): Promise<boolean> {
  const token = (request.headers.get("authorization") ?? "").replace(
    /^Bearer\s+/i,
    ""
  );
  if (!token) return false;
  const c = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const {
    data: { user },
  } = await c.auth.getUser(token);
  return Boolean(user?.email && ADMIN_EMAILS.has(user.email));
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const members = await listMembers();
  return NextResponse.json({ members });
}
