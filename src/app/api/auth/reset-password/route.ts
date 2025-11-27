import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenHash, hashPassword, validatePassword, getClientIp } from '@/lib/auth';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limiting
  const ipAddress = getClientIp(request);
  const rateLimitResult = await rateLimit(request, {
    ...RATE_LIMITS.resetPassword,
    identifier: ipAddress,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: `Quá nhiều yêu cầu reset. Vui lòng thử lại sau ${Math.ceil((rateLimitResult.retryAfter || 0) / 60)} phút.`,
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
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Token và mật khẩu mới là bắt buộc' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mật khẩu không đáp ứng yêu cầu',
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    // Find password reset token in database
    const resetToken = await prisma.verificationToken.findFirst({
      where: {
        type: 'password_reset',
        token: token,
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: 'Token reset mật khẩu không hợp lệ' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { id: resetToken.id },
      });

      return NextResponse.json(
        { success: false, error: 'Token reset mật khẩu đã hết hạn. Vui lòng yêu cầu reset lại.' },
        { status: 400 }
      );
    }

    // Verify token hash (double check)
    const isValidToken = await verifyTokenHash(token, resetToken.tokenHash);
    if (!isValidToken) {
      return NextResponse.json(
        { success: false, error: 'Token reset mật khẩu không hợp lệ' },
        { status: 400 }
      );
    }

    // Find user by email (identifier)
    const user = await prisma.user.findUnique({
      where: { email: resetToken.identifier },
    });

    if (!user) {
      // Delete token if user doesn't exist
      await prisma.verificationToken.delete({
        where: { id: resetToken.id },
      });

      return NextResponse.json(
        { success: false, error: 'Người dùng không tồn tại' },
        { status: 404 }
      );
    }

    // Check if user has password (not OAuth-only)
    if (!user.passwordHash) {
      // Delete token
      await prisma.verificationToken.delete({
        where: { id: resetToken.id },
      });

      return NextResponse.json(
        { success: false, error: 'Tài khoản này sử dụng đăng nhập OAuth. Không thể reset mật khẩu.' },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    // Delete all refresh tokens for this user (force re-login on all devices)
    await prisma.refreshToken.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    // Delete password reset token after successful reset
    await prisma.verificationToken.delete({
      where: { id: resetToken.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'password_reset',
        resourceType: 'user',
        resourceId: user.id,
        details: {
          email: user.email,
          resetAt: new Date(),
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi đặt lại mật khẩu. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}

