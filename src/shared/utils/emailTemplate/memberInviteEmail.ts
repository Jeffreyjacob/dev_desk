export const memberInviteEmail = (data: {
  workspaceName: string;
  invitedByName: string;
  role: string;
  acceptUrl: string;
  expiresAt: Date;
}) => {
  const formattedRole =
    data.role.charAt(0).toUpperCase() + data.role.slice(1).toLowerCase();

  const formattedExpiry = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(data.expiresAt));

  const workspaceInitial = data.workspaceName.charAt(0).toUpperCase();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You've been invited to ${data.workspaceName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#0F172A;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Workspace Invitation</h1>
              <p style="margin:8px 0 0;color:#94A3B8;font-size:14px;">You've been invited to collaborate</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;color:#333333;font-size:16px;">Hi there,</p>

              <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.6;">
                <strong>${data.invitedByName}</strong> has invited you to join their workspace on DevDesk.
                Accept the invitation below to get started collaborating with the team.
              </p>

              <!-- Workspace Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;margin:0 0 24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <div style="width:44px;height:44px;background:linear-gradient(135deg,#6366F1,#7C3AED);border-radius:10px;text-align:center;line-height:44px;font-size:20px;font-weight:700;color:#ffffff;">
                            ${workspaceInitial}
                          </div>
                        </td>
                        <td style="padding-left:16px;vertical-align:middle;">
                          <p style="margin:0 0 3px;color:#0F172A;font-size:15px;font-weight:600;">${data.workspaceName}</p>
                          <p style="margin:0;color:#64748B;font-size:13px;">
                            You'll join as &nbsp;
                            <span style="display:inline-block;background-color:#EEF2FF;color:#6366F1;font-size:12px;font-weight:600;padding:2px 8px;border-radius:4px;">${formattedRole}</span>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${data.acceptUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#6366F1,#7C3AED);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:8px;letter-spacing:-0.1px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFBEB;border-left:4px solid #F59E0B;border-radius:4px;margin:0 0 28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#92400E;font-size:14px;line-height:1.6;">
                      <strong>⏳ Expires on:</strong> ${formattedExpiry}. After this date you'll need to request a new invitation.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="border-top:1px solid #F1F5F9;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <p style="margin:0;color:#94A3B8;font-size:12px;line-height:1.6;">
                Button not working? Copy and paste this link into your browser:<br/>
                <a href="${data.acceptUrl}" style="color:#6366F1;word-break:break-all;">${data.acceptUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F8FAFC;border-top:1px solid #E2E8F0;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;color:#94A3B8;font-size:13px;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
              <p style="margin:0;color:#94A3B8;font-size:13px;">
                This invite was sent by <strong style="color:#64748B;">${data.invitedByName}</strong> via DevDesk. &nbsp;·&nbsp; © ${new Date().getFullYear()} DevDesk. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
