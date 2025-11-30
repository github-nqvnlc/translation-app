"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  tableId: string;
  tableName: string;
};

export function DeleteTableButton({ tableId, tableName }: Props) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bảng dịch "${tableName}"?`)) {
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(`/api/translation-tables/${tableId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Xóa thất bại");
      }

      router.push("/projects");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Không thể xóa bảng dịch. Vui lòng thử lại.");
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-red-500/30 bg-transparent px-3 text-sm font-medium text-red-400 transition hover:border-red-500/60 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
      title="Xóa bảng dịch"
    >
      <Trash2 className="h-4 w-4" />
      <span className="hidden sm:inline">Xóa</span>
    </button>
  );
}

