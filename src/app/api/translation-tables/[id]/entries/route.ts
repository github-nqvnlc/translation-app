import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  const { id } = await params;

  const entries = await prisma.translationEntry.findMany({
    where: { tableId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: entries });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { sourceText, translatedText, description, references } = body ?? {};

    if (!sourceText || typeof sourceText !== "string" || sourceText.trim() === "") {
      return NextResponse.json({ error: "Source Text là bắt buộc" }, { status: 400 });
    }

    if (!translatedText || typeof translatedText !== "string") {
      return NextResponse.json({ error: "Translated Text là bắt buộc" }, { status: 400 });
    }

    const created = await prisma.translationEntry.create({
      data: {
        sourceText: sourceText.trim(),
        translatedText: translatedText.trim(),
        description: typeof description === "string" && description.trim() !== "" ? description.trim() : null,
        references: typeof references === "string" && references.trim() !== "" ? references.trim() : null,
        tableId: id,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể tạo entry", details: String(error) },
      { status: 500 },
    );
  }
}

