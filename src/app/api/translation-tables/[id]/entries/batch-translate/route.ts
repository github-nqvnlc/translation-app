import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEEPL_FREE_CHARACTER_LIMIT, DEEPL_MAX_TEXTS_PER_REQUEST } from "@/lib/constants";
import { DeepLError, translateTextsWithDeepL } from "@/lib/deepl";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type BatchTranslatePayload = {
  entryIds?: number[];
  targetLang?: string;
  sourceLang?: string;
  formality?: "default" | "more" | "less";
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
  const formality = payload.formality;
  const overwriteExisting = Boolean(payload.overwriteExisting);

  const entries = await prisma.translationEntry.findMany({
    where: {
      tableId: id,
      id: { in: entryIds },
    },
    orderBy: { id: "asc" },
  });

  if (entries.length === 0) {
    return NextResponse.json({ error: "Không tìm thấy entries hợp lệ" }, { status: 404 });
  }

  const missingCount = entryIds.length - entries.length;
  const candidates = overwriteExisting
    ? entries
    : entries.filter((entry) => !entry.translatedText || entry.translatedText.trim() === "");

  if (candidates.length === 0) {
    return NextResponse.json({
      data: {
        translatedCount: 0,
        skippedCount: entries.length,
        missingCount,
        totalCharacters: 0,
        limit: DEEPL_FREE_CHARACTER_LIMIT,
        message: "Tất cả các entry đã có bản dịch, không cần dịch lại",
      },
    });
  }

  let totalCharacters = 0;
  const updates: { id: number; translatedText: string }[] = [];

  try {
    for (let i = 0; i < candidates.length; i += DEEPL_MAX_TEXTS_PER_REQUEST) {
      const chunk = candidates.slice(i, i + DEEPL_MAX_TEXTS_PER_REQUEST);
      const texts = chunk.map((entry) => entry.sourceText);

      const translations = await translateTextsWithDeepL(texts, {
        targetLang,
        sourceLang,
        formality,
      });

      chunk.forEach((entry, index) => {
        const translated = translations[index]?.text;
        if (typeof translated === "string") {
          totalCharacters += entry.sourceText.length;
          updates.push({ id: entry.id, translatedText: translated });
        }
      });
    }
  } catch (error) {
    if (error instanceof DeepLError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Batch DeepL translation error", error);
    return NextResponse.json(
      { error: "Không thể kết nối tới DeepL. Vui lòng thử lại sau." },
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
        limit: DEEPL_FREE_CHARACTER_LIMIT,
        message: "Không có bản dịch nào được cập nhật",
      },
    });
  }

  await prisma.$transaction(
    updates.map((item) =>
      prisma.translationEntry.update({
        where: {
          id: item.id,
          tableId: id,
        },
        data: {
          translatedText: item.translatedText,
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
      limit: DEEPL_FREE_CHARACTER_LIMIT,
    },
  });
}

