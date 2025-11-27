import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import { TranslationTablesList } from "@/components/translations/translation-tables-list";
import { SearchForm } from "@/components/search-form";
import { requireAuth } from "@/lib/middleware/auth";
import { redirect } from "next/navigation";

type TranslationsPageProps = {
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

export default async function TranslationsPage({ searchParams }: TranslationsPageProps) {
  // Authentication check
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    redirect("/login");
  }

  const user = authResult.user;
  if (!user) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const query =
    typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q.trim() : "";

  // Build where clause with project filtering
  const whereClause: {
    project?: { OR: Array<{ id?: { in: string[] }; isPublic?: boolean }> };
    OR?: Array<{
      name?: { contains: string };
      language?: { contains: string };
      description?: { contains: string };
    }>;
  } = {};

  // Filter by project membership
  if (user.systemRole !== "ADMIN") {
    // Regular users: only see tables from their projects or public projects
    const userProjectIds = user.projectRoles.map((pr) => pr.projectId);
    whereClause.project = {
      OR: [
        { id: { in: userProjectIds } },
        { isPublic: true },
      ],
    };
  }
  // Admin sees all tables

  // Add search query
  if (query) {
    whereClause.OR = [
      { name: { contains: query } },
      { language: { contains: query } },
      { description: { contains: query } },
    ];
  }

  const tables = await prisma.translationTable.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    include: {
      _count: {
        select: { entries: true },
      },
      project: {
        select: {
          id: true,
          name: true,
          isPublic: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-6 md:px-8">
      <div className="flex flex-col gap-2">
        <Link href="/" className="text-xs font-semibold text-slate-400">
          ← Trang chủ
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-white">Quản lý bảng dịch</h1>
            <p className="text-sm text-slate-400">
              Tạo và quản lý các bảng dịch riêng biệt · {tables.length} bảng dịch
            </p>
          </div>
          <Link
            href="/translations/new"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            <Plus className="size-4" />
            Tạo bảng dịch mới
          </Link>
        </div>
      </div>

      <SearchForm placeholder="Nhập tên bảng dịch, ngôn ngữ hoặc mô tả" basePath="/translations" />

      <TranslationTablesList tables={tables.map((table) => ({
        id: table.id,
        name: table.name,
        language: table.language,
        description: table.description,
        projectId: table.projectId,
        _count: table._count,
      }))} />
    </div>
  );
}

