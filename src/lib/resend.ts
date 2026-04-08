export async function sendConfirmationEmail(
  to: string,
  name: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("[Resend stub] Would send confirmation to:", to);
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "Top Tier Miami Club <noreply@thelevelteam.com>",
      to,
      subject: "Application Received — Top Tier Miami Club",
      html: `<p>Hey ${name},</p><p>We received your application. Our team reviews every submission personally. If you're a fit, expect to hear from us within 48 hours.</p><p>— TTMC</p>`,
    }),
  });
}
