import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tables = await prisma.translationTable.findMany({
    include: {
      _count: {
        select: { entries: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: tables });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, language, description } = body ?? {};

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Tên bảng dịch là bắt buộc" }, { status: 400 });
    }

    if (!language || typeof language !== "string" || language.trim() === "") {
      return NextResponse.json({ error: "Ngôn ngữ là bắt buộc" }, { status: 400 });
    }

    const created = await prisma.translationTable.create({
      data: {
        name: name.trim(),
        language: language.trim(),
        description: typeof description === "string" ? description.trim() : null,
      },
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể tạo bảng dịch", details: String(error) },
      { status: 500 },
    );
  }
}

