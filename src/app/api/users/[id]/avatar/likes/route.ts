import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createAuthErrorResponse } from "@/lib/middleware/auth";

// GET - Get likes count and check if current user liked
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const { id: targetUserId } = await params;
    const currentUserId = authResult.user.id;

    // Check if target user exists and allows showing likes
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        profileSettings: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User không tồn tại" },
        { status: 404 }
      );
    }

    // Check privacy settings
    const showLikes = targetUser.profileSettings?.showAvatarLikes ?? true;

    // Get likes count
    const likesCount = await prisma.avatarLike.count({
      where: { targetUserId },
    });

    // Check if current user liked
    const userLiked = await prisma.avatarLike.findUnique({
      where: {
        userId_targetUserId: {
          userId: currentUserId,
          targetUserId,
        },
      },
    });

    return NextResponse.json({
      data: {
        likesCount: showLikes ? likesCount : null,
        userLiked: !!userLiked,
        showLikes,
      },
    });
  } catch (error) {
    console.error("Get avatar likes error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}

// POST - Like avatar
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const { id: targetUserId } = await params;
    const currentUserId = authResult.user.id;

    // Can't like own avatar
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: "Bạn không thể thả tim avatar của chính mình" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User không tồn tại" },
        { status: 404 }
      );
    }

    // Create like (upsert to handle duplicates)
    await prisma.avatarLike.upsert({
      where: {
        userId_targetUserId: {
          userId: currentUserId,
          targetUserId,
        },
      },
      update: {},
      create: {
        userId: currentUserId,
        targetUserId,
      },
    });

    // Get new count
    const likesCount = await prisma.avatarLike.count({
      where: { targetUserId },
    });

    return NextResponse.json({
      success: true,
      likesCount,
      userLiked: true,
    });
  } catch (error) {
    console.error("Like avatar error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}

// DELETE - Unlike avatar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const { id: targetUserId } = await params;
    const currentUserId = authResult.user.id;

    // Delete like
    await prisma.avatarLike.deleteMany({
      where: {
        userId: currentUserId,
        targetUserId,
      },
    });

    // Get new count
    const likesCount = await prisma.avatarLike.count({
      where: { targetUserId },
    });

    return NextResponse.json({
      success: true,
      likesCount,
      userLiked: false,
    });
  } catch (error) {
    console.error("Unlike avatar error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}

