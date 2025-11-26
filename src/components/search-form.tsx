"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState, useTransition } from "react";
import Link from "next/link";

type SearchFormProps = {
  placeholder?: string;
  basePath: string;
};

export function SearchForm({ placeholder = "Tìm kiếm...", basePath }: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchQuery = formData.get("q")?.toString().trim() || "";

    startTransition(() => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.set("q", searchQuery);
      }
      const newUrl = searchQuery ? `${basePath}?${params.toString()}` : basePath;
      router.push(newUrl);
    });
  };

  const handleClear = () => {
    setQuery("");
    startTransition(() => {
      router.push(basePath);
    });
  };

  const currentQuery = searchParams.get("q") || "";

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <label htmlFor="search" className="flex items-center gap-2 text-sm font-semibold text-slate-300">
        <Search className="size-4" />
        Tìm kiếm
      </label>
      <input
        id="search"
        name="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        disabled={isPending}
        className="w-full flex-1 rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/40 focus:outline-none disabled:opacity-60 md:w-auto"
      />
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Đang tìm..." : "Search"}
      </button>
      {currentQuery ? (
        <button
          type="button"
          onClick={handleClear}
          disabled={isPending}
          className="text-sm font-semibold text-slate-300 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          Xóa bộ lọc
        </button>
      ) : null}
    </form>
  );
}

