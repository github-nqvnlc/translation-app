import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createAuthErrorResponse } from "@/lib/middleware/auth";
import { Role } from "@prisma/client";

// DELETE - Delete avatar comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const { commentId } = await params;
    const currentUserId = authResult.user.id;
    const isAdmin = authResult.user.systemRole === Role.ADMIN;

    // Find comment
    const comment = await prisma.avatarComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment không tồn tại" },
        { status: 404 }
      );
    }

    // Check permission: only author, target user, or admin can delete
    const canDelete =
      isAdmin ||
      comment.authorId === currentUserId ||
      comment.targetUserId === currentUserId;

    if (!canDelete) {
      return NextResponse.json(
        { error: "Bạn không có quyền xóa comment này" },
        { status: 403 }
      );
    }

    // Delete comment
    await prisma.avatarComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa comment",
    });
  } catch (error) {
    console.error("Delete avatar comment error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}

