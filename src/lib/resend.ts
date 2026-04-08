export async function sendConfirmationEmail(
  to: string,
  name: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("[Resend stub] Would send confirmation to:", to);
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0A;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:12px;letter-spacing:6px;color:#C9A84C;font-weight:600;">
                TOP TIER MIAMI CLUB
              </span>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom:32px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);"></div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0;font-size:24px;color:#F5F5F0;font-weight:700;">
                Hey ${name},
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding-bottom:16px;">
              <p style="margin:0;font-size:15px;color:rgba(245,245,240,0.6);line-height:1.7;">
                Your application to Top Tier Miami Club has been received. We review every submission personally — no algorithms, no form filters.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0;font-size:15px;color:rgba(245,245,240,0.6);line-height:1.7;">
                If you're a fit, expect to hear from us within <strong style="color:#C9A84C;">48 hours</strong>.
              </p>
            </td>
          </tr>

          <!-- What's Next Box -->
          <tr>
            <td style="padding-bottom:32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(201,168,76,0.15);border-radius:12px;background-color:rgba(201,168,76,0.04);">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 12px 0;font-size:10px;letter-spacing:4px;color:#C9A84C;font-weight:600;">
                      WHAT HAPPENS NEXT
                    </p>
                    <p style="margin:0 0 8px 0;font-size:14px;color:rgba(245,245,240,0.5);line-height:1.6;">
                      1. Our team reviews your application
                    </p>
                    <p style="margin:0 0 8px 0;font-size:14px;color:rgba(245,245,240,0.5);line-height:1.6;">
                      2. If approved, you'll receive membership details
                    </p>
                    <p style="margin:0;font-size:14px;color:rgba(245,245,240,0.5);line-height:1.6;">
                      3. Attend your first event and meet the network
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <a href="https://www.instagram.com/toptiermiamiclub/" target="_blank" style="display:inline-block;padding:14px 32px;border:1px solid #C9A84C;color:#C9A84C;text-decoration:none;font-size:11px;letter-spacing:4px;font-weight:600;border-radius:8px;">
                FOLLOW @TOPTIERMIAMICLUB
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom:24px;">
              <div style="height:1px;background:rgba(255,255,255,0.05);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center">
              <p style="margin:0;font-size:12px;color:rgba(245,245,240,0.2);line-height:1.6;">
                Top Tier Miami Club<br>
                Miami, FL<br>
                <a href="mailto:memberships@toptiermiamiclub.com" style="color:rgba(201,168,76,0.4);text-decoration:none;">
                  memberships@toptiermiamiclub.com
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

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
      html,
    }),
  });
}
