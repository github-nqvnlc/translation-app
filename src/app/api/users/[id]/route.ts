import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createAuthErrorResponse } from "@/lib/middleware/auth";
import { Role } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check - profile là public nhưng cần đăng nhập
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const { id: userId } = await params;

    // Get user with profile settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profileSettings: true,
        projectMemberships: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            projectMemberships: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User không tồn tại" },
        { status: 404 }
      );
    }

    // Get privacy settings (default to all true if not set)
    const defaultSettings = {
      showEmail: false,
      showProjects: true,
      showTranslationTables: true,
      showPoFiles: true,
      showEntriesCount: true,
      showActivityChart: true,
      showLanguageStats: true,
      showProjectStats: true,
      showRecentActivity: true,
      showPosts: true,
    };
    const settings = user.profileSettings || defaultSettings;

    // Get stats (only if allowed by privacy settings)
    let projectCount = 0;
    let translationTableCount = 0;
    let poFileCount = 0;
    let entriesCount = 0;

    if (settings.showProjects) {
      projectCount = user._count.projectMemberships;
    }

    if (settings.showTranslationTables) {
      translationTableCount = await prisma.translationTable.count({
        where: {
          project: {
            members: {
              some: {
                userId: userId,
              },
            },
          },
        },
      });
    }

    if (settings.showPoFiles) {
      poFileCount = await prisma.poFile.count({
        where: {
          project: {
            members: {
              some: {
                userId: userId,
              },
            },
          },
        },
      });
    }

    if (settings.showEntriesCount) {
      const translationEntries = await prisma.translationEntry.count({
        where: {
          table: {
            project: {
              members: {
                some: {
                  userId: userId,
                },
              },
            },
          },
        },
      });

      const poEntries = await prisma.poEntry.count({
        where: {
          file: {
            project: {
              members: {
                some: {
                  userId: userId,
                },
              },
            },
          },
        },
      });

      entriesCount = translationEntries + poEntries;
    }

    // Build response based on privacy settings
    const response: {
      id: string;
      name: string | null;
      email?: string;
      image: string | null;
      bio: string | null;
      createdAt: Date;
      stats: {
        projects?: number;
        translationTables?: number;
        poFiles?: number;
        entries?: number;
      };
      projectRoles: Array<{
        projectId: string;
        projectName: string;
        role: Role;
      }>;
      privacySettings: {
        showEmail: boolean;
        showProjects: boolean;
        showTranslationTables: boolean;
        showPoFiles: boolean;
        showEntriesCount: boolean;
        showActivityChart: boolean;
        showLanguageStats: boolean;
        showProjectStats: boolean;
        showRecentActivity: boolean;
        showPosts: boolean;
      };
    } = {
      id: user.id,
      name: user.name,
      image: user.image,
      bio: user.profileSettings?.bio || null,
      createdAt: user.createdAt,
      stats: {},
      projectRoles: user.projectMemberships.map((m) => ({
        projectId: m.project.id,
        projectName: m.project.name,
        role: m.role,
      })),
      privacySettings: {
        showEmail: settings.showEmail,
        showProjects: settings.showProjects,
        showTranslationTables: settings.showTranslationTables,
        showPoFiles: settings.showPoFiles,
        showEntriesCount: settings.showEntriesCount,
        showActivityChart: settings.showActivityChart,
        showLanguageStats: settings.showLanguageStats,
        showProjectStats: settings.showProjectStats,
        showRecentActivity: settings.showRecentActivity,
        showPosts: settings.showPosts,
      },
    };

    // Only include email if allowed
    if (settings.showEmail) {
      response.email = user.email;
    }

    // Only include stats if allowed
    if (settings.showProjects) {
      response.stats.projects = projectCount;
    }
    if (settings.showTranslationTables) {
      response.stats.translationTables = translationTableCount;
    }
    if (settings.showPoFiles) {
      response.stats.poFiles = poFileCount;
    }
    if (settings.showEntriesCount) {
      response.stats.entries = entriesCount;
    }

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Get user profile error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi lấy thông tin profile" },
      { status: 500 }
    );
  }
}

