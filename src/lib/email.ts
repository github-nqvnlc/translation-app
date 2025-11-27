/**
 * Email service utilities
 * Supports multiple email providers: Resend, SendGrid, SMTP
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const provider = process.env.EMAIL_PROVIDER || 'resend';

  try {
    switch (provider) {
      case 'resend':
        return await sendEmailResend(options);
      case 'sendgrid':
        return await sendEmailSendGrid(options);
      case 'smtp':
        return await sendEmailSMTP(options);
      default:
        console.warn(`Email provider "${provider}" not configured. Email not sent.`);
        return { success: false, error: `Email provider "${provider}" not configured` };
    }
  } catch (error) {
    console.error('Send email error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send email using Resend
 */
async function sendEmailResend(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Translation Workspace <noreply@example.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { success: false, error: error.error || 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Send email using SendGrid
 */
async function sendEmailSendGrid(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'SENDGRID_API_KEY not configured' };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: process.env.EMAIL_FROM || 'noreply@example.com' },
        subject: options.subject,
        content: [
          { type: 'text/html', value: options.html },
          ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: error || 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Send email using SMTP (NodeMailer would be needed for production)
 * This is a placeholder - in production, use nodemailer
 */
async function sendEmailSMTP(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  // For production, install nodemailer: npm install nodemailer
  // This is a placeholder implementation
  console.warn('SMTP email provider not fully implemented. Install nodemailer for production use.');
  return { success: false, error: 'SMTP provider not fully implemented' };
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(email: string, token: string): Promise<{ success: boolean; error?: string }> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const verificationUrl = `${appUrl}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác minh email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Translation Workspace</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Xác minh địa chỉ email</h2>
          <p>Xin chào,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản tại Translation Workspace. Để hoàn tất đăng ký, vui lòng xác minh địa chỉ email của bạn bằng cách nhấp vào nút bên dưới:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Xác minh email</a>
          </div>
          <p>Hoặc sao chép và dán liên kết sau vào trình duyệt của bạn:</p>
          <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">Liên kết này sẽ hết hạn sau 24 giờ.</p>
          <p style="color: #666; font-size: 14px;">Nếu bạn không yêu cầu tạo tài khoản này, vui lòng bỏ qua email này.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Translation Workspace. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Xác minh địa chỉ email

Xin chào,

Cảm ơn bạn đã đăng ký tài khoản tại Translation Workspace. Để hoàn tất đăng ký, vui lòng xác minh địa chỉ email của bạn bằng cách truy cập liên kết sau:

${verificationUrl}

Liên kết này sẽ hết hạn sau 24 giờ.

Nếu bạn không yêu cầu tạo tài khoản này, vui lòng bỏ qua email này.

© ${new Date().getFullYear()} Translation Workspace. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: 'Xác minh địa chỉ email - Translation Workspace',
    html,
    text,
  });
}

/**
 * Send password reset email
 */
export async function sendResetPasswordEmail(email: string, token: string): Promise<{ success: boolean; error?: string }> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset mật khẩu</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Translation Workspace</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Đặt lại mật khẩu</h2>
          <p>Xin chào,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đặt lại mật khẩu</a>
          </div>
          <p>Hoặc sao chép và dán liên kết sau vào trình duyệt của bạn:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          <p style="color: #d32f2f; font-weight: bold; margin-top: 30px;">⚠️ Lưu ý quan trọng:</p>
          <ul style="color: #666;">
            <li>Liên kết này sẽ hết hạn sau 1 giờ.</li>
            <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</li>
            <li>Tài khoản của bạn vẫn an toàn và không có thay đổi nào được thực hiện.</li>
          </ul>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Translation Workspace. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Đặt lại mật khẩu

Xin chào,

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Truy cập liên kết sau để đặt lại mật khẩu:

${resetUrl}

Lưu ý:
- Liên kết này sẽ hết hạn sau 1 giờ.
- Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
- Tài khoản của bạn vẫn an toàn và không có thay đổi nào được thực hiện.

© ${new Date().getFullYear()} Translation Workspace. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: 'Đặt lại mật khẩu - Translation Workspace',
    html,
    text,
  });
}

