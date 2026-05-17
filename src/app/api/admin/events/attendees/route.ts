// Event attendees: list + cancel / promote-from-waitlist / check-in.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/backend/admin-auth";
import {
  getAttendees,
  cancelAttendee,
  promoteAttendee,
  setCheckIn,
} from "@/lib/backend/events-admin";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const attendees = await getAttendees(id);
    return NextResponse.json({ attendees });
  } catch {
    return NextResponse.json(
      { error: "Failed to load attendees" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { action, regId, checked } = await req.json();
    if (!action || !regId)
      return NextResponse.json(
        { error: "Missing action/regId" },
        { status: 400 }
      );
    const r =
      action === "cancel"
        ? await cancelAttendee(regId)
        : action === "promote"
          ? await promoteAttendee(regId)
          : action === "checkin"
            ? await setCheckIn(regId, Boolean(checked))
            : { ok: false, message: "Unknown action" };
    return r.ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: r.message }, { status: 422 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
