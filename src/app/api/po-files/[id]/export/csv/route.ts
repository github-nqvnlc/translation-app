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

  const file = await prisma.poFile.findUnique({
    where: { id },
    include: {
      entries: {
        orderBy: { id: "asc" },
      },
    },
  });

  if (!file) {
    return NextResponse.json({ error: "File không tồn tại" }, { status: 404 });
  }

  const csvLines: string[] = [];
  csvLines.push('"ID","Ngôn ngữ","Source Text","Translated Text"');

  for (const entry of file.entries) {
    const id = escapeCsvField(entry.id.toString());
    const language = escapeCsvField(file.language ?? "vi");
    const sourceText = escapeCsvField(entry.msgid);
    const translatedText = escapeCsvField(entry.msgstr);

    csvLines.push(`${id},${language},${sourceText},${translatedText}`);
  }

  const csvContent = csvLines.join("\n");

  const headers = new Headers();
  headers.set("Content-Type", "text/csv; charset=utf-8");
  const filename = file.filename.replace(/\.po$/, "") + ".csv";
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);

  return new NextResponse(csvContent, { headers });
}

