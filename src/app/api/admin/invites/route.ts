// Invitation requests admin: list / status / delete + send / resend /
// convert (delegated to V1 edge functions). Email-allowlisted; edge
// calls forward the admin user JWT for V1's role gate.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/backend/admin-auth";
import {
  listInviteRequests,
  setInviteStatus,
  deleteInviteRequest,
  invokeEdge,
} from "@/lib/backend/invitations";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const requests = await listInviteRequests();
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json(
      { error: "Failed to load invitations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const { action } = body as { action?: string };

    if (action === "send" || action === "resend") {
      if (!body.inviteRequestId)
        return NextResponse.json(
          { error: "Missing inviteRequestId" },
          { status: 400 }
        );
      const payload: Record<string, unknown> = {
        inviteRequestId: body.inviteRequestId,
      };
      if (action === "send" && body.membershipPlanId)
        payload.membershipPlanId = body.membershipPlanId;
      const r = await invokeEdge(
        admin.token,
        "send-member-invitation",
        payload
      );
      return r.ok
        ? NextResponse.json({ success: true })
        : NextResponse.json({ error: r.message }, { status: 422 });
    }

    if (action === "convert") {
      const { email, firstName, lastName, membershipPlanId, inviteRequestId } =
        body;
      if (!email || !membershipPlanId)
        return NextResponse.json(
          { error: "Email and a membership plan are required." },
          { status: 400 }
        );
      const r = await invokeEdge(admin.token, "direct-create-member", {
        email,
        firstName: firstName ?? "",
        lastName: lastName ?? "",
        membershipPlanId,
        inviteRequestId,
      });
      return r.ok
        ? NextResponse.json({ success: true })
        : NextResponse.json({ error: r.message }, { status: 422 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { id, status } = await req.json();
    if (!id || !status)
      return NextResponse.json(
        { error: "Missing id/status" },
        { status: 400 }
      );
    const r = await setInviteStatus(id, status);
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
    const r = await deleteInviteRequest(id);
    return r.ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: r.message }, { status: 422 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
