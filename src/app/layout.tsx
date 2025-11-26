import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Translation Workspace",
  description:
    "Next.js SSR demo that showcases Prisma, Tailwind CSS 4, and lucide-react icons for translation tracking.",
};

const navLinks = [
  { href: "/", label: "Welcome" },
  { href: "/files", label: "Danh sách tệp" },
  { href: "/upload", label: "Upload tệp" },
  { href: "/translations", label: "Bảng dịch" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
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
        </div>
      </body>
    </html>
  );
}
