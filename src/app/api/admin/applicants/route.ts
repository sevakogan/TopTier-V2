// Admin: read + action the real V1 invite_requests queue (service role).
// Auth: caller must present a session for an allowlisted admin email.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { listApplicants, updateApplicantStatus } from "@/lib/backend/admin";
import type { V1InviteStatus } from "@/lib/backend/types";

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
  const status = request.nextUrl.searchParams.get("status") as
    | V1InviteStatus
    | null;
  const applicants = await listApplicants(status ?? undefined);
  return NextResponse.json({ applicants });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Missing id/status" }, { status: 400 });
    }
    const ok = await updateApplicantStatus(id, status as V1InviteStatus);
    return ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Update failed" }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
