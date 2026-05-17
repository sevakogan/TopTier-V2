// Partner offers admin CRUD. Email-allowlisted, service-role.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/backend/admin-auth";
import {
  createOffer,
  updateOffer,
  deleteOffer,
} from "@/lib/backend/partners-admin";

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const r = await createOffer(await req.json());
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
    const r = await updateOffer(id, patch);
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
    const r = await deleteOffer(id);
    return r.ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: r.message }, { status: 422 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
