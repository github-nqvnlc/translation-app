"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Pencil, Loader2, X, WandSparkles } from "lucide-react";
import { DEEPL_FREE_CHARACTER_LIMIT } from "@/lib/constants";

const PAGE_SIZES = [10, 20, 30, 50, 100, 200, 500, 1000, 2000, 3000, 5000, 10000, 20000, 50000];

export type PoEntryView = {
  id: number;
  msgid: string;
  msgstr: string;
  description?: string | null;
  references?: string | null;
};

type Props = {
  entries: PoEntryView[];
  filename?: string;
  fileId: string;
  language?: string | null;
};

export function PoEntriesPanel({ entries, filename, fileId, language }: Props) {
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [page, setPage] = useState(1);
  const [selectedDetail, setSelectedDetail] = useState<{
    label: string;
    text: string;
  } | null>(null);

  const [editing, setEditing] = useState<PoEntryView | null>(null);
  const [form, setForm] = useState<{
    msgid: string;
    msgstr: string;
    description: string;
    references: string;
  }>({ msgid: "", msgstr: "", description: "", references: "" });
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchTranslating, setBatchTranslating] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchSummary, setBatchSummary] = useState<{
    translatedCount: number;
    skippedCount: number;
    missingCount: number;
    totalCharacters: number;
    limit: number;
    message?: string;
  } | null>(null);
  const router = useRouter();

  const maxPage = Math.max(1, Math.ceil(entries.length / pageSize));
  const boundedPage = Math.min(page, maxPage);
  const start = (boundedPage - 1) * pageSize;
  const end = Math.min(start + pageSize, entries.length);

  const visible = useMemo(() => entries.slice(start, end), [entries, start, end]);
  const selectedEntries = useMemo(
    () => entries.filter((entry) => selectedIds.has(entry.id)),
    [entries, selectedIds],
  );
  const selectedCharacterCount = useMemo(
    () => selectedEntries.reduce((sum, entry) => sum + entry.msgid.length, 0),
    [selectedEntries],
  );
  const exceedsFreeLimit = selectedCharacterCount > DEEPL_FREE_CHARACTER_LIMIT;
  const allSelected = entries.length > 0 && selectedIds.size === entries.length;

  const handlePageSizeChange = (next: number) => {
    setPageSize(next);
    setPage(1);
  };

  const openDetail = (label: string, text: string) => {
    setSelectedDetail({ label, text });
  };

  const openFullDetail = (entry: PoEntryView) => {
    const segments = [
      entry.description ? `Ngữ cảnh: ${entry.description}` : null,
      entry.references ? `Áp dụng tại:\n${entry.references}` : null,
      `msgid: ${entry.msgid}`,
      `msgstr: ${entry.msgstr}`,
    ].filter(Boolean);
    setSelectedDetail({
      label: entry.msgid,
      text: segments.join("\n\n"),
    });
  };

  const closeDetail = () => setSelectedDetail(null);

  const openEdit = (entry: PoEntryView) => {
    setEditing(entry);
    setForm({
      msgid: entry.msgid ?? "",
      msgstr: entry.msgstr ?? "",
      description: entry.description ?? "",
      references: entry.references ?? "",
    });
  };

  const closeEdit = () => {
    if (saving) return;
    setEditing(null);
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/po-files/${fileId}/entries/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msgid: form.msgid,
          msgstr: form.msgstr,
          description: form.description.trim() === "" ? null : form.description,
          references: form.references.trim() === "" ? null : form.references,
        }),
      });
      if (!res.ok) {
        console.error(await res.text());
        throw new Error("Lưu thất bại");
      }
      setEditing(null);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Không thể lưu thay đổi. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const targetLanguage = language?.trim();

  const handleDeepLTranslate = async () => {
    if (!editing || !targetLanguage || !form.msgid.trim()) {
      return;
    }

    try {
      setTranslating(true);
      const response = await fetch("/api/deepl/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: form.msgid.trim(),
          targetLang: targetLanguage,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Không thể lấy bản dịch từ DeepL");
      }

      const translated = result?.data?.text;
      if (typeof translated !== "string") {
        throw new Error("DeepL trả về dữ liệu không hợp lệ");
      }

      setForm((prev) => ({ ...prev, msgstr: translated }));
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Không thể gọi DeepL. Vui lòng kiểm tra cấu hình và thử lại.",
      );
    } finally {
      setTranslating(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map((entry) => entry.id)));
    }
  };

  const openBatchDialog = () => {
    setBatchDialogOpen(true);
    setBatchError(null);
    setBatchSummary(null);
  };

  const closeBatchDialog = () => {
    if (batchTranslating) return;
    setBatchDialogOpen(false);
    setBatchError(null);
    setBatchSummary(null);
    setOverwriteExisting(false);
  };

  const handleBatchTranslate = async () => {
    if (!targetLanguage || selectedIds.size === 0 || exceedsFreeLimit) {
      return;
    }

    try {
      setBatchTranslating(true);
      setBatchError(null);
      setBatchSummary(null);

      const response = await fetch(`/api/po-files/${fileId}/entries/batch-translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryIds: Array.from(selectedIds),
          targetLang: targetLanguage,
          overwriteExisting,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Không thể dịch hàng loạt");
      }

      setBatchSummary(result?.data);
      router.refresh();
      setBatchDialogOpen(false);
      setSelectedIds(new Set());
    } catch (error) {
      setBatchError(
        error instanceof Error ? error.message : "Không thể dịch hàng loạt. Vui lòng thử lại.",
      );
    } finally {
      setBatchTranslating(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs text-slate-400">Viewer msgid/msgstr</p>
          <h2 className="text-2xl font-semibold text-white">
            {filename ? `Đang xem: ${filename}` : "Chưa chọn tệp"}
          </h2>
          <p className="text-sm text-slate-300">
            Chọn dòng để xem chi tiết nội dung tương tự bản gốc.
          </p>
          <p
            className={`mt-1 min-h-[18px] text-xs transition-colors ${
              selectedIds.size > 0 && exceedsFreeLimit ? "text-rose-400" : "text-slate-400"
            }`}
          >
            {selectedIds.size > 0 ? (
              <>
                Ký tự dự kiến gửi tới DeepL:{" "}
                <strong>
                  {selectedCharacterCount.toLocaleString()} / {DEEPL_FREE_CHARACTER_LIMIT.toLocaleString()}
                </strong>{" "}
                (gói Free)
              </>
            ) : (
              "Chọn các dòng để dịch nhanh bằng DeepL."
            )}
          </p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex items-center gap-2 self-end text-xs text-slate-400">
            <label className="font-semibold">Số dòng/trang</label>
            <select
              value={pageSize}
              onChange={(event) => handlePageSizeChange(Number(event.target.value))}
              className="h-8 cursor-pointer rounded-full border border-white/10 bg-transparent px-2 text-xs text-white"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size} className="bg-slate-900 text-white">
                  {size} dòng
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {entries.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="size-4 cursor-pointer rounded border border-slate-500 bg-slate-900 text-sky-500 accent-sky-500 transition focus:ring-2 focus:ring-sky-500 checked:border-sky-400 checked:bg-sky-500"
                />
                <span className="text-slate-400">
                  {selectedIds.size > 0 ? `Đã chọn ${selectedIds.size} / ${entries.length}` : "Chọn tất cả"}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={openBatchDialog}
              disabled={
                batchTranslating ||
                !targetLanguage ||
                exceedsFreeLimit ||
                selectedIds.size === 0
              }
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-sky-500/40 bg-transparent px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:border-sky-400 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              title={
                !targetLanguage
                  ? "Không xác định ngôn ngữ tệp, không thể dùng DeepL"
                  : selectedIds.size === 0
                    ? "Chọn ít nhất một dòng để dịch bằng DeepL"
                    : exceedsFreeLimit
                      ? "Số ký tự vượt giới hạn DeepL free"
                      : "Dịch các dòng đã chọn bằng DeepL"
              }
            >
              {batchTranslating ? <Loader2 className="size-3.5 animate-spin" /> : <WandSparkles className="size-3.5" />}
              Dịch hàng loạt
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 max-h-[520px] overflow-hidden rounded-2xl border border-white/10">
        <div className="table-scrollbar max-h-[520px] overflow-y-auto">
          <table className="min-w-full table-fixed divide-y divide-white/5">
            <thead className="sticky top-0 z-10 bg-slate-950 text-left text-xs font-semibold text-slate-300 uppercase">
              <tr>
                <th className="w-12 px-6 py-3"></th>
                <th className="max-w-[500px] px-6 py-3">msgid</th>
                <th className="max-w-[500px] px-6 py-3">msgstr</th>
                <th className="max-w-[120px] px-6 py-3">action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!entries.length ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                    Chưa có dữ liệu. Hãy chọn hoặc tải một tệp .po.
                  </td>
                </tr>
              ) : (
                visible.map((entry, idx) => {
                  const isSelected = selectedIds.has(entry.id);
                  return (
                  <tr key={entry.id} className={`text-sm text-slate-100 hover:bg-white/5 ${isSelected ? "bg-sky-500/10" : ""}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(entry.id)}
                        className="size-4 cursor-pointer rounded border border-slate-500 bg-slate-900 text-sky-500 accent-sky-500 transition focus:ring-2 focus:ring-sky-500 checked:border-sky-400 checked:bg-sky-500"
                      />
                    </td>
                    <td
                      className="max-w-[500px] cursor-pointer px-6 py-4"
                      onClick={() => openDetail("msgid", entry.msgid)}
                    >
                      <p className="truncate" title={entry.msgid}>
                        {entry.msgid}
                      </p>
                      {entry.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                          {entry.description}
                        </p>
                      ) : null}
                    </td>
                    <td
                      className="max-w-[500px] cursor-pointer px-6 py-4 text-slate-300"
                      onClick={() => openDetail("msgstr", entry.msgstr)}
                    >
                      <p className="truncate" title={entry.msgstr}>
                        {entry.msgstr}
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
                <p className="text-lg font-semibold">Chi tiết chuỗi dịch</p>
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

      {batchDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-8">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">DeepL Batch</p>
                <h3 className="text-lg font-semibold">Dịch {selectedIds.size} dòng đã chọn</h3>
              </div>
              <button
                type="button"
                onClick={closeBatchDialog}
                disabled={batchTranslating}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/10 text-slate-400 hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                title="Đóng"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>
                Ngôn ngữ đích: <strong>{targetLanguage ?? "Không xác định"}</strong>
              </p>
              <p className={exceedsFreeLimit ? "text-rose-400" : undefined}>
                Ký tự dự kiến:{" "}
                <strong>
                  {selectedCharacterCount.toLocaleString()} / {DEEPL_FREE_CHARACTER_LIMIT.toLocaleString()}
                </strong>{" "}
                (gói Free)
              </p>
              <label className="flex items-center gap-2 text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                  disabled={batchTranslating}
                  className="h-4 w-4 rounded border-white/20 bg-slate-900 text-sky-500 focus:ring-2 focus:ring-sky-500"
                />
                Ghi đè các dòng đã có msgstr
              </label>
              {batchError ? <p className="text-sm text-rose-400">{batchError}</p> : null}
              {batchSummary ? (
                <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-300">
                  <p>Kết quả:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Đã dịch: <strong>{batchSummary.translatedCount}</strong></li>
                    <li>• Bỏ qua (đã có dịch): <strong>{batchSummary.skippedCount}</strong></li>
                    <li>• Không tìm thấy: <strong>{batchSummary.missingCount}</strong></li>
                    <li>
                      • Ký tự đã gửi:{" "}
                      <strong>
                        {batchSummary.totalCharacters.toLocaleString()} / {batchSummary.limit.toLocaleString()}
                      </strong>
                    </li>
                  </ul>
                  {batchSummary.message ? <p className="mt-2 text-slate-400">{batchSummary.message}</p> : null}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeBatchDialog}
                disabled={batchTranslating}
                className="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-400 hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleBatchTranslate}
                disabled={
                  batchTranslating ||
                  exceedsFreeLimit ||
                  !targetLanguage ||
                  selectedIds.size === 0
                }
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {batchTranslating ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
                {batchTranslating ? "Đang dịch..." : "Bắt đầu dịch"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-8">
          <div className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-xs font-semibold text-slate-500">Sửa bản dịch #{editing.id}</p>
                <h3 className="text-lg font-semibold">Cập nhật chuỗi dịch</h3>
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
                <label className="text-xs font-semibold text-slate-500">msgid</label>
                <textarea
                  value={form.msgid}
                  onChange={(e) => handleChange("msgid", e.target.value)}
                  className="min-h-48 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-sm text-slate-100 focus:border-white/30 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500">msgstr</label>
                <textarea
                  value={form.msgstr}
                  onChange={(e) => handleChange("msgstr", e.target.value)}
                  className="min-h-48 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-sm text-slate-100 focus:border-white/30 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleDeepLTranslate}
                    disabled={translating || !targetLanguage || !form.msgid.trim()}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-white transition hover:border-white/40 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                    title={
                      !targetLanguage
                        ? "Không xác định ngôn ngữ tệp, không thể gọi DeepL"
                        : "Dùng DeepL để dịch nhanh msgid"
                    }
                  >
                    {translating ? <Loader2 className="size-3 animate-spin" /> : <WandSparkles className="size-3" />}
                    DeepL
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500">
                  Ngữ cảnh (description)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="min-h-32 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-sm text-slate-100 focus:border-white/30 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500">
                  Vị trí áp dụng (references)
                </label>
                <textarea
                  value={form.references}
                  onChange={(e) => handleChange("references", e.target.value)}
                  className="min-h-32 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-sm text-slate-100 focus:border-white/30 focus:outline-none"
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
                disabled={saving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
