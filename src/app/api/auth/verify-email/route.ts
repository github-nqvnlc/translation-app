import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenHash, getClientIp } from '@/lib/auth';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limiting
  const ipAddress = getClientIp(request);
  const rateLimitResult = await rateLimit(request, {
    ...RATE_LIMITS.verifyEmail,
    identifier: ipAddress,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: `Quá nhiều yêu cầu xác minh. Vui lòng thử lại sau ${Math.ceil((rateLimitResult.retryAfter || 0) / 60)} phút.`,
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '900',
        },
      }
    );
  }
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token xác minh là bắt buộc' },
        { status: 400 }
      );
    }

    // Find verification token in database
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        type: 'email_verification',
        token: token,
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: 'Token xác minh không hợp lệ' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (verificationToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });

      return NextResponse.json(
        { success: false, error: 'Token xác minh đã hết hạn. Vui lòng yêu cầu gửi lại email xác minh.' },
        { status: 400 }
      );
    }

    // Verify token hash (double check)
    const isValidToken = await verifyTokenHash(token, verificationToken.tokenHash);
    if (!isValidToken) {
      return NextResponse.json(
        { success: false, error: 'Token xác minh không hợp lệ' },
        { status: 400 }
      );
    }

    // Find user by email (identifier)
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      // Delete token if user doesn't exist
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });

      return NextResponse.json(
        { success: false, error: 'Người dùng không tồn tại' },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      // Delete token since it's already used
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });

      return NextResponse.json(
        { success: true, message: 'Email đã được xác minh trước đó' },
        { status: 200 }
      );
    }

    // Update user email verification status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Delete verification token after successful verification
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'email_verified',
        resourceType: 'user',
        resourceId: user.id,
        details: {
          email: user.email,
          verifiedAt: new Date(),
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email đã được xác minh thành công',
        user: {
          id: user.id,
          email: user.email,
          emailVerified: true,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi xác minh email. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}

