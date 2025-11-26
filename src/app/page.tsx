import Link from "next/link";
import { ArrowRight, FileText, Search, Edit, Download, Languages } from "lucide-react";

const highlights = [
  {
    title: "Quản lý file dịch thuật",
    description:
      "Tải lên, xem danh sách và quản lý các file .po của bạn một cách dễ dàng. Tìm kiếm nhanh chóng theo tên file, ngôn ngữ hoặc metadata.",
    icon: FileText,
  },
  {
    title: "Bảng dịch tùy chỉnh",
    description:
      "Tạo và quản lý các bảng dịch riêng biệt không phụ thuộc vào file .po. Xây dựng kho dịch của riêng bạn với CRUD đầy đủ.",
    icon: Languages,
  },
  {
    title: "Chỉnh sửa bản dịch",
    description:
      "Xem và chỉnh sửa từng bản dịch trực tiếp trên giao diện. Cập nhật msgid, msgstr, ngữ cảnh và vị trí áp dụng một cách linh hoạt.",
    icon: Edit,
  },
  {
    title: "Xuất file đa định dạng",
    description:
      "Xuất dữ liệu ra nhiều định dạng khác nhau: .po, CSV, Excel (.xlsx) và JSON. Phù hợp với mọi nhu cầu làm việc của bạn.",
    icon: Download,
  },
  {
    title: "Tìm kiếm thông minh",
    description:
      "Tìm kiếm trong toàn bộ nội dung dịch: msgid, msgstr, mô tả ngữ cảnh và vị trí áp dụng. Lọc kết quả theo nhiều tiêu chí khác nhau.",
    icon: Search,
  },
];

const quickLinks = [
  {
    title: "Xem danh sách file",
    description: "Duyệt và quản lý tất cả file dịch của bạn",
    href: "/files",
  },
  {
    title: "Quản lý bảng dịch",
    description: "Tạo và quản lý các bảng dịch tùy chỉnh",
    href: "/translations",
  },
  {
    title: "Tải file mới",
    description: "Thêm file .po mới vào hệ thống",
    href: "/upload",
  },
];

export default function WelcomePage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-5xl flex-col gap-12 px-4 py-16 text-slate-100 md:px-8">
      <div className="space-y-8 text-center">
        <div className="space-y-8">
          <p className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-300">
            Hệ thống quản lý dịch thuật
          </p>
          <h1 className="text-7xl font-black leading-tight text-white md:text-6xl lg:text-7xl">
            Quản lý bản <br /> dịch chuyên nghiệp
          </h1>
          <p className="hero-description mx-auto max-w-2xl text-xl text-slate-300 md:text-2xl">
            Quản lý, chỉnh sửa và xuất file dịch thuật một cách dễ dàng và hiệu quả
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-100 hover:shadow-lg"
            >
              {link.title}
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {highlights.map((highlight) => (
          <article
            key={highlight.title}
            className="group rounded-2xl border border-white/10 bg-slate-950/40 p-6 transition-all hover:border-white/20 hover:bg-slate-950/60 hover:shadow-xl"
          >
            <div className="mb-4 inline-flex rounded-xl bg-white/5 p-3">
              <highlight.icon className="size-6 text-sky-400" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">{highlight.title}</h2>
            <p className="text-sm leading-relaxed text-slate-400">{highlight.description}</p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/60 to-slate-900/40 p-8 text-center backdrop-blur-sm">
        <h3 className="mb-4 text-2xl font-semibold text-white">Bắt đầu sử dụng</h3>
        <div className="mx-auto mt-6 max-w-2xl space-y-3 text-left text-slate-300">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
              1
            </span>
            <div>
              <p className="font-medium text-white">Tải file .po hoặc tạo bảng dịch mới</p>
              <p className="text-sm text-slate-400">
                Upload file .po từ máy tính hoặc tạo bảng dịch tùy chỉnh để bắt đầu quản lý
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
              2
            </span>
            <div>
              <p className="font-medium text-white">Xem và chỉnh sửa bản dịch</p>
              <p className="text-sm text-slate-400">
                Duyệt qua các bản dịch, thêm mới, chỉnh sửa hoặc xóa entries một cách dễ dàng
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
              3
            </span>
            <div>
              <p className="font-medium text-white">Xuất file đã chỉnh sửa</p>
              <p className="text-sm text-slate-400">
                Tải về file .po, CSV, Excel hoặc JSON với tất cả các thay đổi của bạn
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
