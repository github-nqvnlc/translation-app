import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEntryPayload, parseMetadataPayload } from "@/lib/utils/po-payload";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  const files = await prisma.poFile.findMany({
    where: query
      ? {
          OR: [
            { filename: { contains: query } },
            { language: { contains: query } },
            {
              metadata: {
                some: {
                  OR: [
                    { key: { contains: query } },
                    { value: { contains: query } },
                  ],
                },
              },
            },
          ],
        }
      : undefined,
    orderBy: { uploadedAt: "desc" },
    include: {
      metadata: true,
      _count: { select: { entries: true } },
    },
  });

  return NextResponse.json({ data: files });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filename, language, entries, metadata, filesize = 0 } = body ?? {};

    if (!filename || typeof filename !== "string") {
      return NextResponse.json(
        { error: "Thiếu tên tệp (filename)" },
        { status: 400 },
      );
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "Cần ít nhất một entry trong mảng entries" },
        { status: 400 },
      );
    }

    const metadataData = parseMetadataPayload(metadata);
    const entryData = parseEntryPayload(entries);

    const created = await prisma.poFile.create({
      data: {
        filename,
        filesize: Number(filesize) || 0,
        language: typeof language === "string" ? language : null,
        metadata: metadataData.length
          ? {
              createMany: {
                data: metadataData,
              },
            }
          : undefined,
        entries: {
          createMany: {
            data: entryData,
          },
        },
      },
      include: {
        metadata: true,
        _count: { select: { entries: true } },
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể tạo tệp .po mới", details: String(error) },
      { status: 500 },
    );
  }
}

