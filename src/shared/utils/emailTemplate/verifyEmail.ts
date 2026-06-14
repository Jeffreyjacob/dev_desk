export const verifyEmailTemplate = (url: string, firstName: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hi ${firstName},</h2>
      <p>Your verification url is :</p>
      <a href="${url}" style="background: #2E75B6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Verify email</a>
      <p>This code expires in 1 hour.</p>
      <p>If you didn't request this, ignore this email.</p>
    </div>
  `;
};

export const resetPasswordEmailTemplate = (
  resetUrl: string,
  firstName: string
): string => {
  return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hi ${firstName},</h2>
      <p>Here is your reset password link belowe:</p>
      <a href="${resetUrl}" style="background: #2E75B6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a>
      <p>This link expires in 1 hour</p>
      <p>If you didn't request this, ignore this email.</p>
    </div>
    `;
};
