import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  try {
    const body = await request.json();
    const { sourceText, translatedText, description, references } = body ?? {};

    const data: Record<string, unknown> = {};

    if (typeof sourceText === "string" && sourceText.trim() !== "") {
      data.sourceText = sourceText.trim();
    }

    if (typeof translatedText === "string") {
      data.translatedText = translatedText.trim();
    }

    if (typeof description === "string" || description === null) {
      data.description = description === null ? null : description.trim();
    }

    if (typeof references === "string" || references === null) {
      data.references = references === null ? null : references.trim();
    }

    const updated = await prisma.translationEntry.update({
      where: {
        id: entryId,
        tableId: id,
      },
      data,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể cập nhật entry", details: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const { id, entryId: entryIdParam } = await params;
  const entryId = Number(entryIdParam);

  if (Number.isNaN(entryId)) {
    return NextResponse.json({ error: "entryId không hợp lệ" }, { status: 400 });
  }

  try {
    await prisma.translationEntry.delete({
      where: {
        id: entryId,
        tableId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể xóa entry", details: String(error) },
      { status: 500 },
    );
  }
}

