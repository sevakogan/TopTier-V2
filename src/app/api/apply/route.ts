import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { notifyTelegram } from "@/lib/telegram";
import { sendConfirmationEmail } from "@/lib/resend";
import type { ApplicationFormData } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: ApplicationFormData = await request.json();

    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { error } = await supabase.from("applications").insert({
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      instagram: body.instagram || null,
      car: body.car || null,
      modifications: body.modifications || null,
      source: body.source || null,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save application" },
        { status: 500 }
      );
    }

    notifyTelegram(
      `<b>New TTMC Application</b>\n\nName: ${body.name}\nEmail: ${body.email}\nCar: ${body.car || "N/A"}\nIG: ${body.instagram || "N/A"}\nSource: ${body.source || "N/A"}`
    ).catch(console.error);

    sendConfirmationEmail(body.email, body.name).catch(console.error);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
