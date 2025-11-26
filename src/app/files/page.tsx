import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PoFilesTable } from "@/components/po/po-files-table";
import { Search } from "lucide-react";

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

      <form action="/files" className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <label htmlFor="search" className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Search className="size-4" />
          Tìm kiếm
        </label>
        <input
          id="search"
          name="q"
          defaultValue={query}
          placeholder="Nhập tên tệp, ngôn ngữ hoặc metadata"
          className="w-full flex-1 rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/40 focus:outline-none md:w-auto"
        />
        <button
          type="submit"
          className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Search
        </button>
        {query ? (
          <Link
            href="/files"
            className="text-sm font-semibold text-slate-300 underline-offset-4 hover:underline"
          >
            Xoá bộ lọc
          </Link>
        ) : null}
      </form>

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

