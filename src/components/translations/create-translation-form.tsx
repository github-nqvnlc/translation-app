"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePermission } from "@/hooks/use-permission";

type ToastState = {
  show: boolean;
  success: boolean;
  message: string;
};

type Project = {
  id: string;
  name: string;
  isPublic: boolean;
};

export function CreateTranslationForm() {
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, success: false, message: "" });
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const router = useRouter();
  const { user, isLoading: isLoadingUser } = usePermission();

  const toastKey = toast.show ? `${Number(toast.success)}-${toast.message}` : null;
  const showToast = toast.show && dismissedKey !== toastKey;

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
          projectId: selectedProjectId || null,
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

      // Chuyển hướng sau 1.5 giây để người dùng thấy toast
      setTimeout(() => {
        router.push(`/translations/${result.data.id}`);
        router.refresh();
      }, 1500);
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
      <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
        <div className="space-y-4">
          {/* Project Selector */}
          {!loadingProjects && projects.length > 0 && (
            <div className="flex flex-col gap-2">
              <label htmlFor="projectId" className="text-sm font-semibold text-slate-300">
                Project (tùy chọn)
              </label>
              <select
                id="projectId"
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
            <Link
              href="/translations"
              className="cursor-pointer rounded-full border border-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:border-white/40"
            >
              Hủy
            </Link>
          </div>
        </div>
      </form>

      {showToast && toast ? (
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

