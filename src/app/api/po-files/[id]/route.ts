import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMetadataPayload } from "@/lib/utils/po-payload";
import { requireAuth, createAuthErrorResponse } from "@/lib/middleware/auth";
import { requireAuthAndProjectRole, requireAuthAndPermission } from "@/lib/middleware/rbac";
import { getClientIp, getUserAgent } from "@/lib/auth";
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

    const file = await prisma.poFile.findUnique({
      where: { id },
      include: {
        metadata: true,
        entries: true,
        project: {
          select: {
            id: true,
            name: true,
            isPublic: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "Không tìm thấy tệp" }, { status: 404 });
    }

    // Check access permission
    const isAdmin = user.systemRole === Role.ADMIN;
    const isPublicProject = file.project?.isPublic || false;
    const userProjectIds = user.projectRoles.map((pr) => pr.projectId);
    const hasProjectAccess = file.projectId
      ? userProjectIds.includes(file.projectId)
      : false;

    if (!isAdmin && !isPublicProject && !hasProjectAccess) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập file này" },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: file });
  } catch (error) {
    console.error("Get file error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi lấy thông tin file" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    // Authentication and permission check
    const { id } = await params;

    const file = await prisma.poFile.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: "File không tồn tại" },
        { status: 404 }
      );
    }

    // Check permission (EDITOR or higher on project, or ADMIN)
    if (file.projectId) {
      const permissionResult = await requireAuthAndProjectRole(
        file.projectId,
        Role.EDITOR
      );
      if (permissionResult.error) {
        return permissionResult.error;
      }
    } else {
      // File without project - check general permission
      const permissionResult = await requireAuthAndPermission("edit_entries");
      if (permissionResult.error) {
        return permissionResult.error;
      }
    }

    const user = file.projectId
      ? (await requireAuthAndProjectRole(file.projectId, Role.EDITOR)).user
      : (await requireAuthAndPermission("edit_entries")).user;

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body?.filename === "string") {
      data.filename = body.filename;
    }
    if (typeof body?.language === "string" || body?.language === null) {
      data.language = body.language;
    }

    if (!Object.keys(data).length) {
      return NextResponse.json(
        { error: "Không có dữ liệu để cập nhật" },
        { status: 400 },
      );
    }

    const updated = await prisma.poFile.update({
      where: { id },
      data,
      include: {
        metadata: true,
        entries: { take: 5 },
      },
    });

    // Create audit log
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "file_updated",
        resourceType: "po_file",
        resourceId: id,
        details: JSON.parse(JSON.stringify({
          changes: data,
        })),
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Update file error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi cập nhật file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    // Authentication and permission check
    const { id } = await params;

    const file = await prisma.poFile.findUnique({
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

    if (!file) {
      return NextResponse.json(
        { error: "File không tồn tại" },
        { status: 404 }
      );
    }

    // Check permission (ADMIN on project, or system ADMIN)
    if (file.projectId) {
      const permissionResult = await requireAuthAndProjectRole(
        file.projectId,
        Role.ADMIN
      );
      if (permissionResult.error) {
        return permissionResult.error;
      }
    } else {
      // File without project - check system admin or delete_files permission
      const authResult = await requireAuth();
      if (!authResult.authenticated || !authResult.user) {
        return createAuthErrorResponse(authResult);
      }

      if (authResult.user.systemRole !== Role.ADMIN) {
        const permissionResult = await requireAuthAndPermission("delete_files");
        if (permissionResult.error) {
          return permissionResult.error;
        }
      }
    }

    const user = file.projectId
      ? (await requireAuthAndProjectRole(file.projectId, Role.ADMIN)).user
      : (await requireAuth()).user;

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Delete file and entries
    await prisma.poEntry.deleteMany({ where: { fileId: id } });
    await prisma.poFile.delete({ where: { id } });

    // Create audit log
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "file_deleted",
        resourceType: "po_file",
        resourceId: id,
        details: {
          filename: file.filename,
          entryCount: file._count.entries,
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xóa file" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    // Authentication and permission check
    const { id } = await params;

    const file = await prisma.poFile.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: "File không tồn tại" },
        { status: 404 }
      );
    }

    // Check permission (EDITOR or higher on project, or ADMIN)
    if (file.projectId) {
      const permissionResult = await requireAuthAndProjectRole(
        file.projectId,
        Role.EDITOR
      );
      if (permissionResult.error) {
        return permissionResult.error;
      }
    } else {
      const permissionResult = await requireAuthAndPermission("edit_entries");
      if (permissionResult.error) {
        return permissionResult.error;
      }
    }

    const user = file.projectId
      ? (await requireAuthAndProjectRole(file.projectId, Role.EDITOR)).user
      : (await requireAuthAndPermission("edit_entries")).user;

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const metadata = parseMetadataPayload(body?.metadata);

    if (!metadata.length) {
      return NextResponse.json(
        { error: "Cần cung cấp metadata dạng [{ key, value }, ...]" },
        { status: 400 },
      );
    }

    await prisma.poFileMetadata.deleteMany({ where: { fileId: id } });
    await prisma.poFileMetadata.createMany({
      data: metadata.map((item) => ({
        fileId: id,
        key: item.key,
        value: item.value,
      })),
    });

    // Create audit log
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "file_metadata_updated",
        resourceType: "po_file",
        resourceId: id,
        details: {
          metadataCount: metadata.length,
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update file metadata error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi cập nhật metadata" },
      { status: 500 }
    );
  }
}

