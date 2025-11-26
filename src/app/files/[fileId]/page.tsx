import { notFound } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PoEntriesPanel } from "@/components/po/po-entries-panel";
import { SearchForm } from "@/components/search-form";

type FileDetailPageProps = {
  params: Promise<{
    fileId: string;
  }>;
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

export default async function FileDetailPage({ params, searchParams }: FileDetailPageProps) {
  const { fileId } = await params;
  const resolvedSearchParams = await searchParams;
  const query = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q.trim() : "";

  const file = await prisma.poFile.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    notFound();
  }

  const metadata = await prisma.poFileMetadata.findMany({
    where: { fileId },
    orderBy: { key: "asc" },
  });

  const entries = await prisma.poEntry.findMany({
    where: {
      fileId,
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
  });

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-6 md:px-8">
      <div className="flex flex-col gap-2">
        <Link href="/files" className="text-xs font-semibold text-slate-400">
          ← Danh sách tệp
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-white">{file.filename}</h1>
            <p className="text-sm text-slate-400">
              Ngôn ngữ: {file.language ?? "Không xác định"} · {entries.length} bản dịch
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/po-files/${fileId}/export`}
              download={file.filename}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              <Download className="size-4" />
              Xuất .po
            </a>
            <a
              href={`/api/po-files/${fileId}/export/csv`}
              download={`${file.filename.replace(/\.po$/, "")}.csv`}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-transparent px-6 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
            >
              <Download className="size-4" />
              Xuất CSV
            </a>
            <a
              href={`/api/po-files/${fileId}/export/excel`}
              download={`${file.filename.replace(/\.po$/, "")}.xlsx`}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-transparent px-6 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
            >
              <Download className="size-4" />
              Xuất Excel
            </a>
            <a
              href={`/api/po-files/${fileId}/export/json`}
              download={`${file.filename.replace(/\.po$/, "")}.json`}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-transparent px-6 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
            >
              <Download className="size-4" />
              Xuất JSON
            </a>
          </div>
        </div>
      </div>

      <SearchForm
        placeholder="Nhập msgid, msgstr, ngữ cảnh hoặc vị trí áp dụng"
        basePath={`/files/${fileId}`}
      />

      <PoEntriesPanel
        entries={entries.map((entry) => ({
          id: entry.id,
          msgid: entry.msgid,
          msgstr: entry.msgstr,
          description: entry.description,
          references: entry.references,
        }))}
        filename={file.filename}
        fileId={fileId}
      />

      <div className="flex flex-col gap-4">
      <h3 className="text-3xl font-semibold text-white">Metadata</h3>
        {metadata.length ? (
          <dl className="mt-4 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-200 md:grid-cols-2">
            {metadata.map((item) => (
              <div key={item.id} className="flex flex-col">
                <dt className="text-xs text-slate-500">{item.key}</dt>
                <dd className="truncate font-semibold">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </div>
  );
}
