import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateEmail, generateVerificationToken, hashToken, getClientIp } from '@/lib/auth';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limiting
  const ipAddress = getClientIp(request);
  const rateLimitResult = await rateLimit(request, {
    ...RATE_LIMITS.forgotPassword,
    identifier: ipAddress,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: true, // Always return success to prevent enumeration
        message: 'Nếu email tồn tại, chúng tôi đã gửi link reset mật khẩu đến email của bạn.',
      },
      {
        status: 200,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
        },
      }
    );
  }
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email là bắt buộc' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      // Always return success to prevent email enumeration
      return NextResponse.json(
        {
          success: true,
          message: 'Nếu email tồn tại, chúng tôi đã gửi link reset mật khẩu đến email của bạn.',
        },
        { status: 200 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    // Even if user doesn't exist, return the same message
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: 'Nếu email tồn tại, chúng tôi đã gửi link reset mật khẩu đến email của bạn.',
        },
        { status: 200 }
      );
    }

    // Check if user has password (not OAuth-only)
    if (!user.passwordHash) {
      return NextResponse.json(
        {
          success: true,
          message: 'Nếu email tồn tại, chúng tôi đã gửi link reset mật khẩu đến email của bạn.',
        },
        { status: 200 }
      );
    }

    // Delete any existing password reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email.toLowerCase(),
        type: 'password_reset',
      },
    });

    // Generate new password reset token
    const resetToken = generateVerificationToken();
    const tokenHash = await hashToken(resetToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Create password reset token record
    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token: resetToken,
        tokenHash,
        type: 'password_reset',
        expiresAt,
      },
    });

    // Send reset password email
    const { sendResetPasswordEmail } = await import('@/lib/email');
    await sendResetPasswordEmail(email.toLowerCase(), resetToken);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'password_reset_requested',
        resourceType: 'user',
        resourceId: user.id,
        details: {
          email: user.email,
          requestedAt: new Date(),
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Nếu email tồn tại, chúng tôi đã gửi link reset mật khẩu đến email của bạn.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    // Always return success to prevent information leakage
    return NextResponse.json(
      {
        success: true,
        message: 'Nếu email tồn tại, chúng tôi đã gửi link reset mật khẩu đến email của bạn.',
      },
      { status: 200 }
    );
  }
}

