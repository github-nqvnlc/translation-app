"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Pencil, Loader2, X, Plus, Trash2 } from "lucide-react";

const PAGE_SIZES = [10, 20, 30, 50, 100, 200, 500, 1000];

export type TranslationEntryView = {
  id: number;
  sourceText: string;
  translatedText: string;
  description?: string | null;
  references?: string | null;
};

type Props = {
  entries: TranslationEntryView[];
  tableName?: string;
  tableId: string;
};

type ToastState = {
  show: boolean;
  success: boolean;
  message: string;
};

type ConfirmDialogState = {
  show: boolean;
  type: "single" | "multiple" | "all";
  entryId?: number;
  entryText?: string;
  count?: number;
};

export function TranslationEntriesPanel({ entries, tableName, tableId }: Props) {
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [page, setPage] = useState(1);
  const [selectedDetail, setSelectedDetail] = useState<{
    label: string;
    text: string;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [editing, setEditing] = useState<TranslationEntryView | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{
    sourceText: string;
    translatedText: string;
    description: string;
    references: string;
  }>({ sourceText: "", translatedText: "", description: "", references: "" });
  const [saving, setSaving] = useState(false);
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
  const canDeleteAll = entries.length > 0;
  const allSelected = entries.length > 0 && selectedIds.size === entries.length;

  const maxPage = Math.max(1, Math.ceil(entries.length / pageSize));
  const boundedPage = Math.min(page, maxPage);
  const start = (boundedPage - 1) * pageSize;
  const end = Math.min(start + pageSize, entries.length);

  const visible = useMemo(() => entries.slice(start, end), [entries, start, end]);

  const handlePageSizeChange = (next: number) => {
    setPageSize(next);
    setPage(1);
  };

  const openDetail = (label: string, text: string) => {
    setSelectedDetail({ label, text });
  };

  const openFullDetail = (entry: TranslationEntryView) => {
    const segments = [
      entry.description ? `Ngữ cảnh: ${entry.description}` : null,
      entry.references ? `Áp dụng tại:\n${entry.references}` : null,
      `Source Text: ${entry.sourceText}`,
      `Translated Text: ${entry.translatedText}`,
    ].filter(Boolean);
    setSelectedDetail({
      label: entry.sourceText,
      text: segments.join("\n\n"),
    });
  };

  const closeDetail = () => setSelectedDetail(null);

  const openEdit = (entry: TranslationEntryView) => {
    setEditing(entry);
    setForm({
      sourceText: entry.sourceText ?? "",
      translatedText: entry.translatedText ?? "",
      description: entry.description ?? "",
      references: entry.references ?? "",
    });
  };

  const openCreate = () => {
    setCreating(true);
    setForm({ sourceText: "", translatedText: "", description: "", references: "" });
  };

  const closeEdit = () => {
    if (saving) return;
    setEditing(null);
    setCreating(false);
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = editing
        ? `/api/translation-tables/${tableId}/entries/${editing.id}`
        : `/api/translation-tables/${tableId}/entries`;
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText: form.sourceText,
          translatedText: form.translatedText,
          description: form.description.trim() === "" ? null : form.description,
          references: form.references.trim() === "" ? null : form.references,
        }),
      });

      if (!res.ok) {
        console.error(await res.text());
        throw new Error("Lưu thất bại");
      }

      setEditing(null);
      setCreating(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Không thể lưu thay đổi. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map((e) => e.id)));
    }
  };

  const handleDeleteSingle = (entry: TranslationEntryView) => {
    setConfirmDialog({
      show: true,
      type: "single",
      entryId: entry.id,
      entryText: entry.sourceText,
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
      count: entries.length,
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

      if (confirmDialog.type === "single" && confirmDialog.entryId) {
        const response = await fetch(
          `/api/translation-tables/${tableId}/entries/${confirmDialog.entryId}`,
          { method: "DELETE" },
        );

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Không thể xóa entry");
        }

        deletedCount = 1;
      } else if (confirmDialog.type === "multiple") {
        const deletePromises = Array.from(selectedIds).map((id) =>
          fetch(`/api/translation-tables/${tableId}/entries/${id}`, { method: "DELETE" }),
        );

        const results = await Promise.all(deletePromises);
        const failed = results.filter((r) => !r.ok);

        if (failed.length > 0) {
          throw new Error(`Không thể xóa ${failed.length} entry`);
        }

        deletedCount = selectedIds.size;
        setSelectedIds(new Set());
      } else if (confirmDialog.type === "all") {
        const deletePromises = entries.map((entry) =>
          fetch(`/api/translation-tables/${tableId}/entries/${entry.id}`, { method: "DELETE" }),
        );

        const results = await Promise.all(deletePromises);
        const failed = results.filter((r) => !r.ok);

        if (failed.length > 0) {
          throw new Error(`Không thể xóa ${failed.length} entry`);
        }

        deletedCount = entries.length;
        setSelectedIds(new Set());
      }

      setToast({
        show: true,
        success: true,
        message: `Đã xóa ${deletedCount} entry thành công`,
      });

      router.refresh();
    } catch (error) {
      setToast({
        show: true,
        success: false,
        message: error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa entry",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs text-slate-400">Quản lý bản dịch</p>
          <h2 className="text-2xl font-semibold text-white">
            {tableName ? `Bảng: ${tableName}` : "Chưa chọn bảng"}
          </h2>
          <p className="text-sm text-slate-300">
            Chọn dòng để xem chi tiết hoặc chỉnh sửa nội dung.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {entries.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="cursor-pointer rounded border-white/20 bg-slate-900 text-sky-500 focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-sm text-slate-400">
                {selectedIds.size > 0 ? `Đã chọn ${selectedIds.size} / ${entries.length}` : "Chọn tất cả"}
              </span>
            </div>
          )}
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
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
          >
            <Plus className="size-4" />
            Thêm mới
          </button>
          <label className="text-sm font-medium text-slate-500">Số dòng/trang</label>
          <select
            value={pageSize}
            onChange={(event) => handlePageSizeChange(Number(event.target.value))}
            className="cursor-pointer rounded-full border border-white/10 bg-transparent px-2 py-2 text-sm text-white"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size} className="bg-slate-900 text-white">
                {size} dòng
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 max-h-[520px] overflow-hidden rounded-2xl border border-white/10">
        <div className="table-scrollbar max-h-[520px] overflow-y-auto">
          <table className="min-w-full table-fixed divide-y divide-white/5">
            <thead className="sticky top-0 z-10 bg-slate-950 text-left text-xs font-semibold text-slate-300 uppercase">
              <tr>
                <th className="w-12 px-6 py-3"></th>
                <th className="max-w-[400px] px-6 py-3">Source Text</th>
                <th className="max-w-[400px] px-6 py-3">Translated Text</th>
                <th className="max-w-[120px] px-6 py-3">action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!entries.length ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    Chưa có bản dịch nào. Hãy thêm bản dịch đầu tiên.
                  </td>
                </tr>
              ) : (
                visible.map((entry, idx) => {
                  const isSelected = selectedIds.has(entry.id);
                  return (
                    <tr
                      key={entry.id}
                      className={`text-sm text-slate-100 hover:bg-white/5 ${
                        isSelected ? "bg-sky-500/10" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(entry.id)}
                          className="cursor-pointer rounded border-white/20 bg-slate-900 text-sky-500 focus:ring-2 focus:ring-sky-500"
                        />
                      </td>
                      <td
                        className="max-w-[400px] cursor-pointer px-6 py-4"
                        onClick={() => openDetail("Source Text", entry.sourceText)}
                      >
                      <p className="truncate" title={entry.sourceText}>
                        {entry.sourceText}
                      </p>
                      {entry.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                          {entry.description}
                        </p>
                      ) : null}
                    </td>
                    <td
                      className="max-w-[400px] cursor-pointer px-6 py-4 text-slate-300"
                      onClick={() => openDetail("Translated Text", entry.translatedText)}
                    >
                      <p className="truncate" title={entry.translatedText}>
                        {entry.translatedText}
                      </p>
                      {entry.references ? (
                        <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">
                          {entry.references.split("\n").join(" · ")}
                        </p>
                      ) : null}
                    </td>
                    <td className="max-w-[120px] px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="Sửa"
                          onClick={() => openEdit(entry)}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/10 text-slate-200 hover:border-white/40"
                        >
                          <Pencil className="size-3" />
                        </button>
                        <button
                          type="button"
                          title="Xem chi tiết"
                          onClick={() => openFullDetail(entry)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-white/40"
                        >
                          <BookOpenCheck className="size-3" /> #{start + idx + 1}
                        </button>
                        <button
                          type="button"
                          title="Xóa"
                          onClick={() => handleDeleteSingle(entry)}
                          disabled={pending}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-red-500/30 text-red-400 hover:border-red-500/60 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
        <p>
          Hiển thị {entries.length ? `${start + 1}-${end}` : "0-0"} / {entries.length} bản ghi
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPage(Math.max(1, boundedPage - 1))}
            disabled={boundedPage <= 1}
            className="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
          >
            Trước
          </button>
          <button
            type="button"
            onClick={() => setPage(Math.min(maxPage, boundedPage + 1))}
            disabled={boundedPage >= maxPage}
            className="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
          >
            Sau
          </button>
        </div>
      </div>

      {selectedDetail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">{selectedDetail.label}</p>
                <p className="text-lg font-semibold">Chi tiết bản dịch</p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/10 text-slate-300 hover:border-white/40 hover:text-white"
                title="Đóng"
              >
                <X className="size-4" />
              </button>
            </div>
            <textarea
              readOnly
              value={selectedDetail.text}
              className="mt-4 h-48 w-full rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm leading-relaxed text-slate-300 focus:outline-none"
            />
          </div>
        </div>
      ) : null}

      {(editing || creating) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-8">
          <div className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  {creating ? "Thêm bản dịch mới" : `Sửa bản dịch #${editing?.id}`}
                </p>
                <h3 className="text-lg font-semibold">
                  {creating ? "Tạo bản dịch mới" : "Cập nhật bản dịch"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/10 text-slate-500 hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                title="Đóng"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-6 overflow-auto p-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500">Source Text *</label>
                <textarea
                  value={form.sourceText}
                  onChange={(e) => handleChange("sourceText", e.target.value)}
                  className="min-h-48 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-sm text-slate-100 focus:border-white/30 focus:outline-none"
                  placeholder="Nhập văn bản gốc..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500">Translated Text *</label>
                <textarea
                  value={form.translatedText}
                  onChange={(e) => handleChange("translatedText", e.target.value)}
                  className="min-h-48 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-sm text-slate-100 focus:border-white/30 focus:outline-none"
                  placeholder="Nhập bản dịch..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500">Ngữ cảnh (description)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="min-h-32 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-sm text-slate-100 focus:border-white/30 focus:outline-none"
                  placeholder="Mô tả ngữ cảnh..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500">Vị trí áp dụng (references)</label>
                <textarea
                  value={form.references}
                  onChange={(e) => handleChange("references", e.target.value)}
                  className="min-h-32 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-sm text-slate-100 focus:border-white/30 focus:outline-none"
                  placeholder="Vị trí áp dụng..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !form.sourceText.trim() || !form.translatedText.trim()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {creating ? "Tạo mới" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
              {confirmDialog.type === "single" && confirmDialog.entryText ? (
                <p className="text-slate-300">
                  Bạn có chắc chắn muốn xóa entry <strong>"{confirmDialog.entryText}"</strong>?
                </p>
              ) : confirmDialog.type === "multiple" ? (
                <p className="text-slate-300">
                  Bạn có chắc chắn muốn xóa <strong>{confirmDialog.count}</strong> entry đã chọn?
                </p>
              ) : (
                <p className="text-slate-300">
                  Bạn có chắc chắn muốn xóa <strong>tất cả {confirmDialog.count}</strong> entry?
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
    </section>
  );
}

