import { getDocContent, docSlugs } from "@/lib/docs";
import DocsSidebar from "@/components/docs/DocsSidebar";
import MarkdownRenderer from "@/components/docs/MarkdownRenderer";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return docSlugs
    .filter((slug) => slug !== "")
    .map((slug) => ({
      slug,
    }));
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Validate slug sớm để tránh render không cần thiết
  if (!docSlugs.includes(slug)) {
    notFound();
  }

  // Tách phần fetch dữ liệu khỏi JSX để tránh JSX trong try/catch
  let content = "";
  try {
    content = await getDocContent(slug);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950/40">
      <DocsSidebar />
      <main className="ml-64">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8 py-12">
          <div className="rounded-lg border border-white/10 bg-slate-950/40 p-8">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      </main>
    </div>
  );
}
