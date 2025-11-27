import { requireAuth } from '@/lib/middleware/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { TranslationStats } from '@/components/dashboard/translation-stats';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { ProfileHeader } from '@/components/profile/profile-header';

interface UserProfileData {
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
    showAvatarLikes: boolean;
    allowAvatarComments: boolean;
  };
}

async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  try {
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
      return null;
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
      showAvatarLikes: true,
      allowAvatarComments: true,
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
    const response: UserProfileData = {
      id: user.id,
      name: user.name,
      image: user.image,
      bio: user.profileSettings?.bio || null,
      createdAt: user.createdAt,
      stats: {},
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
        showAvatarLikes: settings.showAvatarLikes,
        allowAvatarComments: settings.allowAvatarComments,
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

    return response;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    redirect('/login');
  }

  const { id: userId } = await params;
  const currentUserId = authResult.user?.id;

  // Fetch user profile data
  const profileData = await getUserProfile(userId);

  if (!profileData) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Không tìm thấy người dùng</h1>
          <p className="mt-2 text-slate-400">Người dùng này không tồn tại hoặc đã bị xóa.</p>
        </div>
      </div>
    );
  }

  const isOwner = currentUserId === userId;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      {/* Header */}
      <ProfileHeader
        userId={profileData.id}
        name={profileData.name}
        email={profileData.email}
        image={profileData.image}
        bio={profileData.bio}
        createdAt={profileData.createdAt.toISOString()}
        isOwner={isOwner}
        currentUserId={currentUserId || ''}
        showEmail={profileData.privacySettings.showEmail}
        showAvatarLikes={profileData.privacySettings.showAvatarLikes}
        allowAvatarComments={profileData.privacySettings.allowAvatarComments}
      />

      {/* Stats Cards */}
      {(profileData.stats.projects !== undefined ||
        profileData.stats.translationTables !== undefined ||
        profileData.stats.poFiles !== undefined ||
        profileData.stats.entries !== undefined) && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {profileData.stats.projects !== undefined && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
              <div className="text-sm font-medium text-slate-400">Dự án</div>
              <div className="mt-2 text-3xl font-bold text-white">
                {profileData.stats.projects}
              </div>
            </div>
          )}

          {profileData.stats.translationTables !== undefined && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
              <div className="text-sm font-medium text-slate-400">Bảng dịch</div>
              <div className="mt-2 text-3xl font-bold text-white">
                {profileData.stats.translationTables}
              </div>
            </div>
          )}

          {profileData.stats.poFiles !== undefined && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
              <div className="text-sm font-medium text-slate-400">Tệp PO</div>
              <div className="mt-2 text-3xl font-bold text-white">
                {profileData.stats.poFiles}
              </div>
            </div>
          )}

          {profileData.stats.entries !== undefined && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
              <div className="text-sm font-medium text-slate-400">Bản dịch</div>
              <div className="mt-2 text-3xl font-bold text-white">
                {profileData.stats.entries}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/40">
        <div className="border-b border-white/10">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button className="border-b-2 border-sky-500 py-4 px-1 text-sm font-medium text-sky-400">
              Tổng quan
            </button>
            {profileData.privacySettings.showPosts && (
              <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-slate-400 transition hover:border-white/20 hover:text-white">
              Bài viết
            </button>
            )}
            {profileData.privacySettings.showRecentActivity && (
              <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-slate-400 transition hover:border-white/20 hover:text-white">
              Hoạt động
            </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {/* Activity Chart */}
            {profileData.privacySettings.showActivityChart && (
              <ActivityChart
                userId={userId}
                period="month"
                showChart={profileData.privacySettings.showActivityChart}
              />
            )}

            {/* Translation Stats */}
            {(profileData.privacySettings.showLanguageStats ||
              profileData.privacySettings.showProjectStats) && (
              <TranslationStats
                userId={userId}
                showLanguageStats={profileData.privacySettings.showLanguageStats}
                showProjectStats={profileData.privacySettings.showProjectStats}
              />
            )}

            {/* Recent Activity */}
            {profileData.privacySettings.showRecentActivity && (
              <RecentActivity
                userId={userId}
                showActivity={profileData.privacySettings.showRecentActivity}
              />
            )}

            {!profileData.privacySettings.showActivityChart &&
              !profileData.privacySettings.showLanguageStats &&
              !profileData.privacySettings.showProjectStats &&
              !profileData.privacySettings.showRecentActivity && (
                <div className="text-center text-slate-400">
                  <p>Nội dung sẽ được thêm vào trong các phase tiếp theo.</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

