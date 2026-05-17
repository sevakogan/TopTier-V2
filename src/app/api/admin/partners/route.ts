// Trusted-partners admin CRUD. Email-allowlisted, service-role.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/backend/admin-auth";
import {
  listPartners,
  createPartner,
  updatePartner,
  deletePartner,
} from "@/lib/backend/partners-admin";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const partners = await listPartners();
    return NextResponse.json({ partners });
  } catch {
    return NextResponse.json(
      { error: "Failed to load partners" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const r = await createPartner(await req.json());
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
    const r = await updatePartner(id, patch);
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
    const r = await deletePartner(id);
    return r.ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: r.message }, { status: 422 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
