import { getDocContent } from "@/lib/docs";
import DocsSidebar from "@/components/docs/DocsSidebar";
import MarkdownRenderer from "@/components/docs/MarkdownRenderer";

export const dynamic = "force-dynamic";

export default async function DocsPage() {
  const content = await getDocContent("");

  return (
    <div className="min-h-screen bg-slate-950/40">
      <DocsSidebar />
      <main className="ml-64">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8 py-12">
          <div className="mb-8 rounded-lg border border-white/10 bg-slate-950/60 p-6">
            <h1 className="text-3xl font-bold text-white">Tài liệu hệ thống</h1>
            <p className="mt-2 text-slate-400">
              Hướng dẫn chi tiết về cấu trúc, tính năng và cách sử dụng Translation Workspace
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-950/40 p-8">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      </main>
    </div>
  );
}

