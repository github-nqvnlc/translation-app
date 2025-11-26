export const DEFAULT_DEEPL_API_URL = "https://api-free.deepl.com";
export const DEEPL_FREE_CHARACTER_LIMIT = 500_000;
export const DEEPL_MAX_TEXTS_PER_REQUEST = 50;

export const GEMINI_CHARACTER_LIMIT = 1_000_000;
export const GEMINI_MAX_TEXTS_PER_REQUEST = 20;
export const GEMINI_DEFAULT_MODEL =
  process.env.GEMINI_TRANSLATION_MODEL || "gemini-1.5-flash-latest";

export const TRANSLATION_PROVIDERS = [
  { id: "deepl", label: "DeepL" },
  { id: "gemini", label: "Gemini" },
] as const;

export type TranslationProvider = (typeof TRANSLATION_PROVIDERS)[number]["id"];
export const DEFAULT_TRANSLATION_PROVIDER: TranslationProvider = "deepl";

