import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Edit,
  Download,
  Languages,
  Sparkles,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

const highlights = [
  {
    title: "Quản lý file dịch thuật",
    description:
      "Tải lên, xem danh sách, kiểm tra metadata và theo dõi tiến trình dịch trên một bảng điều khiển thống nhất. Mỗi file đều có bộ lọc, phân trang và thống kê rõ ràng.",
    icon: FileText,
  },
  {
    title: "Bảng dịch tùy chỉnh",
    description:
      "Tạo các bảng dịch độc lập với file .po để xây dựng kho thuật ngữ riêng. Hỗ trợ CRUD đầy đủ, chia sẻ cho nhiều dự án và xuất dữ liệu bất kỳ lúc nào.",
    icon: Languages,
  },
  {
    title: "Chỉnh sửa bản dịch",
    description:
      "Modal chỉnh sửa giàu thông tin giúp bạn cập nhật msgid/msgstr, mô tả và vị trí áp dụng chỉ với vài cú click. Hỗ trợ toast trạng thái và refresh tức thời.",
    icon: Edit,
  },
  {
    title: "DeepL tích hợp sâu",
    description:
      "Nút DeepL xuất hiện trong cả modal chỉnh sửa và toolbar danh sách. Bạn có thể dịch tức thời một dòng hoặc chọn hàng loạt để AI tự điền, đồng thời theo dõi hạn mức ký tự.",
    icon: Sparkles,
  },
  {
    title: "Kiểm soát chất lượng",
    description:
      "Quy trình xác nhận xóa, cảnh báo ký tự và lịch sử thông báo giúp bạn tự tin triển khai cho team lớn. Các thao tác rủi ro đều được yêu cầu xác nhận rõ ràng.",
    icon: ShieldCheck,
  },
  {
    title: "Xuất file đa định dạng",
    description:
      "Xuất dữ liệu ra .po, CSV, Excel (.xlsx) hoặc JSON chỉ với một nút bấm. Hệ thống tự động giữ nguyên thứ tự dòng và mã hóa chuẩn UTF-8.",
    icon: Download,
  },
  {
    title: "Tìm kiếm & upload thông minh",
    description:
      "Upload nhiều file liên tiếp, tra cứu bằng từ khóa, ngôn ngữ hoặc metadata. Bộ lọc hỗ trợ cả msgid, msgstr, mô tả ngữ cảnh và references.",
    icon: UploadCloud,
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

const featureNarratives = [
  {
    heading: "DeepL + quy trình thủ công",
    body:
      "Ứng dụng kết hợp cả dịch tự động và thao tác thủ công. Bạn có thể dịch nhanh để có bản nháp, sau đó tinh chỉnh từng câu theo đúng văn phong doanh nghiệp. Giới hạn 500.000 ký tự/tháng của gói DeepL Free được hiển thị rõ ràng ngay trong giao diện để tránh lãng phí.",
  },
  {
    heading: "Một trung tâm thống nhất",
    body:
      "Từ tải file .po, quản lý bảng dịch, đến export đa định dạng đều nằm trong cùng một không gian. Mọi trang đều hỗ trợ phân trang, tìm kiếm theo ngữ cảnh và hiển thị metadata quan trọng để bạn không bỏ sót thông tin nào.",
  },
  {
    heading: "An toàn và dễ mở rộng",
    body:
      "Các thao tác nguy hiểm (xóa hàng loạt, ghi đè bản dịch) đều yêu cầu xác nhận, giúp giảm rủi ro khi làm việc nhóm. Kiến trúc Next.js + Prisma dễ dàng mở rộng thêm API hoặc tích hợp CI/CD sau này.",
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
          <p className="hero-description mx-auto max-w-3xl text-lg text-slate-300 md:text-xl">
            Từ upload file .po đến quản lý bảng dịch tùy chỉnh, mọi tính năng đều được tối ưu
            cho quy trình dịch chuyên nghiệp: DeepL tích hợp sẵn, CRUD đầy đủ, tìm kiếm nhanh
            và export đa định dạng.
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

      <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-8">
        <h3 className="text-2xl font-semibold text-white">Tại sao đội ngũ dịch thuật yêu thích?</h3>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {featureNarratives.map((item) => (
            <div key={item.heading} className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">
                {item.heading}
              </p>
              <p className="text-sm leading-relaxed text-slate-300">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
