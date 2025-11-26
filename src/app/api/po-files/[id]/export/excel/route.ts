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

  const data = file.entries.map((entry) => ({
    ID: entry.id.toString(),
    "Ngôn ngữ": file.language ?? "vi",
    "Source Text": entry.msgid,
    "Translated Text": entry.msgstr,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Translations");

  const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const headers = new Headers();
  headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  const filename = file.filename.replace(/\.po$/, "") + ".xlsx";
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);

  return new NextResponse(excelBuffer, { headers });
}

