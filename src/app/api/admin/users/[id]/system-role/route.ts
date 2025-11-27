import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthAndSystemRole } from '@/lib/middleware/rbac';
import { getClientIp, getUserAgent } from '@/lib/auth';
import { Role } from '@prisma/client';

/**
 * POST /api/admin/users/:id/system-role
 * Cấp system role (ADMIN) cho user
 * - Yêu cầu: System ADMIN
 * - Chỉ có thể cấp ADMIN role (system role chỉ có ADMIN)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check auth and system admin permission
    const { user, error } = await requireAuthAndSystemRole(Role.ADMIN);
    if (error) {
      return error;
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: targetUserId } = await params;

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        systemRole: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Người dùng không tồn tại' },
        { status: 404 }
      );
    }

    // Check if user already has system role
    if (targetUser.systemRole) {
      return NextResponse.json(
        { success: false, error: 'Người dùng đã có system role' },
        { status: 400 }
      );
    }

    // Cannot grant role to self (should be done via seed or direct DB)
    if (targetUserId === user.id) {
      return NextResponse.json(
        { success: false, error: 'Không thể cấp quyền cho chính mình' },
        { status: 400 }
      );
    }

    // Create system role (only ADMIN for system role)
    const systemRole = await prisma.systemRole.create({
      data: {
        userId: targetUserId,
        role: Role.ADMIN,
        grantedBy: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            emailVerified: true,
            createdAt: true,
          },
        },
      },
    });

    // Create audit log
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'system_role_granted',
        resourceType: 'user',
        resourceId: targetUserId,
        details: {
          targetUserId,
          targetUserEmail: targetUser.email,
          role: Role.ADMIN,
          grantedBy: user.id,
          grantedByEmail: user.email,
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: systemRole.id,
          userId: systemRole.userId,
          user: systemRole.user,
          role: systemRole.role,
          grantedBy: systemRole.grantedBy,
          grantedAt: systemRole.grantedAt,
        },
        message: 'System role đã được cấp thành công',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Grant system role error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi cấp system role' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/:id/system-role
 * Thu hồi system role (ADMIN) của user
 * - Yêu cầu: System ADMIN
 * - Không thể thu hồi quyền của chính mình
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check auth and system admin permission
    const { user, error } = await requireAuthAndSystemRole(Role.ADMIN);
    if (error) {
      return error;
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: targetUserId } = await params;

    // Find target user and system role
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        systemRole: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Người dùng không tồn tại' },
        { status: 404 }
      );
    }

    if (!targetUser.systemRole) {
      return NextResponse.json(
        { success: false, error: 'Người dùng không có system role' },
        { status: 400 }
      );
    }

    // Cannot revoke own role
    if (targetUserId === user.id) {
      return NextResponse.json(
        { success: false, error: 'Không thể thu hồi quyền của chính mình' },
        { status: 400 }
      );
    }

    // Store system role info for audit log before deletion
    const systemRoleInfo = {
      id: targetUser.systemRole.id,
      role: targetUser.systemRole.role,
      grantedBy: targetUser.systemRole.grantedBy,
      grantedAt: targetUser.systemRole.grantedAt,
    };

    // Delete system role
    await prisma.systemRole.delete({
      where: { id: targetUser.systemRole.id },
    });

    // Create audit log
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'system_role_revoked',
        resourceType: 'user',
        resourceId: targetUserId,
        details: {
          targetUserId,
          targetUserEmail: targetUser.email,
          revokedRole: systemRoleInfo.role,
          revokedBy: user.id,
          revokedByEmail: user.email,
          revokedAt: new Date(),
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'System role đã được thu hồi thành công',
    });
  } catch (error) {
    console.error('Revoke system role error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi thu hồi system role' },
      { status: 500 }
    );
  }
}

