"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Database, Rocket, Code2, Home } from "lucide-react";

export interface DocItem {
  slug: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const docItems: DocItem[] = [
  {
    slug: "gioi-thieu",
    title: "Giới thiệu",
    icon: Home,
  },
  {
    slug: "tong-quan",
    title: "Tổng quan",
    icon: Code2,
  },
  {
    slug: "setup",
    title: "Setup & Clone",
    icon: Rocket,
  },
  {
    slug: "database",
    title: "Database",
    icon: Database,
  },
  {
    slug: "api",
    title: "API",
    icon: Code2,
  },
  {
    slug: "huong-dan-su-dung",
    title: "Hướng dẫn sử dụng",
    icon: BookOpen,
  },
  {
    slug: "tinh-nang-sap-ra-mat",
    title: "Sắp ra mắt",
    icon: Rocket,
  },
  {
    slug: "loi-cam-on",
    title: "Lời cảm ơn",
    icon: BookOpen,
  },
];

export default function DocsSidebar() {
  const pathname = usePathname();
  const currentSlug = pathname.replace("/docs", "").replace("/", "") || "";

  return (
    <aside className="fixed left-0 top-[64px] h-[calc(100vh-64px)] w-64 overflow-y-auto border-r border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="p-6">
        <Link
          href="/docs"
          className="mb-8 flex items-center gap-2 text-lg font-semibold text-white transition hover:text-sky-400"
        >
          <BookOpen className="size-5" />
          <span>Tài liệu</span>
        </Link>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Nội dung
        </p>
        <nav className="space-y-1">
          {docItems.map((item) => {
            const isActive = currentSlug === item.slug;
            const Icon = item.icon;
            return (
              <Link
                key={item.slug}
                href={item.slug ? `/docs/${item.slug}` : "/docs"}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`size-4 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

