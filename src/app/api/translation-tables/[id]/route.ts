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
      _count: {
        select: { entries: true },
      },
    },
  });

  if (!table) {
    return NextResponse.json({ error: "Bảng dịch không tồn tại" }, { status: 404 });
  }

  return NextResponse.json({ data: table });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, language, description } = body ?? {};

    const data: Record<string, unknown> = {};

    if (typeof name === "string" && name.trim() !== "") {
      data.name = name.trim();
    }

    if (typeof language === "string" && language.trim() !== "") {
      data.language = language.trim();
    }

    if (typeof description === "string" || description === null) {
      data.description = description === null ? null : description.trim();
    }

    const updated = await prisma.translationTable.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể cập nhật bảng dịch", details: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const { id } = await params;

  try {
    await prisma.translationTable.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể xóa bảng dịch", details: String(error) },
      { status: 500 },
    );
  }
}

