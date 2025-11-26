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

      router.push("/translations");
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
      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-red-500/30 bg-transparent px-6 py-2 text-sm font-semibold text-red-400 transition hover:border-red-500/60 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 className="size-4" />
      Xóa bảng
    </button>
  );
}

