// Person drawer: full record (GET), stage move (POST), notes (PUT).
// Admin-guarded (shared requireAdmin), service-role.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/backend/admin-auth";
import { getPersonRecord, moveStage, saveNotes } from "@/lib/backend/person";
import type { PersonType } from "@/lib/backend/pipeline";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req)))
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
  const admin = await requireAdmin(req);
  if (!admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { type, recordId, to } = await req.json();
    if (!type || !recordId || !to)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const r = await moveStage({
      type,
      recordId,
      to,
      actorId: admin.userId,
    });
    return r.ok
      ? NextResponse.json({ success: true })
      : NextResponse.json(
          { error: r.message ?? "Move failed" },
          { status: 422 }
        );
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin(req)))
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
