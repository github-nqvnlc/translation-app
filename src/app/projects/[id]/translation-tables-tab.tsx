"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Download, Loader2, Search, X } from "lucide-react";
import { Role } from "@prisma/client";
import { CreateTranslationForm } from "@/components/translations/create-translation-form";

type TranslationTable = {
  id: string;
  name: string;
  language: string;
  description: string | null;
  updatedAt: string;
  _count: {
    entries: number;
  };
};

type Props = {
  projectId: string;
  userRole: Role | null;
};

export function TranslationTablesTab({ projectId, userRole }: Props) {
  const router = useRouter();
  const [tables, setTables] = useState<TranslationTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const canEdit = userRole === Role.EDITOR || userRole === Role.REVIEWER || userRole === Role.ADMIN;

  useEffect(() => {
    loadTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadTables = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/translation-tables?projectId=${projectId}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || "Không thể tải danh sách bảng dịch");
        return;
      }

      setTables(result.data || []);
    } catch (err) {
      console.error("Load tables error", err);
      setError("Có lỗi xảy ra khi tải danh sách bảng dịch");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    loadTables();
    router.refresh();
  };

  const filteredTables = tables.filter((table) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      table.name.toLowerCase().includes(query) ||
      table.language?.toLowerCase().includes(query) ||
      table.description?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-sky-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Translation Tables</h2>
        {canEdit && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <Plus className="size-4" />
            Tạo bảng dịch mới
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm theo tên, ngôn ngữ hoặc mô tả..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-10 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
        />
      </div>

      {/* Tables Grid */}
      {filteredTables.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-12 text-center">
          <p className="text-slate-400">
            {searchQuery
              ? "Không tìm thấy bảng dịch nào phù hợp"
              : "Chưa có bảng dịch nào. Hãy tạo bảng dịch đầu tiên."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              className="group relative rounded-2xl border border-white/10 bg-slate-950/40 p-6 transition hover:border-white/20 hover:bg-slate-950/60"
            >
              <Link
                href={`/translations/${table.id}`}
                className="block"
              >
                <div className="mb-2">
                  <h3 className="text-xl font-semibold text-white group-hover:text-sky-300">
                    {table.name}
                  </h3>
                </div>
                <p className="mb-4 text-sm text-slate-400">
                  Ngôn ngữ: {table.language} · {table._count.entries} bản dịch
                </p>
                {table.description && (
                  <p className="line-clamp-2 text-sm text-slate-300">{table.description}</p>
                )}
              </Link>

              {/* Quick Actions */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a
                  href={`/api/translation-tables/${table.id}/export/csv`}
                  download={`${table.name}.csv`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
                >
                  <Download className="size-3" />
                  CSV
                </a>
                <a
                  href={`/api/translation-tables/${table.id}/export/excel`}
                  download={`${table.name}.xlsx`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
                >
                  <Download className="size-3" />
                  Excel
                </a>
                <a
                  href={`/api/translation-tables/${table.id}/export/json`}
                  download={`${table.name}.json`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
                >
                  <Download className="size-3" />
                  JSON
                </a>
                <a
                  href={`/api/translation-tables/${table.id}/export/po`}
                  download={`${table.name}.po`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
                >
                  <Download className="size-3" />
                  PO
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Tạo bảng dịch mới</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            <CreateTranslationForm
              projectId={projectId}
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

