"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, X } from "lucide-react";

type TranslationTable = {
  id: string;
  name: string;
  language: string | null;
  description: string | null;
  _count: {
    entries: number;
  };
};

type Props = {
  tables: TranslationTable[];
};

type ToastState = {
  show: boolean;
  success: boolean;
  message: string;
};

type ConfirmDialogState = {
  show: boolean;
  type: "single" | "multiple" | "all";
  tableId?: string;
  tableName?: string;
  count?: number;
};

export function TranslationTablesList({ tables }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, success: false, message: "" });
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    show: false,
    type: "single",
  });
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const router = useRouter();

  const toastKey = toast.show ? `${Number(toast.success)}-${toast.message}` : null;
  const showToast = toast.show && dismissedKey !== toastKey;
  const canDeleteSelected = selectedIds.size > 0;
  const canDeleteAll = tables.length > 0;

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === tables.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tables.map((t) => t.id)));
    }
  };

  const handleDeleteSingle = (table: TranslationTable) => {
    setConfirmDialog({
      show: true,
      type: "single",
      tableId: table.id,
      tableName: table.name,
    });
    setDeleteConfirmText("");
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setConfirmDialog({
      show: true,
      type: "multiple",
      count: selectedIds.size,
    });
    setDeleteConfirmText("");
  };

  const handleDeleteAll = () => {
    setConfirmDialog({
      show: true,
      type: "all",
      count: tables.length,
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

      if (confirmDialog.type === "single" && confirmDialog.tableId) {
        const response = await fetch(`/api/translation-tables/${confirmDialog.tableId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Không thể xóa bảng dịch");
        }

        deletedCount = 1;
      } else if (confirmDialog.type === "multiple") {
        const deletePromises = Array.from(selectedIds).map((id) =>
          fetch(`/api/translation-tables/${id}`, { method: "DELETE" }),
        );

        const results = await Promise.all(deletePromises);
        const failed = results.filter((r) => !r.ok);

        if (failed.length > 0) {
          throw new Error(`Không thể xóa ${failed.length} bảng dịch`);
        }

        deletedCount = selectedIds.size;
        setSelectedIds(new Set());
      } else if (confirmDialog.type === "all") {
        const deletePromises = tables.map((table) =>
          fetch(`/api/translation-tables/${table.id}`, { method: "DELETE" }),
        );

        const results = await Promise.all(deletePromises);
        const failed = results.filter((r) => !r.ok);

        if (failed.length > 0) {
          throw new Error(`Không thể xóa ${failed.length} bảng dịch`);
        }

        deletedCount = tables.length;
        setSelectedIds(new Set());
      }

      setToast({
        show: true,
        success: true,
        message: `Đã xóa ${deletedCount} bảng dịch thành công`,
      });

      router.refresh();
    } catch (error) {
      setToast({
        show: true,
        success: false,
        message: error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa bảng dịch",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {tables.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.size === tables.length && tables.length > 0}
              onChange={toggleSelectAll}
              className="cursor-pointer rounded border-white/20 bg-slate-900 text-sky-500 focus:ring-2 focus:ring-sky-500"
            />
            <span className="text-sm text-slate-400">
              {selectedIds.size > 0
                ? `Đã chọn ${selectedIds.size} / ${tables.length}`
                : "Chọn tất cả"}
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
              Xóa {selectedIds.size} mục đã chọn
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

      {tables.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-12 text-center">
          <p className="text-slate-400">Chưa có bảng dịch nào. Hãy tạo bảng dịch đầu tiên.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => {
            const isSelected = selectedIds.has(table.id);
            return (
              <div
                key={table.id}
                className={`group relative rounded-2xl border bg-slate-950/40 p-6 transition ${
                  isSelected
                    ? "border-sky-500/60 bg-slate-950/60"
                    : "border-white/10 hover:border-white/20 hover:bg-slate-950/60"
                }`}
              >
                <div className="absolute right-4 top-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(table.id)}
                    className="cursor-pointer rounded border-white/20 bg-slate-900 text-sky-500 focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteSingle(table);
                    }}
                    disabled={pending}
                    className="cursor-pointer rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    title="Xóa bảng dịch"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <Link
                  href={`/translations/${table.id}`}
                  className="block"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button, input")) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className="mb-2 flex items-start justify-between pr-20">
                    <h2 className="text-xl font-semibold text-white group-hover:text-sky-300">
                      {table.name}
                    </h2>
                  </div>
                  <p className="mb-4 text-sm text-slate-400">
                    Ngôn ngữ: {table.language} · {table._count.entries} bản dịch
                  </p>
                  {table.description ? (
                    <p className="line-clamp-2 text-sm text-slate-300">{table.description}</p>
                  ) : null}
                </Link>
              </div>
            );
          })}
        </div>
      )}

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
              {confirmDialog.type === "single" && confirmDialog.tableName ? (
                <p className="text-slate-300">
                  Bạn có chắc chắn muốn xóa bảng dịch <strong>&ldquo;{confirmDialog.tableName}&rdquo;</strong>?
                </p>
              ) : confirmDialog.type === "multiple" ? (
                <p className="text-slate-300">
                  Bạn có chắc chắn muốn xóa <strong>{confirmDialog.count}</strong> bảng dịch đã chọn?
                </p>
              ) : (
                <p className="text-slate-300">
                  Bạn có chắc chắn muốn xóa <strong>tất cả {confirmDialog.count}</strong> bảng dịch?
                </p>
              )}
              <p className="text-sm text-slate-400">
                Hành động này không thể hoàn tác. Vui lòng gõ <strong>&ldquo;DELETE&rdquo;</strong> để xác nhận.
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

