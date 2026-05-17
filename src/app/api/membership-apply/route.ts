// V2 "apply for membership" -> V1's real inbound applicant queue.
// Mirrors V1's submit-invite-request edge function (service role + status
// PENDING). The signed-in Garage Pass user's session token is verified so
// we attribute the application to a real account.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createInviteRequest } from "@/lib/backend/admin";
import { type V1SelectedTier, UI_TIER_TO_V1 } from "@/lib/backend/types";
import { notifyTelegram } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tierLabel = String(body.tier ?? "").trim();
    const selectedTier: V1SelectedTier | null =
      UI_TIER_TO_V1[tierLabel] ?? null;

    if (!selectedTier) {
      return NextResponse.json(
        { error: "Choose a membership tier." },
        { status: 400 }
      );
    }

    // Verify the caller's session with the anon client (token from header).
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json(
        { error: "Sign in to apply." },
        { status: 401 }
      );
    }

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const {
      data: { user },
      error: userErr,
    } = await authClient.auth.getUser(token);

    if (userErr || !user || !user.email) {
      return NextResponse.json(
        { error: "Your session expired. Sign in again." },
        { status: 401 }
      );
    }

    // Derive name from profile metadata; fall back to email local-part.
    const meta = user.user_metadata ?? {};
    const fullName =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      user.email.split("@")[0];
    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    const lastName = rest.join(" ") || "—";

    const result = await createInviteRequest({
      firstName: firstName || "—",
      lastName,
      email: user.email,
      phone: typeof body.phone === "string" ? body.phone : null,
      instagram: typeof body.instagram === "string" ? body.instagram : null,
      car: typeof body.car === "string" ? body.car : null,
      selectedTier,
      referredBy: typeof body.referredBy === "string" ? body.referredBy : null,
    });

    if (result.duplicate) {
      return NextResponse.json(
        {
          error:
            "You already have an application under review. We respond within 48 hours.",
        },
        { status: 409 }
      );
    }
    if (!result.ok) {
      return NextResponse.json(
        { error: "We couldn't submit your application. Please try again." },
        { status: 500 }
      );
    }

    notifyTelegram(
      `<b>New TTMC membership application</b>\n\n${fullName}\n${user.email}\nTier: ${tierLabel}\nCar: ${body.car || "N/A"}`
    ).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
