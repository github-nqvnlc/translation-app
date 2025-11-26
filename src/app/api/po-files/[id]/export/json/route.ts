import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  const jsonData = file.entries.map((entry) => ({
    ID: entry.id.toString(),
    "Ngôn ngữ": file.language ?? "vi",
    "Source Text": entry.msgid,
    "Translated Text": entry.msgstr,
  }));

  const jsonContent = JSON.stringify(jsonData, null, 2);

  const headers = new Headers();
  headers.set("Content-Type", "application/json; charset=utf-8");
  const filename = file.filename.replace(/\.po$/, "") + ".json";
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);

  return new NextResponse(jsonContent, { headers });
}

