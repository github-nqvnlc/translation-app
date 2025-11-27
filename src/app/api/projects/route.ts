import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, createAuthErrorResponse } from '@/lib/middleware/auth';
import { getClientIp, getUserAgent } from '@/lib/auth';
import { Role } from '@prisma/client';

/**
 * GET /api/projects
 * Lấy danh sách projects mà user có quyền truy cập
 * - User thấy projects họ là member
 * - User thấy public projects
 * - Admin thấy tất cả projects
 */
export async function GET() {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const user = authResult.user;

    // Admin thấy tất cả projects
    if (user.systemRole === Role.ADMIN) {
      const projects = await prisma.project.findMany({
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
          },
          _count: {
            select: {
              members: true,
              translationTables: true,
              poFiles: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json({
        success: true,
        data: projects.map((project) => ({
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
          userRole: project.members.find((m) => m.userId === user.id)?.role || null,
          members: project.members.map((m) => ({
            id: m.id,
            userId: m.userId,
            user: m.user,
            role: m.role,
            joinedAt: m.joinedAt,
          })),
        })),
      });
    }

    // User thấy projects họ là member + public projects
    const userProjectIds = user.projectRoles.map((pr) => pr.projectId);

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { id: { in: userProjectIds } },
          { isPublic: true },
        ],
      },
      include: {
        members: {
          where: {
            userId: user.id,
          },
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
        },
        _count: {
          select: {
            members: true,
            translationTables: true,
            poFiles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: projects.map((project) => {
        const userMembership = project.members.find((m) => m.userId === user.id);
        return {
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
          userRole: userMembership?.role || null,
        };
      }),
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi lấy danh sách projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Tạo project mới
 * - Yêu cầu: Authenticated user
 * - User tạo project sẽ tự động trở thành ADMIN của project đó
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const user = authResult.user;

    // Require email verification
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vui lòng xác minh email trước khi tạo project',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, isPublic } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tên project là bắt buộc' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { success: false, error: 'Tên project không được vượt quá 100 ký tự' },
        { status: 400 }
      );
    }

    if (description && typeof description === 'string' && description.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Mô tả không được vượt quá 500 ký tự' },
        { status: 400 }
      );
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPublic: isPublic === true,
        createdBy: user.id,
      },
    });

    // Add creator as ADMIN member
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: user.id,
        role: Role.ADMIN,
        invitedBy: user.id,
      },
    });

    // Create audit log
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'project_created',
        resourceType: 'project',
        resourceId: project.id,
        details: {
          projectName: project.name,
          isPublic: project.isPublic,
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: project.id,
          name: project.name,
          description: project.description,
          isPublic: project.isPublic,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          createdBy: project.createdBy,
          userRole: Role.ADMIN,
        },
        message: 'Project đã được tạo thành công',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi tạo project' },
      { status: 500 }
    );
  }
}

