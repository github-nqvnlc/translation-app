import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, createAuthErrorResponse } from '@/lib/middleware/auth';
import { requireAuthAndProjectRole } from '@/lib/middleware/rbac';
import { Role } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const user = authResult.user;
    const { id: projectId } = await params;

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
        { status: 404 },
      );
    }

    const isAdmin = user.systemRole === Role.ADMIN;
    const isMember = user.projectRoles.some((pr) => pr.projectId === projectId);

    if (!isAdmin && !isMember && !project.isPublic) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền truy cập project này' },
        { status: 403 },
      );
    }

    const settings = await prisma.projectOverviewSettings.upsert({
      where: { projectId },
      update: {},
      create: { projectId },
    });

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get overview settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể lấy cài đặt dashboard' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;

    const { user, error } = await requireAuthAndProjectRole(
      projectId,
      Role.ADMIN,
    );
    if (error) {
      return error;
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const payload = await request.json();

    const updatableFields = [
      'showSummaryCards',
      'showCompletionCard',
      'showLanguageChart',
      'showRecentUpdates',
    ] as const;

    const data: Record<string, boolean> = {};

    updatableFields.forEach((field) => {
      if (payload[field] !== undefined) {
        data[field] = Boolean(payload[field]);
      }
    });

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không có dữ liệu để cập nhật' },
        { status: 400 },
      );
    }

    const settings = await prisma.projectOverviewSettings.upsert({
      where: { projectId },
      update: data,
      create: { projectId, ...data },
    });

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Update overview settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể cập nhật cài đặt dashboard' },
      { status: 500 },
    );
  }
}

