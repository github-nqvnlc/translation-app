import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createAuthErrorResponse } from "@/lib/middleware/auth";
import { Role } from "@prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: NextRequest, { params }: RouteContext) {
  try {
    // Authentication check
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const user = authResult.user;
    const { id } = await params;

    const table = await prisma.translationTable.findUnique({
      where: { id },
      include: {
        entries: {
          orderBy: { createdAt: "asc" },
        },
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

    if (!table) {
      return NextResponse.json({ error: "Bảng dịch không tồn tại" }, { status: 404 });
    }

    // Check access permission
    const isAdmin = user.systemRole === Role.ADMIN;
    const isPublicProject = table.project?.isPublic || false;
    const userProjectIds = user.projectRoles.map((pr) => pr.projectId);
    const hasProjectAccess = table.projectId
      ? userProjectIds.includes(table.projectId)
      : false;

    if (!isAdmin && !isPublicProject && !hasProjectAccess) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập bảng dịch này" },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: table });
  } catch (error) {
    console.error("Get translation table error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi lấy thông tin bảng dịch" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    // Authentication and permission check
    const { id } = await params;

    const table = await prisma.translationTable.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: "Bảng dịch không tồn tại" },
        { status: 404 }
      );
    }

    // Check permission (EDITOR or higher on project, or ADMIN)
    if (table.projectId) {
      const { requireAuthAndProjectRole } = await import("@/lib/middleware/rbac");
      const permissionResult = await requireAuthAndProjectRole(
        table.projectId,
        Role.EDITOR
      );
      if (permissionResult.error) {
        return permissionResult.error;
      }
    } else {
      const { requireAuthAndPermission } = await import("@/lib/middleware/rbac");
      const permissionResult = await requireAuthAndPermission("edit_entries");
      if (permissionResult.error) {
        return permissionResult.error;
      }
    }

    const user = table.projectId
      ? (await import("@/lib/middleware/rbac")).requireAuthAndProjectRole(table.projectId, Role.EDITOR).then(r => r.user)
      : (await import("@/lib/middleware/rbac")).requireAuthAndPermission("edit_entries").then(r => r.user);

    const resolvedUser = await user;
    if (!resolvedUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, language, description } = body ?? {};

    const data: Record<string, unknown> = {};

    if (typeof name === "string" && name.trim() !== "") {
      data.name = name.trim();
    }

    if (typeof language === "string" && language.trim() !== "") {
      data.language = language.trim();
    }

    if (typeof description === "string" || description === null) {
      data.description = description === null ? null : description.trim();
    }

    const oldData = {
      name: table.name,
      language: table.language,
      description: table.description,
    };

    const updated = await prisma.translationTable.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    // Create audit log
    const { getClientIp, getUserAgent } = await import("@/lib/auth");
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    await prisma.auditLog.create({
      data: {
        userId: resolvedUser.id,
        action: "translation_table_updated",
        resourceType: "translation_table",
        resourceId: id,
        details: JSON.parse(JSON.stringify({
          old: oldData,
          new: data,
        })),
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Update translation table error:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật bảng dịch", details: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    // Authentication and permission check
    const { id } = await params;

    const table = await prisma.translationTable.findUnique({
      where: { id },
      include: {
        project: true,
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: "Bảng dịch không tồn tại" },
        { status: 404 }
      );
    }

    // Check permission (ADMIN on project, or system ADMIN)
    if (table.projectId) {
      const { requireAuthAndProjectRole } = await import("@/lib/middleware/rbac");
      const permissionResult = await requireAuthAndProjectRole(
        table.projectId,
        Role.ADMIN
      );
      if (permissionResult.error) {
        return permissionResult.error;
      }
    } else {
      const authResult = await requireAuth();
      if (!authResult.authenticated || !authResult.user) {
        return createAuthErrorResponse(authResult);
      }

      if (authResult.user.systemRole !== Role.ADMIN) {
        const { requireAuthAndPermission } = await import("@/lib/middleware/rbac");
        const permissionResult = await requireAuthAndPermission("delete_files");
        if (permissionResult.error) {
          return permissionResult.error;
        }
      }
    }

    let resolvedUser;
    if (table.projectId) {
      const { requireAuthAndProjectRole } = await import("@/lib/middleware/rbac");
      const result = await requireAuthAndProjectRole(table.projectId, Role.ADMIN);
      resolvedUser = result.user;
    } else {
      const authResult = await requireAuth();
      resolvedUser = authResult.user || undefined;
    }

    if (!resolvedUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.translationTable.delete({
      where: { id },
    });

    // Create audit log
    const { getClientIp, getUserAgent } = await import("@/lib/auth");
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    await prisma.auditLog.create({
      data: {
        userId: resolvedUser.id,
        action: "translation_table_deleted",
        resourceType: "translation_table",
        resourceId: id,
        details: {
          name: table.name,
          entryCount: table._count.entries,
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete translation table error:", error);
    return NextResponse.json(
      { error: "Không thể xóa bảng dịch", details: String(error) },
      { status: 500 },
    );
  }
}

