import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createAuthErrorResponse } from "@/lib/middleware/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // day, week, month

    // Get user profile settings to respect privacy
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profileSettings: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User không tồn tại" },
        { status: 404 }
      );
    }

    const settings = user.profileSettings || {
      showActivityChart: true,
      showLanguageStats: true,
      showProjectStats: true,
      showRecentActivity: true,
    };

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case "day":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30); // Last 30 days
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 12 * 7); // Last 12 weeks
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 12); // Last 12 months
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 12);
    }

    // Get user's project IDs
    const userProjects = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = userProjects.map((p) => p.projectId);

    // Translations created by date
    const translationsByDate = await prisma.translationTable.groupBy({
      by: ["createdAt"],
      where: {
        projectId: { in: projectIds },
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Files uploaded by date
    const filesByDate = await prisma.poFile.groupBy({
      by: ["uploadedAt"],
      where: {
        projectId: { in: projectIds },
        uploadedAt: { gte: startDate },
      },
      _count: true,
    });

    // Entries translated by date
    const translationEntriesByDate = await prisma.translationEntry.groupBy({
      by: ["createdAt"],
      where: {
        table: {
          projectId: { in: projectIds },
        },
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    const poEntriesByDate = await prisma.poEntry.groupBy({
      by: ["createdAt"],
      where: {
        file: {
          projectId: { in: projectIds },
        },
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Group by language (from translation tables and PO files)
    const translationLanguages = await prisma.translationTable.groupBy({
      by: ["language"],
      where: {
        projectId: { in: projectIds },
      },
      _count: true,
    });

    const poLanguages = await prisma.poFile.groupBy({
      by: ["language"],
      where: {
        projectId: { in: projectIds },
        language: { not: null },
      },
      _count: true,
    });

    // Group by project
    const byProject = await prisma.translationTable.groupBy({
      by: ["projectId"],
      where: {
        projectId: { in: projectIds },
      },
      _count: true,
    });

    const projectStats = await Promise.all(
      byProject.map(async (stat) => {
        const project = await prisma.project.findUnique({
          where: { id: stat.projectId || "" },
          select: { name: true },
        });
        return {
          projectId: stat.projectId,
          projectName: project?.name || "Unknown",
          count: stat._count,
        };
      })
    );

    // Recent activities from audit logs
    const recentActivities = await prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        resourceType: true,
        resourceId: true,
        createdAt: true,
      },
    });

    // Format data for charts
    const activityData = formatActivityData(
      translationsByDate,
      filesByDate,
      translationEntriesByDate,
      poEntriesByDate,
      period
    );

    // Combine language stats
    const languageStatsMap = new Map<string, number>();
    translationLanguages.forEach((item) => {
      const lang = item.language || "unknown";
      languageStatsMap.set(lang, (languageStatsMap.get(lang) || 0) + item._count);
    });
    poLanguages.forEach((item) => {
      const lang = item.language || "unknown";
      languageStatsMap.set(lang, (languageStatsMap.get(lang) || 0) + item._count);
    });

    const languageStats = Array.from(languageStatsMap.entries()).map(([language, count]) => ({
      language,
      count,
    }));

    return NextResponse.json({
      data: {
        activityChart: settings.showActivityChart ? activityData : null,
        languageStats: settings.showLanguageStats ? languageStats : null,
        projectStats: settings.showProjectStats ? projectStats : null,
        recentActivity: settings.showRecentActivity ? recentActivities : null,
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi lấy thống kê" },
      { status: 500 }
    );
  }
}

function formatActivityData(
  translations: Array<{ createdAt: Date; _count: number }>,
  files: Array<{ uploadedAt: Date; _count: number }>,
  translationEntries: Array<{ createdAt: Date; _count: number }>,
  poEntries: Array<{ createdAt: Date; _count: number }>,
  period: string
): Array<{ date: string; translations: number; files: number; entries: number }> {
  const dataMap = new Map<string, { translations: number; files: number; entries: number }>();

  // Process translations
  translations.forEach((item) => {
    const dateKey = formatDateKey(item.createdAt, period);
    const existing = dataMap.get(dateKey) || { translations: 0, files: 0, entries: 0 };
    existing.translations += item._count;
    dataMap.set(dateKey, existing);
  });

  // Process files
  files.forEach((item) => {
    const dateKey = formatDateKey(item.uploadedAt, period);
    const existing = dataMap.get(dateKey) || { translations: 0, files: 0, entries: 0 };
    existing.files += item._count;
    dataMap.set(dateKey, existing);
  });

  // Process translation entries
  translationEntries.forEach((item) => {
    const dateKey = formatDateKey(item.createdAt, period);
    const existing = dataMap.get(dateKey) || { translations: 0, files: 0, entries: 0 };
    existing.entries += item._count;
    dataMap.set(dateKey, existing);
  });

  // Process PO entries
  poEntries.forEach((item) => {
    const dateKey = formatDateKey(item.createdAt, period);
    const existing = dataMap.get(dateKey) || { translations: 0, files: 0, entries: 0 };
    existing.entries += item._count;
    dataMap.set(dateKey, existing);
  });

  // Convert to array and sort by date
  return Array.from(dataMap.entries())
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function formatDateKey(date: Date, period: string): string {
  const d = new Date(date);
  switch (period) {
    case "day":
      return d.toISOString().split("T")[0]; // YYYY-MM-DD
    case "week":
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      return weekStart.toISOString().split("T")[0];
    case "month":
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
    default:
      return d.toISOString().split("T")[0];
  }
}

