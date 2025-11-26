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

  const file = await prisma.poFile.findUnique({
    where: { id },
    include: {
      metadata: {
        orderBy: { key: "asc" },
      },
      entries: {
        orderBy: { id: "asc" },
      },
    },
  });

  if (!file) {
    return NextResponse.json({ error: "File không tồn tại" }, { status: 404 });
  }

  const metadata: Record<string, string> = {};
  for (const meta of file.metadata) {
    metadata[meta.key] = meta.value;
  }

  const entries = file.entries.map((entry) => ({
    msgid: entry.msgid,
    msgstr: entry.msgstr,
    description: entry.description ?? undefined,
    references: entry.references ?? undefined,
  }));

  const poContent = serializePo(metadata, entries);

  const headers = new Headers();
  headers.set("Content-Type", "text/plain; charset=utf-8");
  headers.set("Content-Disposition", `attachment; filename="${file.filename}"`);

  return new NextResponse(poContent, { headers });
}

