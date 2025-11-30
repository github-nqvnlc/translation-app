import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, createAuthErrorResponse } from '@/lib/middleware/auth';
import { Role } from '@prisma/client';
import { differenceInCalendarDays, format, subDays } from 'date-fns';

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

    const searchParams = request.nextUrl.searchParams;
    const rangePreset = searchParams.get('range') ?? '7d';
    const customStart = searchParams.get('start');
    const customEnd = searchParams.get('end');
    const selectedUserIdsParam = searchParams.get('users');
    const selectedUserIds = selectedUserIdsParam
      ? selectedUserIdsParam
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

    const now = new Date();
    let endDate = new Date(now.setHours(23, 59, 59, 999));
    let startDate: Date;

    if (rangePreset === '30d') {
      startDate = subDays(endDate, 29);
    } else if (customStart && customEnd) {
      const parsedStart = new Date(customStart);
      const parsedEnd = new Date(customEnd);
      if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
        startDate = subDays(endDate, 6);
      } else {
        startDate = new Date(parsedStart.setHours(0, 0, 0, 0));
        endDate = new Date(parsedEnd.setHours(23, 59, 59, 999));
      }
    } else {
      startDate = subDays(endDate, 6);
    }

    const rangeDays = Math.max(
      1,
      Math.min(90, differenceInCalendarDays(endDate, startDate) + 1),
    );

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        isPublic: true,
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

    const [
      totalTranslationEntries,
      translatedEntries,
      totalPoEntries,
      translationLanguages,
      poLanguages,
      recentTables,
      recentFiles,
      contributionLogsRaw,
    ] = await Promise.all([
      prisma.translationEntry.count({
        where: { table: { projectId } },
      }),
      prisma.translationEntry.count({
        where: {
          table: { projectId },
          translatedText: { not: '' },
        },
      }),
      prisma.poEntry.count({
        where: { file: { projectId } },
      }),
      prisma.translationTable.groupBy({
        where: { projectId },
        by: ['language'],
        _count: { _all: true },
      }),
      prisma.poFile.groupBy({
        where: { projectId, language: { not: null } },
        by: ['language'],
        _count: { _all: true },
      }),
      prisma.translationTable.findMany({
        where: { projectId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          language: true,
          updatedAt: true,
        },
      }),
      prisma.poFile.findMany({
        where: { projectId },
        orderBy: { uploadedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          filename: true,
          language: true,
          uploadedAt: true,
        },
      }),
      prisma.auditLog.findMany({
        where: {
          action: {
            in: [
              'translation_entry_created',
              'translation_entry_updated',
              'translation_entries_batch_translated',
            ],
          },
          details: {
            path: ['projectId'],
            equals: projectId,
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          userId: true,
          createdAt: true,
          details: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
    ]);

    const languageMap = new Map<string, number>();

    translationLanguages.forEach((item) => {
      const key = item.language || 'Không xác định';
      const prev = languageMap.get(key) || 0;
      languageMap.set(key, prev + item._count._all);
    });

    poLanguages.forEach((item) => {
      const key = item.language || 'Không xác định';
      const prev = languageMap.get(key) || 0;
      languageMap.set(key, prev + item._count._all);
    });

    const languageStats = Array.from(languageMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const recentUpdates = [
      ...recentTables.map((table) => ({
        id: table.id,
        type: 'translation-table' as const,
        title: table.name,
        meta: table.language,
        timestamp: table.updatedAt,
      })),
      ...recentFiles.map((file) => ({
        id: file.id,
        type: 'po-file' as const,
        title: file.filename,
        meta: file.language,
        timestamp: file.uploadedAt,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 6);

    const availableContributorsMap = new Map<
      string,
      {
        userId: string;
        name: string | null;
        email: string;
        image: string | null;
      }
    >();
    contributionLogsRaw.forEach((log) => {
      if (!log.userId) return;
      if (!availableContributorsMap.has(log.userId)) {
        availableContributorsMap.set(log.userId, {
          userId: log.userId,
          name: log.user?.name ?? null,
          email: log.user?.email ?? 'Ẩn danh',
          image: log.user?.image ?? null,
        });
      }
    });

    const contributionLogs =
      selectedUserIds.length === 0
        ? contributionLogsRaw
        : contributionLogsRaw.filter((log) =>
            log.userId ? selectedUserIds.includes(log.userId) : false,
          );

    const leaderboardMap = new Map<
      string,
      {
        userId: string;
        name: string | null;
        email: string;
        image: string | null;
        contributions: number;
      }
    >();

    const timelineStart = subDays(endDate, rangeDays - 1);
    const timelineLabels: string[] = [];
    const timelineKeys: string[] = [];

    for (let i = rangeDays - 1; i >= 0; i--) {
      const date = subDays(endDate, i);
      timelineLabels.push(format(date, 'dd/MM'));
      timelineKeys.push(format(date, 'yyyy-MM-dd'));
    }

    const timelineMap = new Map<string, Map<string, number>>();

    contributionLogs.forEach((log) => {
      if (!log.userId) return;
      const details = (log.details as Record<string, unknown>) || {};
      const entryCount = Number(details.entryCount ?? 1) || 1;

      if (!leaderboardMap.has(log.userId)) {
        leaderboardMap.set(log.userId, {
          userId: log.userId,
          name: log.user?.name ?? null,
          email: log.user?.email ?? 'Ẩn danh',
          image: log.user?.image ?? null,
          contributions: 0,
        });
      }

      const leader = leaderboardMap.get(log.userId)!;
      leader.contributions += entryCount;

      if (log.createdAt >= timelineStart) {
        const dateKey = format(log.createdAt, 'yyyy-MM-dd');
        if (!timelineMap.has(log.userId)) {
          timelineMap.set(log.userId, new Map());
        }
        const userMap = timelineMap.get(log.userId)!;
        userMap.set(dateKey, (userMap.get(dateKey) || 0) + entryCount);
      }
    });

    const leaderboard = Array.from(leaderboardMap.values()).sort(
      (a, b) => b.contributions - a.contributions,
    );

    const maxUsersToReturn =
      selectedUserIds.length > 0 ? leaderboard.length : 5;
    const topUsers = leaderboard.slice(0, maxUsersToReturn);

    const timelineSeries = topUsers.map((user) => {
      const userMap = timelineMap.get(user.userId) ?? new Map();
      const data = timelineKeys.map((key) => userMap.get(key) ?? 0);
      return {
        userId: user.userId,
        name: user.name || user.email,
        email: user.email,
        image: user.image,
        data,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          members: project._count.members,
          translationTables: project._count.translationTables,
          poFiles: project._count.poFiles,
        },
        completion: {
          translatedEntries,
          totalEntries: totalTranslationEntries,
        },
        poEntries: totalPoEntries,
        languages: languageStats,
        recentUpdates,
        translatorLeaderboard: topUsers,
        translatorTimeline: {
          labels: timelineLabels,
          series: timelineSeries,
        },
        availableContributors: Array.from(availableContributorsMap.values()),
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Project overview stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể tải dashboard project' },
      { status: 500 },
    );
  }
}

