"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadPoFile } from "@/app/actions/po-actions";
import { usePermission } from "@/hooks/use-permission";

type UploadState = Awaited<ReturnType<typeof uploadPoFile>>;

const initialState: UploadState = {
  success: false,
  message: "",
};

type UploadPoFormProps = {
  showInlineStatus?: boolean;
};

type Project = {
  id: string;
  name: string;
  isPublic: boolean;
};

export function UploadPoForm({ showInlineStatus = false }: UploadPoFormProps) {
  const [state, action, pending] = useActionState(uploadPoFile, initialState);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const router = useRouter();
  const { user, isLoading: isLoadingUser } = usePermission();
  const toastKey = state?.message ? `${Number(state.success)}-${state.message}` : null;
  const showToast = toastKey !== null && dismissedKey !== toastKey;

  useEffect(() => {
    if (user && !isLoadingUser) {
      loadProjects();
    }
  }, [user, isLoadingUser]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await fetch("/api/projects");
      const result = await response.json();

      if (response.ok && result.data) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error("Load projects error:", error);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (state?.success && state?.fileId) {
      router.push(`/files/${state.fileId}`);
    }
  }, [state?.success, state?.fileId, router]);

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

      {/* Project Selector */}
      {!loadingProjects && projects.length > 0 && (
        <div className="flex flex-col gap-2">
          <label htmlFor="projectId" className="text-sm font-semibold text-slate-300">
            Project (tùy chọn)
          </label>
          <select
            id="projectId"
            name="projectId"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            disabled={pending}
            className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2 text-sm text-white transition focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Không chọn project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} {project.isPublic ? "(Public)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex w-full justify-end">
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

