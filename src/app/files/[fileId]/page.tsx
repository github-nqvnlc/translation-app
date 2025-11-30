import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PoEntriesPanel } from "@/components/po/po-entries-panel";
import { SearchForm } from "@/components/search-form";
import { ExportMenu } from "@/components/po/export-menu";
import { requireAuth } from "@/lib/middleware/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

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
  // Authentication check
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    redirect("/login");
  }

  const user = authResult.user;
  const { fileId } = await params;
  const resolvedSearchParams = await searchParams;
  const query = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q.trim() : "";

  const file = await prisma.poFile.findUnique({
    where: { id: fileId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          isPublic: true,
        },
      },
    },
  });

  if (!file) {
    notFound();
  }

  // Check access permission
  if (!user) {
    redirect("/login");
  }

  const isAdmin = user.systemRole === Role.ADMIN;
  const isPublicProject = file.project?.isPublic || false;
  const userProjectIds = user.projectRoles.map((pr) => pr.projectId);
  const hasProjectAccess = file.projectId
    ? userProjectIds.includes(file.projectId)
    : false;

  if (!isAdmin && !isPublicProject && !hasProjectAccess) {
    redirect("/projects?error=access_denied");
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
    <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6">
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
        <Link href="/projects" className="transition hover:text-white">
          Projects
        </Link>
        {file.projectId && file.project ? (
          <>
            <span>/</span>
            <Link
              href={`/projects/${file.projectId}`}
              className="transition hover:text-white"
            >
              {file.project.name}
            </Link>
            <span>/</span>
            <span className="text-slate-300">PO File</span>
          </>
        ) : (
          <>
            <span>/</span>
            <span className="text-slate-300">PO File</span>
          </>
        )}
      </div>

      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-2xl font-semibold text-white sm:text-3xl">
            {file.filename}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {file.language ?? "Không xác định"} · {entries.length} bản dịch
          </p>
        </div>
        <div className="flex-shrink-0">
          <ExportMenu fileId={fileId} filename={file.filename} />
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchForm
          placeholder="Tìm kiếm msgid, msgstr, ngữ cảnh..."
          basePath={`/files/${fileId}`}
        />
      </div>

      {/* Entries Panel */}
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
        language={file.language}
      />

      {/* Metadata */}
      {metadata.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-lg font-semibold text-white">Metadata</h3>
          <dl className="grid gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-200 sm:grid-cols-2">
            {metadata.map((item) => (
              <div key={item.id} className="flex flex-col">
                <dt className="text-xs text-slate-500">{item.key}</dt>
                <dd className="truncate font-medium">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
