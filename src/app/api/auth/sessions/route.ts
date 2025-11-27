import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, createAuthErrorResponse } from '@/lib/middleware/auth';

/**
 * GET /api/auth/sessions
 * Lấy danh sách tất cả sessions của user hiện tại
 */
export async function GET() {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const user = authResult.user;

    // Get current session token to identify current session
    const cookieStore = await import('next/headers').then((m) => m.cookies());
    const currentSessionToken = cookieStore.get('session-token')?.value;

    // Get all active sessions for this user
    const sessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        expiresAt: {
          gt: new Date(), // Only active sessions
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: sessions.map((session) => ({
        id: session.id,
        sessionToken: session.sessionToken,
        isCurrent: session.sessionToken === currentSessionToken,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      })),
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi lấy danh sách sessions' },
      { status: 500 }
    );
  }
}

