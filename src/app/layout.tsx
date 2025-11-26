import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Translation Workspace",
  description: "Quản lý bản dịch chuyên nghiệp với AI Gemini + DeepL, Next.js 16 và Prisma.",
};

const navLinks = [
  { href: "/", label: "Welcome" },
  { href: "/files", label: "Danh sách tệp" },
  { href: "/upload", label: "Upload tệp" },
  { href: "/translations", label: "Bảng dịch" },
  { href: "/about", label: "Về tác giả" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
            <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 md:px-8">
              <Link href="/" className="text-lg font-semibold tracking-wide text-white">
                Translation Workspace
              </Link>
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-transparent px-4 py-1.5 text-slate-200 transition hover:border-white/30 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>
          </header>
          <main>{children}</main>
          <footer className="border-t border-white/10 bg-slate-950/80">
            <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-1 px-4 py-4 text-sm text-slate-300 md:items-end md:px-8">
              <p className="text-2xl font-semibold text-white">Translation Workspace</p>
              <div className="flex flex-wrap items-center gap-3 text-md text-slate-400">
                <Link
                  href="https://github.com/github-nqvnlc"
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-white"
                >
                  GitHub
                </Link>
                <Link
                  href="http://locnv.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-white"
                >
                  Website
                </Link>
                <Link
                  href="https://github.com/sponsors/github-nqvnlc"
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-white"
                >
                  Sponsor
                </Link>
              </div>
              <p className="text-[11px] text-slate-500">
                © {currentYear} Nguyễn Văn Lộc · Windify
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
