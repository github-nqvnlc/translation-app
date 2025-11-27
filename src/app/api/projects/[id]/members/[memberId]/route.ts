import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthAndProjectRole } from '@/lib/middleware/rbac';
import { getClientIp, getUserAgent } from '@/lib/auth';
import { Role } from '@prisma/client';

/**
 * PATCH /api/projects/:id/members/:memberId
 * Cập nhật role của thành viên
 * - Yêu cầu: ADMIN role trên project
 * - Không thể thay đổi role của chính mình (nếu là ADMIN duy nhất)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: projectId, memberId } = await params;

    // Check auth and permission (ADMIN can update member roles)
    const { user, error } = await requireAuthAndProjectRole(projectId, Role.ADMIN);
    if (error) {
      return error;
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find member
    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Thành viên không tồn tại' },
        { status: 404 }
      );
    }

    // Verify member belongs to this project
    if (member.projectId !== projectId) {
      return NextResponse.json(
        { success: false, error: 'Thành viên không thuộc project này' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !Object.values(Role).includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Role không hợp lệ' },
        { status: 400 }
      );
    }

    // Check if trying to change own role
    if (member.userId === user.id) {
      // Check if this is the only ADMIN
      const adminCount = await prisma.projectMember.count({
        where: {
          projectId,
          role: Role.ADMIN,
        },
      });

      if (adminCount === 1 && role !== Role.ADMIN) {
        return NextResponse.json(
          { success: false, error: 'Không thể thay đổi role của chính mình. Project cần ít nhất một ADMIN.' },
          { status: 400 }
        );
      }
    }

    // Store old role for audit log
    const oldRole = member.role;

    // Update member role
    const updatedMember = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role },
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
        action: 'member_role_updated',
        resourceType: 'project_member',
        resourceId: memberId,
        details: {
          projectId,
          projectName: member.project.name,
          memberUserId: member.userId,
          memberEmail: member.user.email,
          oldRole,
          newRole: role,
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedMember.id,
        userId: updatedMember.userId,
        user: updatedMember.user,
        role: updatedMember.role,
        invitedBy: updatedMember.invitedBy,
        joinedAt: updatedMember.joinedAt,
        updatedAt: updatedMember.updatedAt,
      },
      message: 'Role của thành viên đã được cập nhật thành công',
    });
  } catch (error) {
    console.error('Update member role error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi cập nhật role thành viên' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/:id/members/:memberId
 * Xóa thành viên khỏi project
 * - Yêu cầu: ADMIN role trên project
 * - Không thể xóa chính mình (nếu là ADMIN duy nhất)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: projectId, memberId } = await params;

    // Check auth and permission (ADMIN can remove members)
    const { user, error } = await requireAuthAndProjectRole(projectId, Role.ADMIN);
    if (error) {
      return error;
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find member
    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Thành viên không tồn tại' },
        { status: 404 }
      );
    }

    // Verify member belongs to this project
    if (member.projectId !== projectId) {
      return NextResponse.json(
        { success: false, error: 'Thành viên không thuộc project này' },
        { status: 400 }
      );
    }

    // Check if trying to remove self
    if (member.userId === user.id) {
      // Check if this is the only ADMIN
      const adminCount = await prisma.projectMember.count({
        where: {
          projectId,
          role: Role.ADMIN,
        },
      });

      if (adminCount === 1) {
        return NextResponse.json(
          { success: false, error: 'Không thể xóa chính mình. Project cần ít nhất một ADMIN.' },
          { status: 400 }
        );
      }
    }

    // Store member info for audit log before deletion
    const memberInfo = {
      id: member.id,
      userId: member.userId,
      userEmail: member.user.email,
      role: member.role,
    };

    // Delete member
    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    // Create audit log
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'member_removed',
        resourceType: 'project_member',
        resourceId: memberId,
        details: {
          projectId,
          projectName: member.project.name,
          removedUserId: memberInfo.userId,
          removedUserEmail: memberInfo.userEmail,
          removedRole: memberInfo.role,
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Thành viên đã được xóa khỏi project thành công',
    });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi xóa thành viên' },
      { status: 500 }
    );
  }
}

