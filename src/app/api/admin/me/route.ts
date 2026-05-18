// Unified admin gate for the client shell. 200 = allowed (allowlist
// OR admin/founder role); 403 = not.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/backend/admin-auth";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  return admin
    ? NextResponse.json({ ok: true, email: admin.email })
    : NextResponse.json({ ok: false }, { status: 403 });
}
