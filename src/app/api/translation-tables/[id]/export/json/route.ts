import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  const jsonData = table.entries.map((entry) => ({
    ID: entry.id.toString(),
    "Ngôn ngữ": table.language,
    "Source Text": entry.sourceText,
    "Translated Text": entry.translatedText,
  }));

  const jsonContent = JSON.stringify(jsonData, null, 2);

  const headers = new Headers();
  headers.set("Content-Type", "application/json; charset=utf-8");
  const filename = `${table.name}.json`;
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);

  return new NextResponse(jsonContent, { headers });
}

