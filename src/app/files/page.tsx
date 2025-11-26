import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PoFilesTable } from "@/components/po/po-files-table";
import { SearchForm } from "@/components/search-form";

type FilesPageProps = {
  searchParams?:
    | {
        q?: string;
      }
    | Promise<{
        q?: string;
      }>;
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type FileWithCount = Prisma.PoFileGetPayload<{
  include: { _count: { select: { entries: true } } };
}>;

export default async function FilesPage({ searchParams }: FilesPageProps) {
  const resolvedSearchParams = await searchParams;
  const query =
    typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q.trim() : "";

  const files = (await prisma.poFile.findMany({
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
      _count: { select: { entries: true } },
    },
  })) as FileWithCount[];

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-10 md:px-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-white">Danh sách tệp</h1>
        <p className="text-sm text-slate-300">
          Tại đây bạn có thể tìm kiếm, quản lý và xoá các file .po đã tải lên. Bấm vào tên tệp để xem chi
          tiết bảng dịch.
        </p>
      </div>

      <SearchForm placeholder="Nhập tên tệp, ngôn ngữ hoặc metadata" basePath="/files" />

      <PoFilesTable
        files={files.map((file) => ({
          id: file.id,
          filename: file.filename,
          filesize: file.filesize,
          uploadedAt: file.uploadedAt.toISOString(),
          entryCount: file._count.entries,
          language: file.language,
        }))}
        activeFileId={null}
      />
    </div>
  );
}

