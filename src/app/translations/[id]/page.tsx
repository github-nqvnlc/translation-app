import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TranslationEntriesPanel } from "@/components/translations/translation-entries-panel";
import { DeleteTableButton } from "@/components/translations/delete-table-button";
import { ExportMenu } from "@/components/translations/export-menu";
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
    <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6">
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
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

      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-2xl font-semibold text-white sm:text-3xl">
            {table.name}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {table.language} · {table.entries.length} bản dịch
            {query ? ` (đã lọc)` : ""}
          </p>
          {table.description && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-300">
              {table.description}
            </p>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <ExportMenu tableId={id} tableName={table.name} />
          <DeleteTableButton tableId={id} tableName={table.name} />
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchForm
          placeholder="Tìm kiếm source text, translated text, mô tả..."
          basePath={`/translations/${id}`}
        />
      </div>

      {/* Entries Panel */}
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

