import { notFound } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PoEntriesPanel } from "@/components/po/po-entries-panel";

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
        <h1 className="text-3xl font-semibold text-white">{file.filename}</h1>
        <p className="text-sm text-slate-400">
          Ngôn ngữ: {file.language ?? "Không xác định"} · {entries.length} bản dịch
        </p>
      </div>

      <form
        action={`/files/${fileId}`}
        className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4"
      >
        <label
          htmlFor="entry-search"
          className="flex items-center gap-2 text-sm font-semibold text-slate-300"
        >
          <Search className="size-4" />
          Tìm kiếm bản dịch
        </label>
        <input
          id="entry-search"
          name="q"
          defaultValue={query}
          placeholder="Nhập msgid, msgstr, ngữ cảnh hoặc vị trí áp dụng"
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
            href={`/files/${fileId}`}
            className="text-sm font-semibold text-slate-300 underline-offset-4 hover:underline"
          >
            Xoá bộ lọc
          </Link>
        ) : null}
      </form>

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
