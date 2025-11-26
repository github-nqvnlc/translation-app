import { NextResponse } from "next/server";
import { DeepLError, normalizeDeepLLanguageCode, translateTextsWithDeepL } from "@/lib/deepl";

type TranslateRequestBody = {
  text?: string;
  targetLang?: string;
  sourceLang?: string;
  formality?: "default" | "more" | "less";
};

export async function POST(request: Request) {
  let payload: TranslateRequestBody;
  try {
    payload = (await request.json()) as TranslateRequestBody;
  } catch {
    return NextResponse.json({ error: "Payload không hợp lệ" }, { status: 400 });
  }

  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  const targetLang = normalizeDeepLLanguageCode(payload.targetLang);
  const sourceLang = normalizeDeepLLanguageCode(payload.sourceLang) || undefined;
  const formality = payload.formality;

  if (!text) {
    return NextResponse.json({ error: "Thiếu text cần dịch" }, { status: 400 });
  }

  if (!targetLang) {
    return NextResponse.json({ error: "Thiếu targetLang" }, { status: 400 });
  }

  try {
    const result = await translateTextsWithDeepL([text], {
      targetLang,
      sourceLang,
      formality,
    });

    return NextResponse.json({
      data: {
        text: result[0]?.text,
        detectedSourceLanguage: result[0]?.detected_source_language ?? null,
      },
    });
  } catch (error) {
    if (error instanceof DeepLError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("DeepL translation error", error);
    return NextResponse.json(
      { error: "Không thể kết nối tới DeepL. Vui lòng thử lại sau." },
      { status: 502 },
    );
  }
}
