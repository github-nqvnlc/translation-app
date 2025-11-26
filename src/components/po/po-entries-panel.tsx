"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Pencil, Loader2, X } from "lucide-react";

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
};

export function PoEntriesPanel({ entries, filename, fileId }: Props) {
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
  const router = useRouter();

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
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-slate-500">Số dòng/trang</label>
          <select
            value={pageSize}
            onChange={(event) => handlePageSizeChange(Number(event.target.value))}
            className="rounded-full border border-white/10 bg-transparent px-2 py-2 text-sm text-white"
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
                visible.map((entry, idx) => (
                  <tr key={entry.id} className="text-sm text-slate-100 hover:bg-white/5">
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
                ))
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
