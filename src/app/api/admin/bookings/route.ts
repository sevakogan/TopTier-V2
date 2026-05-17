// Bookings admin: requests + member bookings. Email-allowlisted.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/backend/admin-auth";
import {
  getBookings,
  setRequest,
  setBooking,
} from "@/lib/backend/bookings-admin";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    return NextResponse.json(await getBookings());
  } catch {
    return NextResponse.json(
      { error: "Failed to load bookings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { kind, id, ...patch } = await req.json();
    if (!id || (kind !== "request" && kind !== "booking"))
      return NextResponse.json(
        { error: "Missing kind/id" },
        { status: 400 }
      );
    const r =
      kind === "request"
        ? await setRequest(id, patch)
        : await setBooking(id, patch);
    return r.ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: r.message }, { status: 422 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
