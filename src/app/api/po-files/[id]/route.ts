import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMetadataPayload } from "@/lib/utils/po-payload";

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
      metadata: true,
      entries: true,
    },
  });

  if (!file) {
    return NextResponse.json({ error: "Không tìm thấy tệp" }, { status: 404 });
  }

  return NextResponse.json({ data: file });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (typeof body?.filename === "string") {
    data.filename = body.filename;
  }
  if (typeof body?.language === "string" || body?.language === null) {
    data.language = body.language;
  }

  if (!Object.keys(data).length) {
    return NextResponse.json(
      { error: "Không có dữ liệu để cập nhật" },
      { status: 400 },
    );
  }

  const updated = await prisma.poFile.update({
    where: { id },
    data,
    include: {
      metadata: true,
      entries: { take: 5 },
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const { id } = await params;
  await prisma.poEntry.deleteMany({ where: { fileId: id } });
  await prisma.poFile.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();
  const metadata = parseMetadataPayload(body?.metadata);

  if (!metadata.length) {
    return NextResponse.json(
      { error: "Cần cung cấp metadata dạng [{ key, value }, ...]" },
      { status: 400 },
    );
  }

  await prisma.poFileMetadata.deleteMany({ where: { fileId: id } });
  await prisma.poFileMetadata.createMany({
    data: metadata.map((item) => ({
      fileId: id,
      key: item.key,
      value: item.value,
    })),
  });

  return NextResponse.json({ success: true });
}

