import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GEMINI_CHARACTER_LIMIT, GEMINI_MAX_TEXTS_PER_REQUEST } from "@/lib/constants";
import { GeminiError, translateTextsWithGemini } from "@/lib/gemini";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type BatchTranslatePayload = {
  entryIds?: number[];
  targetLang?: string;
  sourceLang?: string;
  overwriteExisting?: boolean;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;

  let payload: BatchTranslatePayload;
  try {
    payload = (await request.json()) as BatchTranslatePayload;
  } catch {
    return NextResponse.json({ error: "Payload không hợp lệ" }, { status: 400 });
  }

  const entryIds = Array.isArray(payload.entryIds)
    ? payload.entryIds
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    : [];

  if (entryIds.length === 0) {
    return NextResponse.json({ error: "Cần ít nhất một entry để dịch" }, { status: 400 });
  }

  const targetLang =
    typeof payload.targetLang === "string" ? payload.targetLang.trim().toUpperCase() : "";
  if (!targetLang) {
    return NextResponse.json({ error: "Thiếu targetLang" }, { status: 400 });
  }

  const sourceLang =
    typeof payload.sourceLang === "string" ? payload.sourceLang.trim().toUpperCase() : undefined;
  const overwriteExisting = Boolean(payload.overwriteExisting);

  const [entries, file] = await Promise.all([
    prisma.poEntry.findMany({
      where: {
        fileId: id,
        id: { in: entryIds },
      },
      orderBy: { id: "asc" },
    }),
    prisma.poFile.findUnique({
      where: { id },
      select: {
        filename: true,
        language: true,
        metadata: {
          select: { key: true, value: true },
          take: 10,
        },
      },
    }),
  ]);

  const metadataSummary = file?.metadata
    ?.map((item) => `${item.key}: ${item.value}`)
    .join(" | ");

  const buildEntryContext = (entry: (typeof entries)[number]) => {
    const parts = [
      file?.filename ? `Tệp: ${file.filename}` : null,
      file?.language ? `Ngôn ngữ tệp: ${file.language}` : null,
      metadataSummary ? `Metadata: ${metadataSummary}` : null,
      entry.description ? `Mô tả: ${entry.description}` : null,
      entry.references ? `References: ${entry.references}` : null,
      entry.msgstr ? `Bản dịch hiện tại: ${entry.msgstr}` : null,
    ].filter(Boolean);
    return parts.join("\n");
  };

  if (entries.length === 0) {
    return NextResponse.json({ error: "Không tìm thấy entries hợp lệ" }, { status: 404 });
  }

  const missingCount = entryIds.length - entries.length;
  const candidates = overwriteExisting
    ? entries
    : entries.filter((entry) => !entry.msgstr || entry.msgstr.trim() === "");

  if (candidates.length === 0) {
    return NextResponse.json({
      data: {
        translatedCount: 0,
        skippedCount: entries.length,
        missingCount,
        totalCharacters: 0,
        limit: GEMINI_CHARACTER_LIMIT,
        message: "Tất cả các entry đã có bản dịch",
      },
    });
  }

  let totalCharacters = 0;
  const updates: { id: number; msgstr: string }[] = [];

  try {
    for (let i = 0; i < candidates.length; i += GEMINI_MAX_TEXTS_PER_REQUEST) {
      const chunk = candidates.slice(i, i + GEMINI_MAX_TEXTS_PER_REQUEST);
      const inputs = chunk.map((entry) => ({
        text: entry.msgid,
        context: buildEntryContext(entry),
      }));

      const translations = await translateTextsWithGemini(inputs, {
        targetLang,
        sourceLang,
      });

      chunk.forEach((entry, index) => {
        const translated = translations[index]?.text;
        if (typeof translated === "string" && translated.trim()) {
          totalCharacters += entry.msgid.length;
          updates.push({ id: entry.id, msgstr: translated });
        }
      });
    }
  } catch (error) {
    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Gemini batch translation error", error);
    return NextResponse.json(
      { error: "Không thể kết nối tới Gemini. Vui lòng thử lại sau." },
      { status: 502 },
    );
  }

  if (updates.length === 0) {
    return NextResponse.json({
      data: {
        translatedCount: 0,
        skippedCount: entries.length,
        missingCount,
        totalCharacters: 0,
        limit: GEMINI_CHARACTER_LIMIT,
        message: "Không có bản dịch nào được cập nhật",
      },
    });
  }

  await prisma.$transaction(
    updates.map((item) =>
      prisma.poEntry.update({
        where: {
          id: item.id,
          fileId: id,
        },
        data: {
          msgstr: item.msgstr,
        },
      }),
    ),
  );

  return NextResponse.json({
    data: {
      translatedCount: updates.length,
      skippedCount: entries.length - candidates.length,
      missingCount,
      totalCharacters,
      limit: GEMINI_CHARACTER_LIMIT,
    },
  });
}

