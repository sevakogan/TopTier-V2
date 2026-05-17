// Events admin (listings type=EXPERIENCE). Email-allowlisted, service-role.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/backend/admin-auth";
import {
  listEvents,
  saveEvent,
  deleteEvent,
} from "@/lib/backend/events-admin";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const events = await listEvents();
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json(
      { error: "Failed to load events" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const r = await saveEvent(null, await req.json());
    return r.ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: r.message }, { status: 422 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { id, ...patch } = await req.json();
    if (!id)
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const r = await saveEvent(id, patch);
    return r.ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: r.message }, { status: 422 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const r = await deleteEvent(id);
    return r.ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: r.message }, { status: 422 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
