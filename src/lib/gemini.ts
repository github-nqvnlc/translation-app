import { GoogleGenAI } from "@google/genai";
import { GEMINI_DEFAULT_MODEL, GEMINI_MAX_TEXTS_PER_REQUEST } from "./constants";

export class GeminiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type GeminiTranslateOptions = {
  targetLang: string;
  sourceLang?: string;
};

export type GeminiTranslation = {
  text: string;
};

export type GeminiTranslationInput =
  | string
  | {
      text: string;
      context?: string;
    };

const normalizeLanguageCode = (code?: string | null) => {
  if (!code) {
    return "";
  }
  const trimmed = code.trim();
  if (!trimmed) {
    return "";
  }
  const [base] = trimmed.split(/[-_]/);
  return base?.toUpperCase() ?? "";
};

let cachedClient: GoogleGenAI | null = null;

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError("GEMINI_API_KEY chưa được cấu hình trên server", 500);
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey });
  }
  return cachedClient;
};

const getGeminiModelName = () => process.env.GEMINI_TRANSLATION_MODEL || GEMINI_DEFAULT_MODEL;

const GEMINI_SYSTEM_HINT =
  "Bạn là trợ lý dịch thuật chuyên nghiệp. Trả về JSON đúng schema đã cho, không thêm giải thích.";

const buildPrompt = (
  entries: { text: string; context?: string }[],
  targetLang: string,
  sourceLang?: string,
) => {
  const payload = entries.map((item, index) => ({
    index,
    text: item.text ?? "",
    context: item.context ?? "",
  }));

  return `Dịch từng mục sang ${targetLang}. ${
    sourceLang ? `Ngôn ngữ nguồn là ${sourceLang}. ` : "Tự phát hiện ngôn ngữ nguồn nếu cần. "
  }Không dịch phần context. Hoàn trả JSON thuần theo mẫu {"translations":[{"index":number,"text":string}]}.
TEXTS = ${JSON.stringify(payload)}`;
};

type GeminiJsonResponse = {
  translations?: { index: number; text: string }[];
  error?: { message?: string };
};

const stripCodeFence = (value: string) => {
  const fenceRegex = /^```(?:json)?\s*([\s\S]*?)```$/i;
  const match = fenceRegex.exec(value.trim());
  if (match?.[1]) {
    return match[1];
  }
  return value;
};

const parseGeminiResponse = (payload: string) => {
  const trimmed = payload?.trim();
  if (!trimmed) {
    throw new GeminiError("Gemini không trả về nội dung", 502);
  }

  try {
    return JSON.parse(stripCodeFence(trimmed)) as GeminiJsonResponse;
  } catch {
    throw new GeminiError(trimmed.slice(0, 500), 502);
  }
};

const chunkTexts = <T,>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const extractTextFromResponse = (payload: unknown): string => {
  if (!payload) {
    return "";
  }

  const anyPayload = payload as {
    text?: string | (() => string);
    candidates?: {
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }[];
  };

  if (typeof anyPayload.text === "function") {
    try {
      return anyPayload.text() ?? "";
    } catch {
      // ignored
    }
  }

  if (typeof anyPayload.text === "string") {
    return anyPayload.text;
  }

  if (anyPayload.candidates?.length) {
    for (const candidate of anyPayload.candidates) {
      const text = candidate.content?.parts?.find((part) => typeof part.text === "string")?.text;
      if (text) {
        return text;
      }
    }
  }

  return "";
};

export async function translateTextsWithGemini(
  inputs: GeminiTranslationInput[],
  options: GeminiTranslateOptions,
): Promise<GeminiTranslation[]> {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw new GeminiError("Danh sách văn bản cần dịch rỗng", 400);
  }

  const targetLang = normalizeLanguageCode(options.targetLang);
  if (!targetLang) {
    throw new GeminiError("Thiếu targetLang", 400);
  }

  const sourceLang = normalizeLanguageCode(options.sourceLang) || undefined;
  const client = getGeminiClient();
  const modelName = getGeminiModelName();
  const normalizedInputs = inputs.map((item) =>
    typeof item === "string"
      ? { text: item }
      : {
          text: item?.text ?? "",
          context: item?.context,
        },
  );
  const chunks = chunkTexts(normalizedInputs, GEMINI_MAX_TEXTS_PER_REQUEST);
  const translations: GeminiTranslation[] = [];

  for (const chunk of chunks) {
    try {
      const prompt = buildPrompt(chunk, targetLang, sourceLang);
      const result = await client.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: `${GEMINI_SYSTEM_HINT}\n${prompt}` }] }],
      });
      const raw = extractTextFromResponse(result);
      if (process.env.NODE_ENV !== "production") {
        console.debug("[GeminiAPI] raw response:", raw);
      }
      const parsed = parseGeminiResponse(raw);
      if (!parsed.translations?.length) {
        const fallback =
          parsed.error?.message ??
          raw.slice(0, 500) ??
          "Gemini không trả về dữ liệu bản dịch";
        throw new GeminiError(fallback, 502);
      }

      chunk.forEach((_item, index) => {
        const translated = parsed.translations?.find((item) => item.index === index)?.text ?? null;
        translations.push({ text: typeof translated === "string" ? translated : "" });
      });
    } catch (error) {
      if (error instanceof GeminiError) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : "Gemini API gặp lỗi không xác định";
      throw new GeminiError(message, 502);
    }
  }

  return translations;
}

