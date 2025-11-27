"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadPoFile } from "@/app/actions/po-actions";

type UploadState = Awaited<ReturnType<typeof uploadPoFile>>;

const initialState: UploadState = {
  success: false,
  message: "",
};

type UploadPoFormProps = {
  projectId: string;
  showInlineStatus?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function UploadPoForm({ projectId, showInlineStatus = false, onSuccess, onCancel }: UploadPoFormProps) {
  const [state, action, pending] = useActionState(uploadPoFile, initialState);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const router = useRouter();
  const toastKey = state?.message ? `${Number(state.success)}-${state.message}` : null;
  const showToast = toastKey !== null && dismissedKey !== toastKey;

  useEffect(() => {
    if (state?.success && state?.fileId) {
      // Call onSuccess callback if provided, otherwise redirect
      if (onSuccess) {
        onSuccess();
      } else {
        // Fallback: redirect to file detail page
        router.push(`/files/${state.fileId}`);
      }
    }
  }, [state?.success, state?.fileId, router, onSuccess]);

  const ellipsizeMiddle = (text: string, max = 10) => {
    if (text.length <= max) return text;
    if (max <= 3) return text.slice(0, max);
    const keep = max - 3;
    const front = Math.ceil(keep / 2);
    const back = Math.floor(keep / 2);
    return text.slice(0, front) + "..." + text.slice(text.length - back);
  };

  const fileLabel = state?.success
    ? "Chọn tệp .po"
    : ellipsizeMiddle(selectedFileName ?? "Chọn tệp .po", 12);

  return (
    <form action={action} className="space-y-4">
      {/* Hidden input for projectId */}
      <input type="hidden" name="projectId" value={projectId} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Tải tệp .po mới</h2>
          <p className="text-sm text-slate-300">
            Hệ thống sẽ phân tích msgid/msgstr và lưu lại để xem trực tiếp.
          </p>
        </div>
        <label className="w-40 justify-center group relative inline-flex cursor-pointer items-center gap-3 rounded-full bg-white/10 px-6 py-3 text-white transition hover:bg-white/20">
          <span className="text-sm font-semibold tracking-wide">
            {fileLabel}
          </span>
          <input
            name="poFile"
            type="file"
            accept=".po,text/plain"
            className="absolute inset-0 cursor-pointer opacity-0"
            required
            disabled={pending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              setSelectedFileName(file?.name ?? null);
            }}
          />
        </label>
      </div>

      <div className="flex w-full justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="w-40 justify-center inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-40 justify-center inline-flex cursor-pointer items-center gap-2 rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-500"
        >
          {pending ? "Đang xử lý..." : "Upload tệp"}
        </button>
      </div>
      {state?.message ? (
        <div className="sr-only" aria-live="polite">
          {state.message}
        </div>
      ) : null}
      {showInlineStatus && state?.message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            state.success
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
              : "border-rose-500/40 bg-rose-500/10 text-rose-100"
          }`}
        >
          {state.message}
        </div>
      ) : null}
      {showToast && state ? (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl px-4 py-3 text-sm shadow-lg ${
            state.success
              ? "bg-emerald-500/90 text-white"
              : "bg-rose-500/90 text-white"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="font-semibold">
              {state.success ? "Tải thành công" : "Tải thất bại"}
            </span>
            <button
              type="button"
              onClick={() => setDismissedKey(toastKey)}
              className="cursor-pointer rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-white/80 hover:bg-white/20"
            >
              Đóng
            </button>
          </div>
          <p className="mt-1 text-white/90">{state.message}</p>
        </div>
      ) : null}
    </form>
  );
}

