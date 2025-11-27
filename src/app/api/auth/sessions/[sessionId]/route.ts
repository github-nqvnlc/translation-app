import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { requireAuth, createAuthErrorResponse } from '@/lib/middleware/auth';
import { getClientIp, getUserAgent } from '@/lib/auth';

/**
 * DELETE /api/auth/sessions/:sessionId
 * Xóa một session cụ thể (logout từ thiết bị khác)
 * - Không thể xóa session hiện tại (phải dùng /api/auth/logout)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const user = authResult.user;
    const { sessionId } = await params;

    // Get current session token
    const cookieStore = await cookies();
    const currentSessionToken = cookieStore.get('session-token')?.value;

    // Find the session to delete
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session không tồn tại' },
        { status: 404 }
      );
    }

    // Verify session belongs to current user
    if (session.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền xóa session này' },
        { status: 403 }
      );
    }

    // Prevent deleting current session (must use /api/auth/logout)
    if (session.sessionToken === currentSessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Không thể xóa session hiện tại. Vui lòng sử dụng nút "Đăng xuất" để đăng xuất.',
        },
        { status: 400 }
      );
    }

    // Delete the session
    await prisma.session.delete({
      where: { id: sessionId },
    });

    // Create audit log
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'session_revoked',
        resourceType: 'session',
        resourceId: sessionId,
        details: {
          revokedSessionId: sessionId,
          revokedSessionIp: session.ipAddress,
          revokedSessionUserAgent: session.userAgent,
          revokedAt: new Date(),
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Session đã được xóa thành công',
    });
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi xóa session' },
      { status: 500 }
    );
  }
}

