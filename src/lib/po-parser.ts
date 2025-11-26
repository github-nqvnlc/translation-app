const QUOTED_TEXT_PATTERN = /"(.*)"/;

export type PoEntryRecord = {
  msgid: string;
  msgstr: string;
  description?: string;
  references?: string;
};

export type ParsedPoFile = {
  metadata: Record<string, string>;
  language?: string;
  entries: PoEntryRecord[];
};

export function parsePo(content: string): ParsedPoFile {
  const metadata: Record<string, string> = {};
  const entries: PoEntryRecord[] = [];

  if (!content) {
    return { metadata, entries };
  }

  const blocks = content.split(/\n\s*\n/g);

  for (const rawBlock of blocks) {
    const trimmedBlock = rawBlock.trim();
    if (!trimmedBlock) {
      continue;
    }

    const lines = trimmedBlock.split(/\r?\n/);
    const descriptionLines: string[] = [];
    const referenceLines: string[] = [];
    const msgidParts: string[] = [];
    const msgstrParts: string[] = [];
    let captureTarget: "msgid" | "msgstr" | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        captureTarget = null;
        continue;
      }

      if (line.startsWith("#.")) {
        descriptionLines.push(line.substring(2).trim());
        captureTarget = null;
        continue;
      }

      if (line.startsWith("#:")) {
        referenceLines.push(line.substring(2).trim());
        captureTarget = null;
        continue;
      }

      if (line.startsWith("msgid")) {
        captureTarget = "msgid";
        msgidParts.push(extractQuotedText(line));
        continue;
      }

      if (line.startsWith("msgstr")) {
        captureTarget = "msgstr";
        msgstrParts.push(extractQuotedText(line));
        continue;
      }

      if (line.startsWith('"') && captureTarget) {
        const segment = extractQuotedText(line);
        if (captureTarget === "msgid") {
          msgidParts.push(segment);
        } else {
          msgstrParts.push(segment);
        }
        continue;
      }

      captureTarget = null;
    }

    if (msgidParts.length === 0 && msgstrParts.length === 0) {
      continue;
    }

    const msgid = msgidParts.join("");
    const msgstr = msgstrParts.join("");

    if (msgid === "") {
      const headers = parseHeaderKeyValues(msgstrParts);
      Object.assign(metadata, headers);
      continue;
    }

    entries.push({
      msgid,
      msgstr,
      description: descriptionLines.length
        ? descriptionLines.join(" ").trim()
        : undefined,
      references: referenceLines.length ? referenceLines.join("\n").trim() : undefined,
    });
  }

  const language = metadata["Language"] || metadata["Language-Team"];

  return {
    metadata,
    language,
    entries,
  };
}

function extractQuotedText(line: string): string {
  const match = line.match(QUOTED_TEXT_PATTERN);
  if (!match) {
    return "";
  }

  return match[1]?.replace(/\\n$/, "") ?? "";
}

function parseHeaderKeyValues(msgstrParts: string[]): Record<string, string> {
  const headers: Record<string, string> = {};
  const flattened = msgstrParts.join("\n").split("\n");

  for (const rawLine of flattened) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const [key, ...rest] = line.split(":");
    if (!key || rest.length === 0) {
      continue;
    }

    headers[key.trim()] = rest.join(":").trim();
  }

  return headers;
}

