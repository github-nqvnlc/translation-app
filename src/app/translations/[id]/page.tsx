import { notFound } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TranslationEntriesPanel } from "@/components/translations/translation-entries-panel";
import { DeleteTableButton } from "@/components/translations/delete-table-button";
import { SearchForm } from "@/components/search-form";
import { requireAuth } from "@/lib/middleware/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

type TranslationDetailPageProps = {
  params: Promise<{
    id: string;
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

export default async function TranslationDetailPage({
  params,
  searchParams,
}: TranslationDetailPageProps) {
  // Authentication check
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    redirect("/login");
  }

  const user = authResult.user;
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const query =
    typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q.trim() : "";

  const table = await prisma.translationTable.findUnique({
    where: { id },
    include: {
      entries: {
        where: query
          ? {
              OR: [
                { sourceText: { contains: query } },
                { translatedText: { contains: query } },
                { description: { contains: query } },
                { references: { contains: query } },
              ],
            }
          : undefined,
        orderBy: { createdAt: "asc" },
      },
      project: {
        select: {
          id: true,
          name: true,
          isPublic: true,
        },
      },
    },
  });

  if (!table) {
    notFound();
  }

  // Check access permission
  if (!user) {
    redirect("/login");
  }

  const isAdmin = user.systemRole === Role.ADMIN;
  const isPublicProject = table.project?.isPublic || false;
  const userProjectIds = user.projectRoles.map((pr) => pr.projectId);
  const hasProjectAccess = table.projectId
    ? userProjectIds.includes(table.projectId)
    : false;

  if (!isAdmin && !isPublicProject && !hasProjectAccess) {
    redirect("/projects?error=access_denied");
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-6 md:px-8">
      <div className="flex flex-col gap-2">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link href="/projects" className="transition hover:text-white">
            Projects
          </Link>
          {table.projectId && table.project ? (
            <>
              <span>/</span>
              <Link
                href={`/projects/${table.projectId}`}
                className="transition hover:text-white"
              >
                {table.project.name}
              </Link>
              <span>/</span>
              <span className="text-slate-300">Translation Table</span>
            </>
          ) : (
            <>
              <span>/</span>
              <span className="text-slate-300">Translation Table</span>
            </>
          )}
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-white">{table.name}</h1>
            <p className="text-sm text-slate-400">
              Ngôn ngữ: {table.language} · {table.entries.length} bản dịch
              {query ? ` (đã lọc)` : ""}
            </p>
            {table.description ? (
              <p className="mt-2 text-sm text-slate-300">{table.description}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/translation-tables/${id}/export/csv`}
              download={`${table.name}.csv`}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-transparent px-6 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
            >
              <Download className="size-4" />
              CSV
            </a>
            <a
              href={`/api/translation-tables/${id}/export/excel`}
              download={`${table.name}.xlsx`}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-transparent px-6 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
            >
              <Download className="size-4" />
              Excel
            </a>
            <a
              href={`/api/translation-tables/${id}/export/json`}
              download={`${table.name}.json`}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-transparent px-6 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
            >
              <Download className="size-4" />
              JSON
            </a>
            <a
              href={`/api/translation-tables/${id}/export/po`}
              download={`${table.name}.po`}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-transparent px-6 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
            >
              <Download className="size-4" />
              PO
            </a>
            <DeleteTableButton tableId={id} tableName={table.name} />
          </div>
        </div>
      </div>

      <SearchForm
        placeholder="Nhập source text, translated text, mô tả hoặc vị trí áp dụng"
        basePath={`/translations/${id}`}
      />

      <TranslationEntriesPanel
        entries={table.entries.map((entry) => ({
          id: entry.id,
          sourceText: entry.sourceText,
          translatedText: entry.translatedText,
          description: entry.description,
          references: entry.references,
        }))}
        tableName={table.name}
        tableId={id}
        targetLanguage={table.language}
      />
    </div>
  );
}

