import { NextResponse } from "next/server";
import { GeminiError, translateTextsWithGemini } from "@/lib/gemini";

type TranslateRequestBody = {
  text?: string;
  targetLang?: string;
  sourceLang?: string;
};

export async function POST(request: Request) {
  let payload: TranslateRequestBody;
  try {
    payload = (await request.json()) as TranslateRequestBody;
  } catch {
    return NextResponse.json({ error: "Payload không hợp lệ" }, { status: 400 });
  }

  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  const targetLang = payload.targetLang;
  const sourceLang = payload.sourceLang;

  if (!text) {
    return NextResponse.json({ error: "Thiếu text cần dịch" }, { status: 400 });
  }

  if (!targetLang) {
    return NextResponse.json({ error: "Thiếu targetLang" }, { status: 400 });
  }

  try {
    const result = await translateTextsWithGemini([text], {
      targetLang,
      sourceLang,
    });

    return NextResponse.json({
      data: {
        text: result[0]?.text,
      },
    });
  } catch (error) {
    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Gemini translation error", error);
    return NextResponse.json(
      { error: "Không thể kết nối tới Gemini. Vui lòng thử lại sau." },
      { status: 502 },
    );
  }
}

