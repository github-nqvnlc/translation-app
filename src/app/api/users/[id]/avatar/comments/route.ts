import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createAuthErrorResponse } from "@/lib/middleware/auth";

// GET - Get comments for avatar
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

    // Check if target user exists and allows comments
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
    const allowComments = targetUser.profileSettings?.allowAvatarComments ?? true;

    if (!allowComments) {
      return NextResponse.json({
        data: {
          comments: [],
          allowComments: false,
        },
      });
    }

    // Get comments
    const comments = await prisma.avatarComment.findMany({
      where: { targetUserId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      data: {
        comments,
        allowComments: true,
      },
    });
  } catch (error) {
    console.error("Get avatar comments error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}

// POST - Add comment to avatar
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
    const body = await request.json();

    // Validate content
    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json(
        { error: "Nội dung comment không hợp lệ" },
        { status: 400 }
      );
    }

    const content = body.content.trim();
    if (content.length === 0 || content.length > 500) {
      return NextResponse.json(
        { error: "Nội dung comment phải từ 1-500 ký tự" },
        { status: 400 }
      );
    }

    // Check if target user exists and allows comments
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
    const allowComments = targetUser.profileSettings?.allowAvatarComments ?? true;
    if (!allowComments) {
      return NextResponse.json(
        { error: "Người dùng này không cho phép comment trên avatar" },
        { status: 403 }
      );
    }

    // Create comment
    const comment = await prisma.avatarComment.create({
      data: {
        content,
        authorId: currentUserId,
        targetUserId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error("Add avatar comment error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}

