// Active membership plans (for tier/plan dropdowns). Admin-guarded.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/backend/admin-auth";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("membership_plans")
      .select("id, name, price_cents, is_active")
      .eq("is_active", true)
      .order("price_cents");
    return NextResponse.json({ plans: data ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Failed to load plans" },
      { status: 500 }
    );
  }
}
