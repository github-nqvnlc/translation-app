import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

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

  const data = table.entries.map((entry) => ({
    ID: entry.id.toString(),
    "Ngôn ngữ": table.language,
    "Source Text": entry.sourceText,
    "Translated Text": entry.translatedText,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Translations");

  const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const headers = new Headers();
  headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  const filename = `${table.name}.xlsx`;
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);

  return new NextResponse(excelBuffer, { headers });
}

