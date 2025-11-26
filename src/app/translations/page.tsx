import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import { TranslationTablesList } from "@/components/translations/translation-tables-list";
import { SearchForm } from "@/components/search-form";

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
  const resolvedSearchParams = await searchParams;
  const query =
    typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q.trim() : "";

  const tables = await prisma.translationTable.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query } },
            { language: { contains: query } },
            { description: { contains: query } },
          ],
        }
      : undefined,
    include: {
      _count: {
        select: { entries: true },
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

      <TranslationTablesList tables={tables} />
    </div>
  );
}

