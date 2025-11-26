import Image from "next/image";
import Link from "next/link";

// const heroStats = [
//   { value: "7+ năm", label: "Xây dựng sản phẩm số" },
//   { value: "3 hệ thống", label: "Dịch thuật vận hành thực tế" },
//   { value: "AI + UX", label: "Định hướng chủ đạo" },
// ];

const expertise = [
  "Next JS App Router",
  "Prisma ORM & SQLite/Postgres",
  "DeepL & Gemini Automation",
];

// const initiatives = [
//   {
//     title: "Translation Workspace",
//     detail: "Kho dịch .po và bảng thuật ngữ hợp nhất trong một nền tảng Next.js duy nhất.",
//   },
//   {
//     title: "Trợ lý AI nội bộ",
//     detail: "Kết hợp DeepL và Gemini để tự động hóa bản nháp, giảm nửa thời gian nhập liệu.",
//   },
//   {
//     title: "Art-driven UX",
//     detail: "Ngôn ngữ thiết kế giàu cảm xúc nhưng ưu tiên thao tác nhanh cho team dịch.",
//   },
// ];

const collaborationModes = [
  {
    label: "Tư vấn nhanh",
    description:
      "Đánh giá hiện trạng hệ thống dịch thuật, đề xuất roadmap triển khai Translation Workspace.",
  },
  {
    label: "Đồng hành dài hạn",
    description:
      "Trở thành extension team của Translation Workspace để xây dựng và bảo trì nền tảng ngôn ngữ riêng.",
  },
  {
    label: "Tài trợ & cộng tác",
    description: "Nhận hỗ trợ từ cộng đồng để mở rộng feature, tích hợp API mới hoặc cải tiến UX.",
  },
];

const contactLinks = [
  { label: "GitHub", href: "https://github.com/github-nqvnlc/translation-app" },
  { label: "Website", href: "http://locnv.vercel.app" },
  { label: "GitHub Sponsors", href: "https://github.com/sponsors/github-nqvnlc" },
];

export default function AboutPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5 rounded-3xl border border-white/15 bg-linear-to-br from-slate-900/80 via-slate-950 to-slate-950/90 p-6">
          <p className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold text-slate-300">
            Người đứng sau Translation Workspace
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-3xl border border-white/20 md:h-28 md:w-28">
                <Image
                  src="https://avatars.githubusercontent.com/github-nqvnlc"
                  alt="Nguyễn Văn Lộc"
                  fill
                  sizes="112px"
                  className="object-cover"
                  priority
                />
              </div>
              <h1 className="text-4xl font-black text-white md:text-5xl">Nguyễn Văn Lộc</h1>
            </div>
            <p className="text-base text-slate-200 md:text-lg">
              Fullstack Developer & Digital Artist tại Windify. <br /> Tôi thiết kế các giải pháp dịch thuật dựa trên UX hiện
              đại, dữ liệu chuẩn hóa và tự động hóa AI để đội ngũ nội bộ luôn kiểm soát được chất lượng bản dịch.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="https://github.com/github-nqvnlc/translation-app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Xem GitHub
            </Link>
            <Link
              href="https://github.com/sponsors/github-nqvnlc"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5"
            >
              Ủng hộ dự án
            </Link>
          </div>
          {/* <div className="grid gap-3 md:grid-cols-3">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xl font-semibold text-white">{stat.value}</p>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div> */}
        </div>

        <div className="space-y-5 rounded-3xl border border-white/10 bg-slate-950/70 p-6">
          <div>
            <p className="text-sm tracking-wide text-slate-400 uppercase">Công nghệ chính</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {expertise.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 px-4 py-1 text-sm text-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <p className="text-sm tracking-wide text-slate-400 uppercase">Liên hệ nhanh</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li>Windify · Đà Nẵng, Việt Nam</li>
              <li>
                <span className="text-slate-400">Email:</span>{" "}
                <Link href="mailto:locnv14@gmail.com" className="text-white hover:text-sky-300">
                  locnv14@gmail.com
                </Link>
              </li>
              <li className="flex flex-wrap gap-2">
                <span className="text-slate-400">Điện thoại:</span>
                <span className="flex flex-wrap gap-2">
                  <Link href="tel:+84866332671" className="text-white hover:text-sky-300">
                    +84 866 332 671
                  </Link>
                  <span>/</span>
                  <Link href="tel:+84582070987" className="text-white hover:text-sky-300">
                    +84 582 070 987
                  </Link>
                </span>
              </li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              {contactLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-white/15 px-4 py-1.5 text-sm text-white transition hover:border-white/40"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* <section className="mt-8 grid gap-4 lg:grid-cols-3">
        {initiatives.map((card) => (
          <article key={card.title} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <h3 className="text-lg font-semibold text-white">{card.title}</h3>
            <p className="mt-3 text-sm text-slate-300">{card.detail}</p>
          </article>
        ))}
      </section> */}

      <section className="mt-8 rounded-3xl border border-white/10 bg-linear-to-br from-slate-900 via-slate-950 to-black p-6">
        <h2 className="text-xl font-semibold text-white">Hợp tác thế nào?</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {collaborationModes.map((mode) => (
            <div key={mode.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold tracking-wide text-sky-300 uppercase">
                {mode.label}
              </p>
              <p className="mt-2 text-sm text-slate-200">{mode.description}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
