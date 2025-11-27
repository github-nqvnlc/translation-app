import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getClientIp, getUserAgent } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;
    const refreshToken = cookieStore.get('refresh-token')?.value;

    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    // Invalidate session if exists
    if (sessionToken) {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });

      if (session) {
        // Delete session
        await prisma.session.delete({
          where: { id: session.id },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: session.userId,
            action: 'logout',
            resourceType: 'session',
            resourceId: session.id,
            ipAddress,
            userAgent,
            details: {
              sessionToken: session.sessionToken.substring(0, 8) + '...',
              expiredAt: session.expiresAt,
            },
          },
        });
      }
    }

    // Invalidate refresh token if exists
    if (refreshToken) {
      // Find refresh token by token (plaintext is stored in DB for lookup)
      const refreshTokenRecord = await prisma.refreshToken.findUnique({
        where: {
          token: refreshToken,
        },
        include: { user: true },
      });

      if (refreshTokenRecord) {
        // Revoke refresh token
        await prisma.refreshToken.update({
          where: { id: refreshTokenRecord.id },
          data: {
            revokedAt: new Date(),
          },
        });

        // Create audit log if not already created for session
        if (!sessionToken) {
          await prisma.auditLog.create({
            data: {
              userId: refreshTokenRecord.userId,
              action: 'logout',
              resourceType: 'refresh_token',
              resourceId: refreshTokenRecord.id,
              ipAddress,
              userAgent,
            },
          });
        }
      }
    }

    // Clear cookies
    cookieStore.delete('session-token');
    cookieStore.delete('refresh-token');

    return NextResponse.json(
      {
        success: true,
        message: 'Đăng xuất thành công',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi đăng xuất. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}

