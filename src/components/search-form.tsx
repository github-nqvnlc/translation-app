"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState, useTransition } from "react";

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
    <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 p-2">
      <div className="flex flex-1 items-center gap-2">
        <Search className="ml-2 h-4 w-4 flex-shrink-0 text-slate-400" />
        <input
          id="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={isPending}
          className="w-full flex-1 bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-60"
        />
      </div>
      {currentQuery && (
        <button
          type="button"
          onClick={handleClear}
          disabled={isPending}
          className="flex-shrink-0 rounded px-2 py-1 text-xs text-slate-400 transition hover:text-white disabled:opacity-60"
        >
          ✕
        </button>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="flex-shrink-0 rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "..." : "Tìm"}
      </button>
    </form>
  );
}

