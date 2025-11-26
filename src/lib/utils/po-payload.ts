import { normalizeJSONText } from "./json";

export type MetadataPayload = {
  key: string;
  value: string;
};

export type EntryPayload = {
  msgid: string;
  msgstr: string;
  description?: string | null;
  references?: string | null;
};

export function parseMetadataPayload(input: unknown): MetadataPayload[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter(
      (item): item is MetadataPayload =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).key === "string" &&
        typeof (item as Record<string, unknown>).value === "string",
    )
    .map((item) => ({
      key: (item as MetadataPayload).key,
      value: normalizeJSONText((item as MetadataPayload).value),
    }));
}

export function parseEntryPayload(input: unknown): EntryPayload[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter(
      (item): item is EntryPayload =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).msgid === "string" &&
        typeof (item as Record<string, unknown>).msgstr === "string",
    )
    .map((item) => ({
      msgid: normalizeJSONText((item as EntryPayload).msgid),
      msgstr: normalizeJSONText((item as EntryPayload).msgstr),
      description: (item as EntryPayload).description ?? null,
      references: (item as EntryPayload).references ?? null,
    }));
}

