import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createAuthErrorResponse } from "@/lib/middleware/auth";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    // Authentication check
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const user = authResult.user;

    // Build where clause with project filtering
    // Only return tables that have a projectId (required)
    const whereClause: {
      projectId: { not: null };
      project?: { OR: Array<{ id?: { in: string[] }; isPublic?: boolean }> };
    } = {
      projectId: { not: null },
    };

    // Filter by project membership
    if (user.systemRole !== Role.ADMIN) {
      const userProjectIds = user.projectRoles.map((pr) => pr.projectId);
      whereClause.project = {
        OR: [
          { id: { in: userProjectIds } },
          { isPublic: true },
        ],
      };
    }

    const tables = await prisma.translationTable.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { entries: true },
        },
        project: {
          select: {
            id: true,
            name: true,
            isPublic: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ data: tables });
  } catch (error) {
    console.error("Get translation tables error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi lấy danh sách bảng dịch" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication and permission check
    const { requireAuthAndPermission } = await import("@/lib/middleware/rbac");
    const permissionResult = await requireAuthAndPermission("create_translation_tables");
    if (permissionResult.error) {
      return permissionResult.error;
    }

    const user = permissionResult.user;
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check email verification
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Vui lòng xác minh email trước khi tạo bảng dịch" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, language, description, projectId } = body ?? {};

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Tên bảng dịch là bắt buộc" }, { status: 400 });
    }

    if (!language || typeof language !== "string" || language.trim() === "") {
      return NextResponse.json({ error: "Ngôn ngữ là bắt buộc" }, { status: 400 });
    }

    // Validate projectId is required
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "projectId là bắt buộc" },
        { status: 400 }
      );
    }

    // Validate project access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project không tồn tại" },
        { status: 404 }
      );
    }

    const isAdmin = user.systemRole === Role.ADMIN;
    const isMember = project.members.length > 0;
    const hasEditorRole = project.members.some(
      (m) => m.role === Role.EDITOR || m.role === Role.REVIEWER || m.role === Role.ADMIN
    );

    if (!isAdmin && (!isMember || !hasEditorRole)) {
      return NextResponse.json(
        { error: "Bạn cần quyền EDITOR trở lên để tạo bảng dịch trong project này" },
        { status: 403 }
      );
    }

    const created = await prisma.translationTable.create({
      data: {
        name: name.trim(),
        language: language.trim(),
        description: typeof description === "string" ? description.trim() : null,
        projectId: projectId, // Required, not nullable
      },
      include: {
        _count: {
          select: { entries: true },
        },
        project: {
          select: {
            id: true,
            name: true,
            isPublic: true,
          },
        },
      },
    });

    // Create audit log
    const { getClientIp, getUserAgent } = await import("@/lib/auth");
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "translation_table_created",
        resourceType: "translation_table",
        resourceId: created.id,
        details: {
          name: created.name,
          language: created.language,
          projectId: projectId,
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("Create translation table error:", error);
    return NextResponse.json(
      { error: "Không thể tạo bảng dịch", details: String(error) },
      { status: 500 },
    );
  }
}

