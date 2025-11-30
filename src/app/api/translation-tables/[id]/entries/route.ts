import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createAuthErrorResponse } from "@/lib/middleware/auth";
import { requirePermission, createRBACErrorResponse } from "@/lib/middleware/rbac";
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

    // Check table access
    const table = await prisma.translationTable.findUnique({
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

    if (!table) {
      return NextResponse.json(
        { error: "Bảng dịch không tồn tại" },
        { status: 404 }
      );
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

    const entries = await prisma.translationEntry.findMany({
      where: { tableId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: entries });
  } catch (error) {
    console.error("Get translation entries error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi lấy danh sách entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }
    const user = authResult.user;

    const { id } = await params;

    // Check table access
    const table = await prisma.translationTable.findUnique({
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

    if (!table) {
      return NextResponse.json(
        { error: "Bảng dịch không tồn tại" },
        { status: 404 }
      );
    }

    const permissionResult = requirePermission(
      user,
      "create_entries",
      table.projectId || undefined,
    );
    if (!permissionResult.authorized) {
      return createRBACErrorResponse(permissionResult);
    }

    const body = await request.json();
    const { sourceText, translatedText, description, references } = body ?? {};

    if (!sourceText || typeof sourceText !== "string" || sourceText.trim() === "") {
      return NextResponse.json({ error: "Source Text là bắt buộc" }, { status: 400 });
    }

    if (!translatedText || typeof translatedText !== "string") {
      return NextResponse.json({ error: "Translated Text là bắt buộc" }, { status: 400 });
    }

    const created = await prisma.translationEntry.create({
      data: {
        sourceText: sourceText.trim(),
        translatedText: translatedText.trim(),
        description: typeof description === "string" && description.trim() !== "" ? description.trim() : null,
        references: typeof references === "string" && references.trim() !== "" ? references.trim() : null,
        tableId: id,
      },
    });

    // Create audit log
    const { getClientIp, getUserAgent } = await import("@/lib/auth");
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "translation_entry_created",
        resourceType: "translation_entry",
        resourceId: created.id.toString(),
        details: {
          tableId: id,
          projectId: table.projectId,
          entryId: created.id,
          entryCount: 1,
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("Create translation entry error:", error);
    return NextResponse.json(
      { error: "Không thể tạo entry", details: String(error) },
      { status: 500 },
    );
  }
}

