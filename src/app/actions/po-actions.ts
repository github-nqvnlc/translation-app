"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parsePo } from "@/lib/po-parser";
import { getAuthenticatedUser } from "@/lib/middleware/auth";
import { Role } from "@prisma/client";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export type UploadPoResult = {
  success: boolean;
  message: string;
  fileId?: string;
};

function normalizeMessage(message: string) {
  return message.replace(/\s*\n\s*/g, " ").trim();
}

export async function uploadPoFile(
  _prevState: UploadPoResult,
  formData: FormData,
): Promise<UploadPoResult> {
  const file = formData.get("poFile") as File | null;
  if (!file) {
    return { success: false, message: "Vui lòng chọn tệp .po" };
  }

  if (!file.name.endsWith(".po")) {
    return { success: false, message: "Định dạng không hợp lệ, chỉ chấp nhận .po" };
  }

  if (file.size === 0) {
    return { success: false, message: "Tệp rỗng" };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { success: false, message: "Kích thước tối đa 5MB" };
  }

  const buffer = await file.arrayBuffer();
  const content = Buffer.from(buffer).toString("utf-8");
  const parsed = parsePo(content);

  if (!parsed.entries.length) {
    return { success: false, message: "Không tìm thấy msgid/msgstr trong tệp" };
  }

  // Authentication check
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, message: "Bạn cần đăng nhập để upload file" };
  }

  // Check email verification
  if (!user.emailVerified) {
    return { success: false, message: "Vui lòng xác minh email trước khi upload file" };
  }

  // Validate projectId is required
  const projectId = formData.get("projectId")?.toString();
  if (!projectId || typeof projectId !== "string") {
    return { success: false, message: "projectId là bắt buộc" };
  }

  // Validate project access
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        where: { userId: user.id },
      },
    },
  });

  if (!project) {
    return { success: false, message: "Project không tồn tại" };
  }

  const isAdmin = user.systemRole === Role.ADMIN;
  const isMember = project.members.length > 0;
  const hasEditorRole = project.members.some(
    (m) => m.role === Role.EDITOR || m.role === Role.REVIEWER || m.role === Role.ADMIN
  );

  if (!isAdmin && (!isMember || !hasEditorRole)) {
    return {
      success: false,
      message: "Bạn cần quyền EDITOR trở lên để upload file vào project này",
    };
  }

  const metadataData = Object.entries(parsed.metadata).map(([key, value]) => ({
    key,
    value,
  }));

  const created = await prisma.poFile.create({
    data: {
      filename: file.name,
      filesize: file.size,
      language: parsed.language ?? null,
      projectId: projectId, // Required, not nullable
      ...(metadataData.length
        ? {
            metadata: {
              createMany: {
                data: metadataData,
              },
            },
          }
        : {}),
      entries: {
        createMany: {
          data: parsed.entries.map((entry) => ({
            msgid: normalizeMessage(entry.msgid),
            msgstr: normalizeMessage(entry.msgstr),
            description: entry.description?.trim() || null,
            references: entry.references?.trim() || null,
          })),
        },
      },
    },
  });

  revalidatePath("/");
  return {
    success: true,
    message: `Đã tải ${created.filename} với ${parsed.entries.length} bản ghi`,
    fileId: created.id,
  };
}

export async function deleteFiles(fileIds: string[]) {
  const ids = fileIds.filter(Boolean);
  if (!ids.length) {
    return { success: false, message: "Chưa chọn tệp nào" };
  }

  await prisma.poEntry.deleteMany({
    where: {
      fileId: {
        in: ids,
      },
    },
  });
  await prisma.poFile.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  });

  revalidatePath("/");
  return { success: true, message: `Đã xoá ${ids.length} tệp` };
}

export async function deleteAllFiles() {
  await prisma.poEntry.deleteMany();
  await prisma.poFile.deleteMany();
  revalidatePath("/");
  return { success: true, message: "Đã xoá tất cả tệp .po" };
}

