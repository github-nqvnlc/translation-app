import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getClientIp,
  getUserAgent,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh-token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token không tồn tại' },
        { status: 401 }
      );
    }

    // Verify refresh token JWT
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Refresh token không hợp lệ hoặc đã hết hạn' },
        { status: 401 }
      );
    }

    // Find refresh token in database
    const refreshTokenRecord = await prisma.refreshToken.findUnique({
      where: {
        token: refreshToken,
      },
      include: {
        user: {
          include: {
            systemRole: true,
            projectMemberships: {
              select: {
                role: true,
                projectId: true,
              },
            },
          },
        },
      },
    });

    if (!refreshTokenRecord) {
      return NextResponse.json(
        { success: false, error: 'Refresh token không tồn tại trong hệ thống' },
        { status: 401 }
      );
    }

    // Check if token is revoked
    if (refreshTokenRecord.revokedAt) {
      return NextResponse.json(
        { success: false, error: 'Refresh token đã bị thu hồi' },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (refreshTokenRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Refresh token đã hết hạn' },
        { status: 401 }
      );
    }

    // Check if user still exists and is active
    if (!refreshTokenRecord.user) {
      return NextResponse.json(
        { success: false, error: 'Người dùng không tồn tại' },
        { status: 401 }
      );
    }

    const user = refreshTokenRecord.user;
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    // Get user roles
    const roles: string[] = [];
    if (user.systemRole) {
      roles.push(user.systemRole.role);
    }

    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      roles,
    };

    // Generate new access token
    // Check if original token was "remember me" by checking expiry
    const isRememberMe =
      refreshTokenRecord.expiresAt.getTime() - refreshTokenRecord.createdAt.getTime() >
      30 * 24 * 60 * 60 * 1000; // More than 30 days = remember me

    const newAccessToken = generateAccessToken(tokenPayload, isRememberMe);

    // Token rotation: Generate new refresh token and revoke old one
    const newRefreshToken = generateRefreshToken(tokenPayload);
    const newRefreshTokenHash = await hashToken(newRefreshToken);

    // Calculate new refresh token expiry (same as original or extend if remember me)
    const newRefreshTokenExpiry = isRememberMe
      ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create new refresh token
    const newRefreshTokenRecord = await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        tokenHash: newRefreshTokenHash,
        userId: user.id,
        expiresAt: newRefreshTokenExpiry,
        ipAddress,
        userAgent,
        replacedByTokenId: refreshTokenRecord.id, // Link to old token
      },
    });

    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: {
        revokedAt: new Date(),
        replacedByTokenId: newRefreshTokenRecord.id,
      },
    });

    // Update or create session
    const sessionToken = await import('crypto').then((crypto) =>
      crypto.randomBytes(32).toString('hex')
    );

    const sessionExpiry = isRememberMe
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete old session if exists
    const oldSession = await prisma.session.findFirst({
      where: {
        userId: user.id,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (oldSession) {
      await prisma.session.delete({
        where: { id: oldSession.id },
      });
    }

    // Create new session
    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expiresAt: sessionExpiry,
        ipAddress,
        userAgent,
      },
    });

    // Set new cookies
    cookieStore.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: isRememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60,
      path: '/',
    });

    cookieStore.set('refresh-token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: isRememberMe ? 90 * 24 * 60 * 60 : 30 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json(
      {
        success: true,
        accessToken: newAccessToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi làm mới token. Vui lòng đăng nhập lại.' },
      { status: 500 }
    );
  }
}

