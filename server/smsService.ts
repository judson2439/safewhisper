import twilio from 'twilio';

let twilioClient: any = null;

// Initialize Twilio only if credentials are available
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('Twilio client initialized successfully');
  } catch (error) {
    console.log('Twilio initialization failed:', error);
  }
}

export async function sendPasswordResetSMS(phoneNumber: string, resetToken: string, username?: string): Promise<boolean> {
  const resetUrl = getResetUrl(resetToken);
  const displayName = username || 'there';

  // Only send real SMS to the specified phone number
  if (phoneNumber === '+19546733500' && twilioClient && process.env.TWILIO_PHONE_NUMBER) {
    const message = `Hi ${displayName}! Reset your SKRAM password: ${resetUrl} (expires in 1 hour)`;

    try {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
      console.log(`Password reset SMS sent to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('Failed to send password reset SMS:', error);
      return false;
    }
  } else {
    // Simulate for all other phone numbers
    console.log(`[SMS SIMULATION] Password reset SMS would be sent to ${phoneNumber}`);
    console.log(`Reset link: ${resetUrl}`);
    return true;
  }
}

export async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  // Only send real SMS if we have Twilio credentials and it's the allowed number
  if (phoneNumber === '+19546733500' && twilioClient && process.env.TWILIO_PHONE_NUMBER) {
    try {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
      console.log(`SMS sent to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  } else {
    // Simulate for all other phone numbers
    console.log(`[SMS SIMULATION] SMS would be sent to ${phoneNumber}: ${message}`);
    return true;
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