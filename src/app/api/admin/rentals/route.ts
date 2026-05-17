// Rentals admin: submissions + providers review. Email-allowlisted.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/backend/admin-auth";
import {
  getRentals,
  reviewSubmission,
  reviewProvider,
} from "@/lib/backend/rentals-admin";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    return NextResponse.json(await getRentals());
  } catch {
    return NextResponse.json(
      { error: "Failed to load rentals" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { kind, id, ...patch } = await req.json();
    if (!id || (kind !== "submission" && kind !== "provider"))
      return NextResponse.json(
        { error: "Missing kind/id" },
        { status: 400 }
      );
    const r =
      kind === "submission"
        ? await reviewSubmission(id, patch, admin.userId)
        : await reviewProvider(id, patch, admin.userId);
    return r.ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: r.message }, { status: 422 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
