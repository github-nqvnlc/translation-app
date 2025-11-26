import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializePo } from "@/lib/po-parser";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  const { id } = await params;

  const table = await prisma.translationTable.findUnique({
    where: { id },
    include: {
      entries: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!table) {
    return NextResponse.json({ error: "Bảng dịch không tồn tại" }, { status: 404 });
  }

  const metadata: Record<string, string> = {
    "Project-Id-Version": table.name,
    "Language": table.language,
    "Content-Type": "text/plain; charset=UTF-8",
    "Content-Transfer-Encoding": "8bit",
  };

  if (table.description) {
    metadata["X-Description"] = table.description;
  }

  const entries = table.entries.map((entry) => ({
    msgid: entry.sourceText,
    msgstr: entry.translatedText,
    description: entry.description ?? undefined,
    references: entry.references ?? undefined,
  }));

  const poContent = serializePo(metadata, entries);

  const headers = new Headers();
  headers.set("Content-Type", "text/plain; charset=utf-8");
  const filename = `${table.name}.po`;
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);

  return new NextResponse(poContent, { headers });
}

