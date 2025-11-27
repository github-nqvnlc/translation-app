"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ToastState = {
  show: boolean;
  success: boolean;
  message: string;
};

type Props = {
  projectId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function CreateTranslationForm({ projectId, onSuccess, onCancel }: Props) {
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, success: false, message: "" });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setToast({ show: false, success: false, message: "" });

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString();
    const language = formData.get("language")?.toString();
    const description = formData.get("description")?.toString();

    if (!name || !language) {
      setToast({
        show: true,
        success: false,
        message: "Tên và ngôn ngữ là bắt buộc",
      });
      setPending(false);
      return;
    }

    try {
      const response = await fetch("/api/translation-tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          language: language.trim(),
          description: description?.trim() || null,
          projectId: projectId, // Required from props
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setToast({
          show: true,
          success: false,
          message: result.error || "Không thể tạo bảng dịch",
        });
        setPending(false);
        return;
      }

      setToast({
        show: true,
        success: true,
        message: `Đã tạo bảng dịch "${result.data.name}" thành công`,
      });

      // Call onSuccess callback if provided, otherwise redirect
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        // Fallback: redirect to translation detail page
        setTimeout(() => {
          router.push(`/translations/${result.data.id}`);
          router.refresh();
        }, 1500);
      }
    } catch (error) {
      console.error(error);
      setToast({
        show: true,
        success: false,
        message: "Đã xảy ra lỗi khi tạo bảng dịch",
      });
      setPending(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-semibold text-slate-300">
              Tên bảng dịch *
            </label>
            <input
              id="name"
              name="name"
              required
              disabled={pending}
              placeholder="Ví dụ: ERPNext Vietnamese"
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="language" className="text-sm font-semibold text-slate-300">
              Ngôn ngữ *
            </label>
            <input
              id="language"
              name="language"
              required
              disabled={pending}
              placeholder="Ví dụ: vi, en, fr"
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="text-sm font-semibold text-slate-300">
              Mô tả
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              disabled={pending}
              placeholder="Mô tả về bảng dịch này..."
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={pending}
              className="cursor-pointer rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Đang tạo..." : "Tạo bảng dịch"}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={pending}
                className="cursor-pointer rounded-full border border-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:border-white/40 disabled:opacity-60"
              >
                Hủy
              </button>
            )}
          </div>
        </div>
      </form>

      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl px-4 py-3 text-sm shadow-lg ${
            toast.success
              ? "bg-emerald-500/90 text-white"
              : "bg-rose-500/90 text-white"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="font-semibold">
              {toast.success ? "Thành công" : "Lỗi"}
            </span>
            <button
              type="button"
              onClick={() => setToast({ show: false, success: false, message: "" })}
              className="cursor-pointer rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-white/80 hover:bg-white/20"
            >
              Đóng
            </button>
          </div>
          <p className="mt-1 text-white/90">{toast.message}</p>
        </div>
      )}
    </>
  );
}

