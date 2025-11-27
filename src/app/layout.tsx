import type { Metadata } from "next";
import Link from "next/link";
import { Toaster } from "sonner";
import "./globals.css";
import Navbar from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "Translation Workspace",
  description: "Quản lý bản dịch chuyên nghiệp với AI Gemini + DeepL, Next.js 16 và Prisma.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="en">
      <body className="antialiased">
        <Toaster position="top-right" richColors />
        <div className="flex min-h-screen flex-col bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/10 bg-slate-950/80">
            <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-slate-300">
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-400">
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
              <p className="text-xs text-slate-500">
                © {currentYear} Nguyễn Văn Lộc · Windify
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
