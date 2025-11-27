import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PoFilesTable } from "@/components/po/po-files-table";
import { SearchForm } from "@/components/search-form";
import { requireAuth } from "@/lib/middleware/auth";
import { redirect } from "next/navigation";

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
  // Authentication check
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    redirect("/login");
  }

  const user = authResult.user;
  const resolvedSearchParams = await searchParams;
  const query =
    typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q.trim() : "";

  // Build where clause with project filtering
  const whereClause: {
    project?: { OR: Array<{ id?: { in: string[] }; isPublic?: boolean }> };
    OR?: Array<{
      filename?: { contains: string };
      language?: { contains: string };
      metadata?: { some: { OR: Array<{ key?: { contains: string }; value?: { contains: string } }> } };
    }>;
  } = {};

  // Filter by project membership
  if (user && user.systemRole !== "ADMIN") {
    // Regular users: only see files from their projects or public projects
    const userProjectIds = user.projectRoles.map((pr) => pr.projectId);
    whereClause.project = {
      OR: [
        { id: { in: userProjectIds } },
        { isPublic: true },
      ],
    };
  }
  // Admin sees all files

  // Add search query
  if (query) {
    whereClause.OR = [
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
    ];
  }

  const files = (await prisma.poFile.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    orderBy: { uploadedAt: "desc" },
    include: {
      _count: { select: { entries: true } },
      project: {
        select: {
          id: true,
          name: true,
          isPublic: true,
        },
      },
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
          projectId: file.projectId,
        }))}
        activeFileId={null}
      />
    </div>
  );
}

