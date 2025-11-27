"use client";

import { useState, useEffect } from "react";
import { Plus, Download, Loader2, Search, X } from "lucide-react";
import { Role } from "@prisma/client";
import { UploadPoForm } from "@/components/po/upload-po-form";

type PoFile = {
  id: string;
  filename: string;
  language: string | null;
  uploadedAt: string;
  _count: {
    entries: number;
  };
};

type Props = {
  projectId: string;
  userRole: Role | null;
};

export function PoFilesTab({ projectId, userRole }: Props) {
  const [files, setFiles] = useState<PoFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  const canEdit = userRole === Role.EDITOR || userRole === Role.REVIEWER || userRole === Role.ADMIN;

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadFiles = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/po-files?projectId=${projectId}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || "Không thể tải danh sách files");
        return;
      }

      setFiles(result.data || []);
    } catch (err) {
      console.error("Load files error", err);
      setError("Có lỗi xảy ra khi tải danh sách files");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    loadFiles();
    // Refresh parent page to update counts
    window.location.reload();
  };

  const filteredFiles = files.filter((file) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      file.filename.toLowerCase().includes(query) ||
      file.language?.toLowerCase().includes(query)
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
        <h2 className="text-xl font-semibold text-white">PO Files</h2>
        {canEdit && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <Plus className="size-4" />
            Upload file mới
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
          placeholder="Tìm kiếm theo tên file hoặc ngôn ngữ..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-10 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
        />
      </div>

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-12 text-center">
          <p className="text-slate-400">
            {searchQuery
              ? "Không tìm thấy file nào phù hợp"
              : "Chưa có file nào. Hãy upload file đầu tiên."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="group relative rounded-2xl border border-white/10 bg-slate-950/40 p-6 transition hover:border-white/20 hover:bg-slate-950/60"
            >
              <a
                href={`/files/${file.id}`}
                className="block"
              >
                <div className="mb-2">
                  <h3 className="text-xl font-semibold text-white group-hover:text-sky-300">
                    {file.filename}
                  </h3>
                </div>
                <p className="mb-4 text-sm text-slate-400">
                  Ngôn ngữ: {file.language || "Không xác định"} · {file._count.entries} bản dịch
                </p>
              </a>

              {/* Quick Actions */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a
                  href={`/api/po-files/${file.id}/export`}
                  download={file.filename}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
                >
                  <Download className="size-3" />
                  .po
                </a>
                <a
                  href={`/api/po-files/${file.id}/export/csv`}
                  download={`${file.filename.replace(/\.po$/, "")}.csv`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
                >
                  <Download className="size-3" />
                  CSV
                </a>
                <a
                  href={`/api/po-files/${file.id}/export/excel`}
                  download={`${file.filename.replace(/\.po$/, "")}.xlsx`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
                >
                  <Download className="size-3" />
                  Excel
                </a>
                <a
                  href={`/api/po-files/${file.id}/export/json`}
                  download={`${file.filename.replace(/\.po$/, "")}.json`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
                >
                  <Download className="size-3" />
                  JSON
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Upload tệp .po mới</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            <UploadPoForm
              projectId={projectId}
              onSuccess={handleUploadSuccess}
              onCancel={() => setShowUploadModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

