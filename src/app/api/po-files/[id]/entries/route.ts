import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEntryPayload } from "@/lib/utils/po-payload";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 25);
  const skip = Math.max(0, (page - 1) * pageSize);

  const [entries, total] = await prisma.$transaction([
    prisma.poEntry.findMany({
      where: {
        fileId: id,
        ...(query
          ? {
              OR: [
                { msgid: { contains: query } },
                { msgstr: { contains: query } },
                { description: { contains: query } },
                { references: { contains: query } },
              ],
            }
          : {}),
      },
      orderBy: { id: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.poEntry.count({
      where: {
        fileId: id,
        ...(query
          ? {
              OR: [
                { msgid: { contains: query } },
                { msgstr: { contains: query } },
                { description: { contains: query } },
                { references: { contains: query } },
              ],
            }
          : {}),
      },
    }),
  ]);

  return NextResponse.json({
    data: entries,
    pagination: {
      page,
      pageSize,
      total,
    },
  });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();
  const [entry] = parseEntryPayload([body]);

  if (!entry) {
    return NextResponse.json(
      { error: "msgid và msgstr là bắt buộc" },
      { status: 400 },
    );
  }

  const created = await prisma.poEntry.create({
    data: {
      fileId: id,
      ...entry,
    },
  });

  return NextResponse.json({ data: created }, { status: 201 });
}

