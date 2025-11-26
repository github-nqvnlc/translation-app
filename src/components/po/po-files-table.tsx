"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import Link from "next/link";

export type PoFileRecord = {
  id: string;
  filename: string;
  filesize: number;
  uploadedAt: string;
  entryCount: number;
  language?: string | null;
};

type Props = {
  files: PoFileRecord[];
  activeFileId: string | null;
};

type ToastState = {
  show: boolean;
  success: boolean;
  message: string;
};

type ConfirmDialogState = {
  show: boolean;
  type: "single" | "multiple" | "all";
  fileId?: string;
  fileName?: string;
  count?: number;
};

export function PoFilesTable({ files, activeFileId }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, success: false, message: "" });
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    show: false,
    type: "single",
  });
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const router = useRouter();

  const allSelected = useMemo(
    () => files.length > 0 && selected.size === files.length,
    [files.length, selected.size],
  );

  const toastKey = toast.show ? `${Number(toast.success)}-${toast.message}` : null;
  const showToast = toast.show && dismissedKey !== toastKey;
  const canDeleteSelected = selected.size > 0;
  const canDeleteAll = files.length > 0;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(files.map((file) => file.id)));
    }
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSingle = (file: PoFileRecord) => {
    setConfirmDialog({
      show: true,
      type: "single",
      fileId: file.id,
      fileName: file.filename,
    });
    setDeleteConfirmText("");
  };

  const handleDeleteSelected = () => {
    if (selected.size === 0) return;
    setConfirmDialog({
      show: true,
      type: "multiple",
      count: selected.size,
    });
    setDeleteConfirmText("");
  };

  const handleDeleteAll = () => {
    setConfirmDialog({
      show: true,
      type: "all",
      count: files.length,
    });
    setDeleteConfirmText("");
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ show: false, type: "single" });
    setDeleteConfirmText("");
  };

  const executeDelete = async () => {
    if (deleteConfirmText !== "DELETE") {
      return;
    }

    setPending(true);
    closeConfirmDialog();

    try {
      let deletedCount = 0;

      if (confirmDialog.type === "single" && confirmDialog.fileId) {
        const response = await fetch(`/api/po-files/${confirmDialog.fileId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Không thể xóa file");
        }

        deletedCount = 1;
      } else if (confirmDialog.type === "multiple") {
        const deletePromises = Array.from(selected).map((id) =>
          fetch(`/api/po-files/${id}`, { method: "DELETE" }),
        );

        const results = await Promise.all(deletePromises);
        const failed = results.filter((r) => !r.ok);

        if (failed.length > 0) {
          throw new Error(`Không thể xóa ${failed.length} file`);
        }

        deletedCount = selected.size;
        setSelected(new Set());
      } else if (confirmDialog.type === "all") {
        const deletePromises = files.map((file) =>
          fetch(`/api/po-files/${file.id}`, { method: "DELETE" }),
        );

        const results = await Promise.all(deletePromises);
        const failed = results.filter((r) => !r.ok);

        if (failed.length > 0) {
          throw new Error(`Không thể xóa ${failed.length} file`);
        }

        deletedCount = files.length;
        setSelected(new Set());
      }

      setToast({
        show: true,
        success: true,
        message: `Đã xóa ${deletedCount} file thành công`,
      });

      router.refresh();
    } catch (error) {
      setToast({
        show: true,
        success: false,
        message: error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa file",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400">Kho tệp .po</p>
            <h2 className="text-2xl font-semibold text-white">Danh sách đã tải lên</h2>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="cursor-pointer rounded border-white/20 bg-slate-900 text-sky-500 focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-sm text-slate-400">
                {selected.size > 0 ? `Đã chọn ${selected.size} / ${files.length}` : "Chọn tất cả"}
              </span>
            </div>
            {canDeleteSelected && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={pending}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-red-500/30 bg-transparent px-4 py-2 text-sm font-semibold text-red-400 transition hover:border-red-500/60 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="size-4" />
                Xóa {selected.size} mục đã chọn
              </button>
            )}
            {canDeleteAll && (
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={pending}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-red-500/30 bg-transparent px-4 py-2 text-sm font-semibold text-red-400 transition hover:border-red-500/60 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="size-4" />
                Xóa tất cả
              </button>
            )}
          </div>
        )}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/5">
          <thead className="bg-white/5">
            <tr className="text-left text-xs font-semibold capitalize text-slate-300">
              <th className="px-4 py-3 w-12"></th>
              <th className="px-4 py-3">Tệp</th>
              <th className="px-4 py-3">Số dòng</th>
              <th className="px-4 py-3">Kích thước</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-slate-100">
            {!files.length ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  Chưa có tệp nào. Hãy tải tệp .po đầu tiên.
                </td>
              </tr>
            ) : (
              files.map((file) => {
                const isActive = activeFileId === file.id;
                const isChecked = selected.has(file.id);
                return (
                  <tr
                    key={file.id}
                    className={`transition ${
                      isActive ? "bg-white/5" : "hover:bg-white/5"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRow(file.id)}
                        aria-label={`Chọn ${file.filename}`}
                        className="size-4 rounded border-white/20 bg-transparent text-sky-400"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <Link
                          href={`/files/${file.id}`}
                          className="font-semibold text-white hover:text-sky-300"
                        >
                          {file.filename}
                        </Link>
                        <span className="text-xs text-slate-400">
                          {file.language ? `Ngôn ngữ: ${file.language}` : "Ngôn ngữ: không xác định"}
                        </span>
                        <span className="text-[11px] text-slate-500">{file.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">{file.entryCount}</td>
                    <td className="px-4 py-3">
                      {(file.filesize / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {isMounted
                        ? new Date(file.uploadedAt).toLocaleString("vi-VN")
                        : new Date(file.uploadedAt).toISOString().replace("T", " ").slice(0, 19)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteSingle(file)}
                        disabled={pending}
                        className="cursor-pointer rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Xóa file"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-xl font-semibold text-white">Xác nhận xóa</h3>
              <button
                type="button"
                onClick={closeConfirmDialog}
                disabled={pending}
                className="cursor-pointer rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mb-6 space-y-2">
              {confirmDialog.type === "single" && confirmDialog.fileName ? (
                <p className="text-slate-300">
                  Bạn có chắc chắn muốn xóa file <strong>"{confirmDialog.fileName}"</strong>?
                </p>
              ) : confirmDialog.type === "multiple" ? (
                <p className="text-slate-300">
                  Bạn có chắc chắn muốn xóa <strong>{confirmDialog.count}</strong> file đã chọn?
                </p>
              ) : (
                <p className="text-slate-300">
                  Bạn có chắc chắn muốn xóa <strong>tất cả {confirmDialog.count}</strong> file?
                </p>
              )}
              <p className="text-sm text-slate-400">
                Hành động này không thể hoàn tác. Vui lòng gõ <strong>"DELETE"</strong> để xác nhận.
              </p>
            </div>

            <div className="mb-6">
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Gõ DELETE để xác nhận"
                disabled={pending}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none disabled:opacity-60"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && deleteConfirmText === "DELETE" && !pending) {
                    executeDelete();
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirmDialog}
                disabled={pending}
                className="cursor-pointer rounded-full border border-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={pending || deleteConfirmText !== "DELETE"}
                className="cursor-pointer rounded-full bg-red-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && toast ? (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl px-4 py-3 text-sm shadow-lg ${
            toast.success
              ? "bg-emerald-500/90 text-white"
              : "bg-rose-500/90 text-white"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="font-semibold">{toast.success ? "Thành công" : "Lỗi"}</span>
            <button
              type="button"
              onClick={() => setDismissedKey(toastKey)}
              className="cursor-pointer rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-white/80 hover:bg-white/20"
            >
              Đóng
            </button>
          </div>
          <p className="mt-1 text-white/90">{toast.message}</p>
        </div>
      ) : null}
    </>
  );
}

