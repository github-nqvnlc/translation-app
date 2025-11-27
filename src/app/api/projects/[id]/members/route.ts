import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, createAuthErrorResponse } from '@/lib/middleware/auth';
import { requireAnyProjectRole, createRBACErrorResponse } from '@/lib/middleware/rbac';
import { getClientIp, getUserAgent } from '@/lib/auth';
import { Role } from '@prisma/client';
import { validateEmail } from '@/lib/auth';

/**
 * GET /api/projects/:id/members
 * Lấy danh sách thành viên của project
 * - Yêu cầu: User phải là member hoặc project phải là public
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const user = authResult.user;
    const { id: projectId } = await params;

    // Find project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        isPublic: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project không tồn tại' },
        { status: 404 }
      );
    }

    // Check access: Admin, member, or public project
    const isAdmin = user.systemRole === Role.ADMIN;
    const isMember = user.projectRoles.some((pr) => pr.projectId === projectId);
    const isPublic = project.isPublic;

    if (!isAdmin && !isMember && !isPublic) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền truy cập project này' },
        { status: 403 }
      );
    }

    // Get all members
    const members = await prisma.projectMember.findMany({
      where: { projectId },
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
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: members.map((member) => ({
        id: member.id,
        userId: member.userId,
        user: member.user,
        role: member.role,
        invitedBy: member.invitedBy,
        joinedAt: member.joinedAt,
        updatedAt: member.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi lấy danh sách thành viên' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/:id/members
 * Thêm thành viên vào project
 * - Yêu cầu: REVIEWER hoặc ADMIN role trên project
 * - Có thể thêm user bằng email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Check auth first
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const user = authResult.user;

    // Check permission (REVIEWER or ADMIN can add members)
    const rbacResult = requireAnyProjectRole(user, projectId, [Role.REVIEWER, Role.ADMIN]);
    if (!rbacResult.authorized) {
      return createRBACErrorResponse(rbacResult);
    }

    // Find project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project không tồn tại' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email là bắt buộc' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Email không hợp lệ' },
        { status: 400 }
      );
    }

    // Validate role
    const memberRole = role || Role.VIEWER;
    if (!Object.values(Role).includes(memberRole)) {
      return NextResponse.json(
        { success: false, error: 'Role không hợp lệ' },
        { status: 400 }
      );
    }

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Người dùng không tồn tại trong hệ thống' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'Người dùng đã là thành viên của project này' },
        { status: 400 }
      );
    }

    // Create member
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role: memberRole,
        invitedBy: user.id,
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
        action: 'member_added',
        resourceType: 'project_member',
        resourceId: member.id,
        details: {
          projectId,
          projectName: project.name,
          addedUserId: targetUser.id,
          addedUserEmail: targetUser.email,
          role: memberRole,
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: member.id,
          userId: member.userId,
          user: member.user,
          role: member.role,
          invitedBy: member.invitedBy,
          joinedAt: member.joinedAt,
          updatedAt: member.updatedAt,
        },
        message: 'Thành viên đã được thêm vào project thành công',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi thêm thành viên' },
      { status: 500 }
    );
  }
}

