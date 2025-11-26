import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function escapeCsvField(field: string): string {
  if (field.includes('"') || field.includes(",") || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

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

  const csvLines: string[] = [];
  csvLines.push('"ID","Ngôn ngữ","Source Text","Translated Text"');

  for (const entry of table.entries) {
    const entryId = entry.id.toString();
    const language = escapeCsvField(table.language);
    const sourceText = escapeCsvField(entry.sourceText);
    const translatedText = escapeCsvField(entry.translatedText);

    csvLines.push(`${entryId},${language},${sourceText},${translatedText}`);
  }

  const csvContent = csvLines.join("\n");

  const headers = new Headers();
  headers.set("Content-Type", "text/csv; charset=utf-8");
  const filename = `${table.name}.csv`;
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);

  return new NextResponse(csvContent, { headers });
}

