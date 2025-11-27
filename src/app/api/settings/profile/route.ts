import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createAuthErrorResponse } from "@/lib/middleware/auth";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const userId = authResult.user.id;

    // Get user with profile settings
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

    // Return user info and settings
    const response = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.profileSettings?.bio || null,
      privacySettings: user.profileSettings || {
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
      },
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Get profile settings error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi lấy thông tin profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const userId = authResult.user.id;
    const body = await request.json();

    // Validate input
    if (body.name !== undefined && typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Tên không hợp lệ" },
        { status: 400 }
      );
    }

    if (body.name && body.name.length > 100) {
      return NextResponse.json(
        { error: "Tên không được vượt quá 100 ký tự" },
        { status: 400 }
      );
    }

    if (body.bio !== undefined && typeof body.bio !== "string" && body.bio !== null) {
      return NextResponse.json(
        { error: "Bio không hợp lệ" },
        { status: 400 }
      );
    }

    if (body.bio && body.bio.length > 500) {
      return NextResponse.json(
        { error: "Bio không được vượt quá 500 ký tự" },
        { status: 400 }
      );
    }

    // Update user name if provided
    if (body.name !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: body.name },
      });
    }

    // Update or create profile settings
    const privacySettings = body.privacySettings || {};
    const settingsData: {
      bio?: string | null;
      showEmail?: boolean;
      showProjects?: boolean;
      showTranslationTables?: boolean;
      showPoFiles?: boolean;
      showEntriesCount?: boolean;
      showActivityChart?: boolean;
      showLanguageStats?: boolean;
      showProjectStats?: boolean;
      showRecentActivity?: boolean;
      showPosts?: boolean;
      showAvatarLikes?: boolean;
      allowAvatarComments?: boolean;
    } = {};

    if (body.bio !== undefined) {
      settingsData.bio = body.bio;
    }

    if (privacySettings.showEmail !== undefined) {
      settingsData.showEmail = Boolean(privacySettings.showEmail);
    }
    if (privacySettings.showProjects !== undefined) {
      settingsData.showProjects = Boolean(privacySettings.showProjects);
    }
    if (privacySettings.showTranslationTables !== undefined) {
      settingsData.showTranslationTables = Boolean(privacySettings.showTranslationTables);
    }
    if (privacySettings.showPoFiles !== undefined) {
      settingsData.showPoFiles = Boolean(privacySettings.showPoFiles);
    }
    if (privacySettings.showEntriesCount !== undefined) {
      settingsData.showEntriesCount = Boolean(privacySettings.showEntriesCount);
    }
    if (privacySettings.showActivityChart !== undefined) {
      settingsData.showActivityChart = Boolean(privacySettings.showActivityChart);
    }
    if (privacySettings.showLanguageStats !== undefined) {
      settingsData.showLanguageStats = Boolean(privacySettings.showLanguageStats);
    }
    if (privacySettings.showProjectStats !== undefined) {
      settingsData.showProjectStats = Boolean(privacySettings.showProjectStats);
    }
    if (privacySettings.showRecentActivity !== undefined) {
      settingsData.showRecentActivity = Boolean(privacySettings.showRecentActivity);
    }
    if (privacySettings.showPosts !== undefined) {
      settingsData.showPosts = Boolean(privacySettings.showPosts);
    }
    if (privacySettings.showAvatarLikes !== undefined) {
      settingsData.showAvatarLikes = Boolean(privacySettings.showAvatarLikes);
    }
    if (privacySettings.allowAvatarComments !== undefined) {
      settingsData.allowAvatarComments = Boolean(privacySettings.allowAvatarComments);
    }

    // Upsert profile settings
    await prisma.userProfileSettings.upsert({
      where: { userId },
      update: settingsData,
      create: {
        userId,
        bio: body.bio || null,
        showEmail: privacySettings.showEmail ?? false,
        showProjects: privacySettings.showProjects ?? true,
        showTranslationTables: privacySettings.showTranslationTables ?? true,
        showPoFiles: privacySettings.showPoFiles ?? true,
        showEntriesCount: privacySettings.showEntriesCount ?? true,
        showActivityChart: privacySettings.showActivityChart ?? true,
        showLanguageStats: privacySettings.showLanguageStats ?? true,
        showProjectStats: privacySettings.showProjectStats ?? true,
        showRecentActivity: privacySettings.showRecentActivity ?? true,
        showPosts: privacySettings.showPosts ?? true,
        showAvatarLikes: privacySettings.showAvatarLikes ?? true,
        allowAvatarComments: privacySettings.allowAvatarComments ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật profile thành công",
    });
  } catch (error) {
    console.error("Update profile settings error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi cập nhật profile" },
      { status: 500 }
    );
  }
}

