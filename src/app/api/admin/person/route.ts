// Person drawer: full record (GET), stage move (POST), notes (PUT).
// Admin-guarded, service-role.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPersonRecord, moveStage, saveNotes } from "@/lib/backend/person";
import type { PersonType } from "@/lib/backend/pipeline";

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
  const type = req.nextUrl.searchParams.get("type") as PersonType | null;
  const id = req.nextUrl.searchParams.get("id");
  if (!type || !id)
    return NextResponse.json({ error: "Missing type/id" }, { status: 400 });
  const record = await getPersonRecord(type, id);
  return record
    ? NextResponse.json({ record })
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { type, recordId, to } = await req.json();
    if (!type || !recordId || !to)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const r = await moveStage({ type, recordId, to });
    return r.ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: r.message ?? "Move failed" }, { status: 422 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { type, recordId, notes } = await req.json();
    if (!type || !recordId)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const ok = await saveNotes(type, recordId, String(notes ?? ""));
    return ok
      ? NextResponse.json({ success: true })
      : NextResponse.json(
          { error: "Notes not supported for this record type" },
          { status: 422 }
        );
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
