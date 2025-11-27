import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { prisma } from "@/lib/prisma";
import { requireAuth, createAuthErrorResponse } from "@/lib/middleware/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const userId = authResult.user.id;
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Vui lòng chọn ảnh" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Kích thước file không được vượt quá 5MB" },
        { status: 400 }
      );
    }

    // Get user to check old avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User không tồn tại" },
        { status: 404 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || "jpg";
    const filename = `${userId}-${Date.now()}.${fileExtension}`;
    const uploadDir = join(process.cwd(), "public", "avatars");

    // Create upload directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file
    const filePath = join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate URL
    const avatarUrl = `/avatars/${filename}`;

    // Delete old avatar if exists and it's a local file (not OAuth)
    if (user.image && user.image.startsWith("/avatars/")) {
      const oldFilePath = join(process.cwd(), "public", user.image);
      if (existsSync(oldFilePath)) {
        try {
          const { unlink } = await import("fs/promises");
          await unlink(oldFilePath);
        } catch (error) {
          console.error("Error deleting old avatar:", error);
          // Continue even if deletion fails
        }
      }
    }

    // Update user image
    await prisma.user.update({
      where: { id: userId },
      data: { image: avatarUrl },
    });

    return NextResponse.json({
      success: true,
      imageUrl: avatarUrl,
      message: "Cập nhật avatar thành công",
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi upload avatar" },
      { status: 500 }
    );
  }
}

