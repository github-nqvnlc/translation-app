import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEntryPayload, parseMetadataPayload } from "@/lib/utils/po-payload";
import { requireAuth, createAuthErrorResponse } from "@/lib/middleware/auth";
import { requireAuthAndPermission } from "@/lib/middleware/rbac";
import { getClientIp, getUserAgent } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const user = authResult.user;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";

    // Build where clause with project filtering
    // Only return files that have a projectId (required)
    const whereClause: {
      projectId: { not: null };
      project?: { OR: Array<{ id?: { in: string[] }; isPublic?: boolean }> };
      OR?: Array<{
        filename?: { contains: string };
        language?: { contains: string };
        metadata?: { some: { OR: Array<{ key?: { contains: string }; value?: { contains: string } }> } };
      }>;
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

    // Add search query
    if (query) {
      whereClause.OR = [
        { filename: { contains: query } },
        { language: { contains: query } },
        {
          metadata: {
            some: {
              OR: [
                { key: { contains: query } },
                { value: { contains: query } },
              ],
            },
          },
        },
      ];
    }

    const files = await prisma.poFile.findMany({
      where: whereClause,
      orderBy: { uploadedAt: "desc" },
      include: {
        metadata: true,
        _count: { select: { entries: true } },
        project: {
          select: {
            id: true,
            name: true,
            isPublic: true,
          },
        },
      },
    });

    return NextResponse.json({ data: files });
  } catch (error) {
    console.error("Get files error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi lấy danh sách files" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication and permission check
    const permissionResult = await requireAuthAndPermission("upload_files");
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
        { error: "Vui lòng xác minh email trước khi upload file" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { filename, language, entries, metadata, filesize = 0, projectId } = body ?? {};

    if (!filename || typeof filename !== "string") {
      return NextResponse.json(
        { error: "Thiếu tên tệp (filename)" },
        { status: 400 },
      );
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "Cần ít nhất một entry trong mảng entries" },
        { status: 400 },
      );
    }

    const metadataData = parseMetadataPayload(metadata);
    const entryData = parseEntryPayload(entries);

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
        { error: "Bạn cần quyền EDITOR trở lên để upload file vào project này" },
        { status: 403 }
      );
    }

    const created = await prisma.poFile.create({
      data: {
        filename,
        filesize: Number(filesize) || 0,
        language: typeof language === "string" ? language : null,
        projectId: projectId, // Required, not nullable
        metadata: metadataData.length
          ? {
              createMany: {
                data: metadataData,
              },
            }
          : undefined,
        entries: {
          createMany: {
            data: entryData,
          },
        },
      },
      include: {
        metadata: true,
        _count: { select: { entries: true } },
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
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "file_uploaded",
        resourceType: "po_file",
        resourceId: created.id,
        details: {
          filename: created.filename,
          filesize: created.filesize,
          entryCount: entryData.length,
          projectId: projectId,
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể tạo tệp .po mới", details: String(error) },
      { status: 500 },
    );
  }
}

