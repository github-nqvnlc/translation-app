import Link from "next/link";
import { ArrowRight, FileSearch, RefreshCcw, Server } from "lucide-react";

const highlights = [
  {
    title: "Quản lý kho .po dễ dàng",
    description:
      "Upload, liệt kê, tìm kiếm và xoá các tệp dịch ngay trên Next.js App Router với Prisma 7.",
    icon: FileSearch,
  },
  {
    title: "SSR + API rõ ràng",
    description: "Mỗi trang đều là server component, đi kèm API CRUD chuẩn REST để tích hợp bên ngoài.",
    icon: Server,
  },
  {
    title: "Theo dõi metadata đầy đủ",
    description:
      "Header, language, mô tả ngữ cảnh (#.) và references (#:) đều được lưu trữ để audit chính xác.",
    icon: RefreshCcw,
  },
];

const quickLinks = [
  {
    title: "Danh sách tệp",
    description: "Xem và tìm kiếm toàn bộ file đã upload.",
    href: "/files",
  },
  {
    title: "Upload file mới",
    description: "Phân tích file .po và lưu vào database.",
    href: "/upload",
  },
];

export default function WelcomePage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-5xl flex-col gap-12 px-4 py-16 text-slate-100 md:px-8">
      <div className="space-y-6 text-center">
        <p className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-1 text-xs font-semibold text-slate-300">
          Translation Workspace
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
          Kho dịch đa ngôn ngữ dựa trên Next.js & Prisma
          </h1>
        <p className="mx-auto max-w-3xl text-lg text-slate-300">
          Từ tải tệp, tìm kiếm, xem chi tiết đến API CRUD hoàn chỉnh – tất cả đều chạy trên SSR để đảm bảo
          dữ liệu mới nhất mỗi lần truy cập.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-slate-900 transition hover:bg-slate-100"
            >
              {link.title}
              <ArrowRight className="size-4" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {highlights.map((highlight) => (
          <article
            key={highlight.title}
            className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 shadow-2xl shadow-black/20"
          >
            <highlight.icon className="size-6 text-sky-300" />
            <h2 className="mt-4 text-lg font-semibold text-white">{highlight.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{highlight.description}</p>
          </article>
        ))}
        </div>

      <div className="rounded-3xl border border-dashed border-white/15 bg-slate-950/30 p-8 text-center">
        <h3 className="text-2xl font-semibold text-white">Vào ngay khu vực thao tác</h3>
        <p className="mt-3 text-slate-300">
          - `/files`: quản lý kho tệp, filter nâng cao. <br />
          - `/upload`: tải tệp mới với thông báo rõ ràng. <br />- `/files/:id`: xem bảng dịch chi tiết, có
          search riêng.
        </p>
    </div>
    </section>
  );
}
