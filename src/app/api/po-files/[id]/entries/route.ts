import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEntryPayload } from "@/lib/utils/po-payload";
import { requireAuth, createAuthErrorResponse } from "@/lib/middleware/auth";
import { requireAuthAndPermission } from "@/lib/middleware/rbac";
import { Role } from "@prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    // Authentication check
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const user = authResult.user;
    const { id } = await params;

    // Check file access
    const file = await prisma.poFile.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            isPublic: true,
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const page = Number(searchParams.get("page") ?? 1);
    const pageSize = Number(searchParams.get("pageSize") ?? 25);
    const skip = Math.max(0, (page - 1) * pageSize);

    const [entries, total] = await prisma.$transaction([
    prisma.poEntry.findMany({
      where: {
        fileId: id,
        ...(query
          ? {
              OR: [
                { msgid: { contains: query } },
                { msgstr: { contains: query } },
                { description: { contains: query } },
                { references: { contains: query } },
              ],
            }
          : {}),
      },
      orderBy: { id: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.poEntry.count({
      where: {
        fileId: id,
        ...(query
          ? {
              OR: [
                { msgid: { contains: query } },
                { msgstr: { contains: query } },
                { description: { contains: query } },
                { references: { contains: query } },
              ],
            }
          : {}),
      },
    }),
    ]);

    return NextResponse.json({
      data: entries,
      pagination: {
        page,
        pageSize,
        total,
      },
    });
  } catch (error) {
    console.error("Get entries error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi lấy danh sách entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    // Authentication and permission check
    const permissionResult = await requireAuthAndPermission("create_entries");
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

    const { id } = await params;

    // Check file access
    const file = await prisma.poFile.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            isPublic: true,
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

    // Check access permission
    const isAdmin = user.systemRole === Role.ADMIN;
    const isPublicProject = file.project?.isPublic || false;
    const userProjectIds = user.projectRoles.map((pr) => pr.projectId);
    const hasProjectAccess = file.projectId
      ? userProjectIds.includes(file.projectId)
      : false;

    if (!isAdmin && !isPublicProject && !hasProjectAccess) {
      return NextResponse.json(
        { error: "Bạn không có quyền thêm entries vào file này" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const entries = Array.isArray(body) ? body : [body];
    const parsedEntries = parseEntryPayload(entries);

    if (parsedEntries.length === 0) {
      return NextResponse.json(
        { error: "msgid và msgstr là bắt buộc" },
        { status: 400 },
      );
    }

    const created = await prisma.poEntry.createMany({
      data: parsedEntries.map((entry) => ({
        fileId: id,
        ...entry,
      })),
    });

    // Create audit log
    const { getClientIp, getUserAgent } = await import("@/lib/auth");
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "entry_created",
        resourceType: "po_entry",
        resourceId: id,
        details: {
          fileId: id,
          entryCount: parsedEntries.length,
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ data: { count: created.count } }, { status: 201 });
  } catch (error) {
    console.error("Create entries error:", error);
    return NextResponse.json(
      { error: "Không thể tạo entry", details: String(error) },
      { status: 500 },
    );
  }
}

