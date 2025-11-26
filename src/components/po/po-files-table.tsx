"use client";

import { useMemo, useState, useTransition } from "react";
import { deleteAllFiles, deleteFiles } from "@/app/actions/po-actions";
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

export function PoFilesTable({ files, activeFileId }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const allSelected = useMemo(
    () => files.length > 0 && selected.size === files.length,
    [files.length, selected.size],
  );

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

  const handleDeleteSelected = () => {
    startTransition(async () => {
      await deleteFiles(Array.from(selected));
      setSelected(new Set());
    });
  };

  const handleDeleteAll = () => {
    startTransition(async () => {
      await deleteAllFiles();
      setSelected(new Set());
    });
  };

  const handleDeleteSingle = (id: string) => {
    startTransition(async () => {
      await deleteFiles([id]);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    });
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs  text-slate-400">
            Kho tệp .po
          </p>
          <h2 className="text-2xl font-semibold text-white">Danh sách đã tải lên</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!selected.size || isPending}
            onClick={handleDeleteSelected}
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-400"
          >
            Xoá mục đã chọn
          </button>
          <button
            type="button"
            disabled={!files.length || isPending}
            onClick={handleDeleteAll}
            className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            Xoá tất cả
          </button>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/5">
          <thead className="bg-white/5">
            <tr className="text-left text-xs font-semibold capitalize text-slate-300">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="size-4 rounded border-white/20 bg-transparent text-sky-400"
                />
              </th>
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
                      {new Date(file.uploadedAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteSingle(file.id)}
                        disabled={isPending}
                        className="text-sm font-semibold text-rose-300 hover:text-rose-100 disabled:cursor-not-allowed disabled:text-slate-500"
                      >
                        Xoá
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
  );
}

