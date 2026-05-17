// Unified pipeline feed for the admin board/table. Admin-guarded, service-role.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPipeline } from "@/lib/backend/pipeline";

const ADMIN_EMAILS = new Set([
  "sevakogan@gmail.com",
  "seva@thelevelteam.com",
  "daotoptiermiami@aol.com",
]);

async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = (req.headers.get("authorization") ?? "").replace(
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

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const items = await getPipeline();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "Failed to load pipeline" },
      { status: 500 }
    );
  }
}
