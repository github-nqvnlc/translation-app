import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, createAuthErrorResponse } from '@/lib/middleware/auth';
import { requireAuthAndProjectRole } from '@/lib/middleware/rbac';
import { getClientIp, getUserAgent } from '@/lib/auth';
import { Role } from '@prisma/client';

/**
 * GET /api/projects/:id
 * Lấy chi tiết project
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
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        _count: {
          select: {
            members: true,
            translationTables: true,
            poFiles: true,
          },
        },
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

    const userMembership = project.members.find((m) => m.userId === user.id);

    return NextResponse.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        isPublic: project.isPublic,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        createdBy: project.createdBy,
        memberCount: project._count.members,
        translationTableCount: project._count.translationTables,
        poFileCount: project._count.poFiles,
        userRole: userMembership?.role || (isAdmin ? Role.ADMIN : null),
        members: project.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          user: m.user,
          role: m.role,
          invitedBy: m.invitedBy,
          joinedAt: m.joinedAt,
          updatedAt: m.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi lấy thông tin project' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/:id
 * Cập nhật project
 * - Yêu cầu: ADMIN role trên project hoặc system ADMIN
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Check auth and permission
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
    const { name, description, isPublic } = body;

    const updateData: {
      name?: string;
      description?: string | null;
      isPublic?: boolean;
    } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Tên project không hợp lệ' },
          { status: 400 }
        );
      }
      if (name.trim().length > 100) {
        return NextResponse.json(
          { success: false, error: 'Tên project không được vượt quá 100 ký tự' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      if (description === null || description === '') {
        updateData.description = null;
      } else if (typeof description === 'string') {
        if (description.length > 500) {
          return NextResponse.json(
            { success: false, error: 'Mô tả không được vượt quá 500 ký tự' },
            { status: 400 }
          );
        }
        updateData.description = description.trim();
      } else {
        return NextResponse.json(
          { success: false, error: 'Mô tả không hợp lệ' },
          { status: 400 }
        );
      }
    }

    if (isPublic !== undefined) {
      if (typeof isPublic !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'isPublic phải là boolean' },
          { status: 400 }
        );
      }
      updateData.isPublic = isPublic;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không có dữ liệu nào để cập nhật' },
        { status: 400 }
      );
    }

    // Store old values for audit log
    const oldValues = {
      name: project.name,
      description: project.description,
      isPublic: project.isPublic,
    };

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    // Create audit log
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'project_updated',
        resourceType: 'project',
        resourceId: projectId,
        details: {
          oldValues,
          newValues: {
            name: updatedProject.name,
            description: updatedProject.description,
            isPublic: updatedProject.isPublic,
          },
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedProject.id,
        name: updatedProject.name,
        description: updatedProject.description,
        isPublic: updatedProject.isPublic,
        createdAt: updatedProject.createdAt,
        updatedAt: updatedProject.updatedAt,
        createdBy: updatedProject.createdBy,
      },
      message: 'Project đã được cập nhật thành công',
    });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi cập nhật project' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/:id
 * Xóa project
 * - Yêu cầu: ADMIN role trên project hoặc system ADMIN
 * - Cảnh báo: Xóa project sẽ xóa tất cả dữ liệu liên quan (members, files, tables)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Check auth and permission
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

    // Find project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        _count: {
          select: {
            members: true,
            translationTables: true,
            poFiles: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project không tồn tại' },
        { status: 404 }
      );
    }

    // Store project info for audit log before deletion
    const projectInfo = {
      id: project.id,
      name: project.name,
      memberCount: project._count.members,
      translationTableCount: project._count.translationTables,
      poFileCount: project._count.poFiles,
    };

    // Delete project (cascade will delete members, files, tables)
    await prisma.project.delete({
      where: { id: projectId },
    });

    // Create audit log
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'project_deleted',
        resourceType: 'project',
        resourceId: projectId,
        details: {
          projectName: projectInfo.name,
          deletedAt: new Date(),
          stats: {
            memberCount: projectInfo.memberCount,
            translationTableCount: projectInfo.translationTableCount,
            poFileCount: projectInfo.poFileCount,
          },
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Project đã được xóa thành công',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi xóa project' },
      { status: 500 }
    );
  }
}

