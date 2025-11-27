import { UploadPoForm } from "@/components/po/upload-po-form";
import { requireAuth } from "@/lib/middleware/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Upload tệp .po | Translation Workspace",
};

export default async function UploadPage() {
  // Authentication check
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    redirect("/login");
  }

  // Check email verification
  if (!authResult.user?.emailVerified) {
    redirect("/verify-email");
  }
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-12 md:px-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold  text-slate-400">Upload</p>
        <h1 className="text-3xl font-semibold text-white">Phân tích tệp .po mới</h1>
        <p className="text-sm text-slate-300">
          Chọn tệp `.po`, hệ thống sẽ đọc metadata, ngôn ngữ và toàn bộ msgid/msgstr, sau đó hiển thị kết
          quả rõ ràng.
        </p>
      </header>

      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
        <UploadPoForm showInlineStatus />
      </div>
    </div>
  );
}

