import { DEFAULT_DEEPL_API_URL } from "./constants";

type DeepLFormality = "default" | "more" | "less";

export const normalizeDeepLLanguageCode = (code?: string | null) => {
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

export type DeepLTranslateOptions = {
  targetLang: string;
  sourceLang?: string;
  formality?: DeepLFormality;
};

export type DeepLTranslation = {
  text: string;
  detected_source_language?: string;
};

export class DeepLError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const getDeepLConfig = () => {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    throw new DeepLError("DEEPL_API_KEY chưa được cấu hình trên server", 500);
  }

  const apiBase = process.env.DEEPL_API_URL ?? DEFAULT_DEEPL_API_URL;
  const endpoint = `${apiBase.replace(/\/$/, "")}/v2/translate`;

  return { apiKey, endpoint };
};

export async function translateTextsWithDeepL(
  texts: string[],
  options: DeepLTranslateOptions,
): Promise<DeepLTranslation[]> {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new DeepLError("Danh sách văn bản cần dịch rỗng", 400);
  }

  const targetLang = normalizeDeepLLanguageCode(options.targetLang);
  if (!targetLang) {
    throw new DeepLError("Thiếu targetLang", 400);
  }

  const sourceLang = normalizeDeepLLanguageCode(options.sourceLang);
  const formality = options.formality;

  const { apiKey, endpoint } = getDeepLConfig();

  const bodyParams = new URLSearchParams();
  texts.forEach((text) => {
    bodyParams.append("text", text);
  });
  bodyParams.set("target_lang", targetLang);

  if (sourceLang) {
    bodyParams.set("source_lang", sourceLang);
  }
  if (formality) {
    bodyParams.set("formality", formality);
  }

  let json: unknown;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: bodyParams.toString(),
  });

  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const message =
      (json as { message?: string; error?: string } | null)?.message ??
      (json as { message?: string; error?: string } | null)?.error ??
      "DeepL trả về lỗi không xác định";
    throw new DeepLError(message, response.status);
  }

  const translations = (json as { translations?: DeepLTranslation[] })?.translations;
  if (!translations || translations.length === 0) {
    throw new DeepLError("DeepL không trả về nội dung bản dịch", 502);
  }

  return translations;
}

