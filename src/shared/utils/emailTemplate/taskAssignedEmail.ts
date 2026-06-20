export const taskAsgginedEmail = ({
  assignedName,
  assignedBy,
  taskTitle,
  taskUrl,
  year,
}: {
  assignedName: string;
  assignedBy: string;
  taskTitle: string;
  taskUrl: string;
  year: number;
}) => {
  return `
    <!-- src/jobs/templates/taskAssigned.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Task Assigned</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f5f7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color:#4f46e5; padding:32px 40px;">
              <span style="color:#ffffff; font-size:20px; font-weight:700;">DevDesk</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px; font-size:22px; color:#111827;">
                New task assigned to you
              </h1>
              <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#4b5563;">
                <strong>${assignedBy}</strong> assigned you a task:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0; font-size:15px; font-weight:600; color:#111827;">
                      ${taskTitle}
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius:6px; background-color:#4f46e5;">
                    <a href="${taskUrl}"
                       style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:6px;">
                      View Task
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0; font-size:13px; color:#9ca3af;">
                Hi ${assignedName}, you're receiving this because you were assigned a task on DevDesk.
              </p>

              <p style="margin:16px 0 0; font-size:13px; color:#9ca3af;">
                If the button doesn't work, copy and paste this link into your browser:<br />
                <a href="${taskUrl}" style="color:#4f46e5; word-break:break-all;">${taskUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px; background-color:#f9fafb; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; color:#9ca3af; text-align:center;">
                © ${year} DevDesk. All rights reserved.
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
