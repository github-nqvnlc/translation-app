"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Compass,
  Home,
  LifeBuoy,
  Search,
} from "lucide-react";
import { useMemo } from "react";

const quickLinks = [
  {
    title: "Trở về trang chủ",
    description: "Khám phá tổng quan dự án và các bảng dịch mới nhất.",
    href: "/",
    icon: Home,
  },
  {
    title: "Tìm kiếm dự án",
    description: "Đi thẳng tới khu vực quản lý dự án và tài nguyên.",
    href: "/projects",
    icon: Compass,
  },
  {
    title: "Hồ sơ cá nhân",
    description: "Cập nhật avatar, quyền riêng tư và hoạt động gần đây.",
    href: "/settings/profile",
    icon: Search,
  },
];

export default function NotFound() {
  const router = useRouter();

  const suggestions = useMemo(
    () => [
      "Kiểm tra lại đường dẫn hoặc slug bạn vừa nhập.",
      "Nếu bạn vừa xóa tài nguyên, hãy làm mới trang danh sách.",
      "Liên hệ admin nếu bạn cho rằng đây là lỗi hệ thống.",
    ],
    [],
  );

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-6 py-20 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_45%),_radial-gradient(circle_at_bottom,_rgba(15,118,110,0.2),_transparent_45%)]" />
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-10 rounded-3xl border border-white/5 bg-white/5/10 p-10 shadow-2xl backdrop-blur-lg">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="rounded-full border border-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-sky-300">
            404
          </span>
          <h1 className="text-4xl font-semibold md:text-5xl">
            Ôi! Trang này đã lạc mất rồi
          </h1>
          <p className="max-w-2xl text-base text-slate-300 md:text-lg">
            Có vẻ liên kết bạn truy cập không còn tồn tại hoặc đã được di chuyển. Đừng lo,
            bạn vẫn có thể tiếp tục công việc dịch thuật của mình ở những đường dẫn bên dưới.
          </p>
        </div>

        <div className="grid w-full gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-sm text-slate-300 md:grid-cols-3">
          {quickLinks.map(({ title, description, href, icon: Icon }) => (
            <Link
              key={title}
              href={href}
              className="group flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/5/40 p-4 transition hover:border-sky-400/50 hover:bg-sky-500/10"
            >
              <div className="flex items-center gap-2 text-white">
                <Icon className="size-4 text-sky-300" />
                <span className="font-semibold">{title}</span>
              </div>
              <p className="text-xs text-slate-400 group-hover:text-slate-200">
                {description}
              </p>
            </Link>
          ))}
        </div>

        <div className="w-full rounded-2xl border border-white/10 bg-slate-950/60 p-6">
          <div className="flex items-center gap-3 text-slate-200">
            <LifeBuoy className="size-5 text-sky-300" />
            <p className="text-sm font-semibold">Gợi ý nhanh</p>
          </div>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-400">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5 sm:w-auto"
          >
            <ArrowLeft className="size-4" />
            Quay lại trang trước
          </button>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 sm:w-auto"
          >
            <Home className="size-4" />
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}

