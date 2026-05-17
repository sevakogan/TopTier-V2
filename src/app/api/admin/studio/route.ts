// Studio admin: inquiries + quote builder. Email-allowlisted, service-role.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/backend/admin-auth";
import {
  getStudio,
  setInquiry,
  createQuote,
} from "@/lib/backend/studio-admin";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    return NextResponse.json(await getStudio());
  } catch {
    return NextResponse.json(
      { error: "Failed to load studio" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { id, ...patch } = await req.json();
    if (!id)
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const r = await setInquiry(id, patch);
    return r.ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: r.message }, { status: 422 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const b = await req.json();
    if (!b.inquiryId || !b.packageId)
      return NextResponse.json(
        { error: "Inquiry and package are required." },
        { status: 400 }
      );
    const r = await createQuote(b);
    return r.ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: r.message }, { status: 422 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
