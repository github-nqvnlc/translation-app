import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeJSONText } from "@/lib/utils/json";

type RouteContext = {
  params: Promise<{
    id: string;
    entryId: string;
  }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  const { id, entryId: entryIdParam } = await params;
  const entryId = Number(entryIdParam);
  if (Number.isNaN(entryId)) {
    return NextResponse.json({ error: "entryId không hợp lệ" }, { status: 400 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (typeof body?.msgid === "string") {
    data.msgid = normalizeJSONText(body.msgid);
  }
  if (typeof body?.msgstr === "string") {
    data.msgstr = normalizeJSONText(body.msgstr);
  }
  if (typeof body?.description === "string" || body?.description === null) {
    data.description = body.description;
  }
  if (typeof body?.references === "string" || body?.references === null) {
    data.references = body.references;
  }

  const updated = await prisma.poEntry.update({
    where: {
      id: entryId,
      fileId: id,
    },
    data,
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const { id, entryId: entryIdParam } = await params;
  const entryId = Number(entryIdParam);
  if (Number.isNaN(entryId)) {
    return NextResponse.json({ error: "entryId không hợp lệ" }, { status: 400 });
  }

  await prisma.poEntry.delete({
    where: {
      id: entryId,
      fileId: id,
    },
  });

  return NextResponse.json({ success: true });
}

