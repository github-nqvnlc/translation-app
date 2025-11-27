import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword, validatePassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Bạn cần đăng nhập để đổi mật khẩu' },
        { status: 401 }
      );
    }

    // Find session
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: true,
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Session không hợp lệ hoặc đã hết hạn' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Check if user has password (not OAuth-only)
    if (!user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Tài khoản này sử dụng đăng nhập OAuth. Không thể đổi mật khẩu.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc' },
        { status: 400 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu hiện tại không đúng' },
        { status: 401 }
      );
    }

    // Check if new password is different from current password
    const isSamePassword = await verifyPassword(newPassword, user.passwordHash);
    if (isSamePassword) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu mới phải khác với mật khẩu hiện tại' },
        { status: 400 }
      );
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mật khẩu mới không đáp ứng yêu cầu',
          details: passwordValidation.errors,
        },
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

    // Revoke all refresh tokens for this user (force re-login on all devices except current)
    // Keep current session active
    await prisma.refreshToken.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'password_changed',
        resourceType: 'user',
        resourceId: user.id,
        details: {
          email: user.email,
          changedAt: new Date(),
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Mật khẩu đã được đổi thành công. Bạn sẽ cần đăng nhập lại trên các thiết bị khác.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}

