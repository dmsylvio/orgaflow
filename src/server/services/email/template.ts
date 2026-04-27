export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildEmailHtml(params: {
  preheader?: string;
  body: string;
  settingsUrl?: string;
}): string {
  const preheader = params.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f6f6f1;">${escapeHtml(params.preheader)}</div>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Orgaflow</title>
</head>
<body style="margin:0;padding:0;background:#f6f6f1;font-family:Arial,Helvetica,sans-serif;color:#101828;">
  ${preheader}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" style="max-width:620px;" cellspacing="0" cellpadding="0" border="0">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 24px;">
              <span style="font-size:18px;font-weight:700;color:#163329;letter-spacing:-0.02em;">Orgaflow</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
              ${params.body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
                You're receiving this email because you have an account at Orgaflow.<br/>
                <a href="${params.settingsUrl ?? "#"}" style="color:#163329;text-decoration:underline;">Manage email preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function buildEmailText(lines: string[]): string {
  return lines.join("\n");
}
