// Team & roles admin. Email/role-allowlisted, service-role.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/backend/admin-auth";
import {
  listUsersAndRoles,
  grantRole,
  revokeRole,
} from "@/lib/backend/roles-admin";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const users = await listUsersAndRoles();
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { userId, role } = await req.json();
    if (!userId || !role)
      return NextResponse.json(
        { error: "Missing userId/role" },
        { status: 400 }
      );
    const r = await grantRole(userId, role, admin.userId);
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
    const { userId, role } = await req.json();
    if (!userId || !role)
      return NextResponse.json(
        { error: "Missing userId/role" },
        { status: 400 }
      );
    const r = await revokeRole(userId, role);
    return r.ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: r.message }, { status: 422 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
