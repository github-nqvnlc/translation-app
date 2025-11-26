export function normalizeJSONText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s*\n\s*/g, " ").trim();
}

