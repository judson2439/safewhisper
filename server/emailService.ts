import { MailService, MailDataRequired } from '@sendgrid/mail';

let mailService: MailService | null = null;

// Initialize SendGrid only if API key is available
if (process.env.SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendPasswordResetEmail(email: string, resetToken: string, username?: string): Promise<boolean> {
  if (!mailService) {
    console.log(`[EMAIL SIMULATION] Password reset email would be sent to ${email}`);
    console.log(`Reset link: ${getResetUrl(resetToken)}`);
    return true; // Simulate success for development
  }

  const resetUrl = getResetUrl(resetToken);
  const displayName = username || email.split('@')[0];

  const emailParams: MailDataRequired = {
    to: email,
    from: 'noreply@skram.app', // You'll need to verify this domain with SendGrid
    subject: 'Reset Your SKRAM Password',
    text: `Hello ${displayName},

You requested a password reset for your SKRAM account.

Click this link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this reset, please ignore this email.

Best regards,
The SKRAM Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316; text-align: center;">SKRAM Password Reset</h2>
        
        <p>Hello ${displayName},</p>
        
        <p>You requested a password reset for your SKRAM account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Your Password
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          Best regards,<br>
          The SKRAM Team
        </p>
      </div>
    `
  };

  try {
    await mailService.send(emailParams);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

function getResetUrl(token: string): string {
  // Use the current domain from the environment or fallback
  const baseUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5000'
      : 'https://a3c0c928-2a2a-4745-825f-bef9448fea90-00-15tg4raemogg6.spock.replit.dev';
  return `${baseUrl}/reset-password?token=${token}`;
}