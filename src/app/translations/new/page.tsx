import Link from "next/link";
import { CreateTranslationForm } from "@/components/translations/create-translation-form";
import { requireAuth } from "@/lib/middleware/auth";
import { redirect } from "next/navigation";
import { requireAuthAndPermission } from "@/lib/middleware/rbac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function NewTranslationPage() {
  // Authentication check
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    redirect("/login");
  }

  // Check email verification
  if (!authResult.user?.emailVerified) {
    redirect("/verify-email");
  }

  // Check permission (EDITOR or higher)
  const permissionResult = await requireAuthAndPermission("create_translation_tables");
  if (permissionResult.error) {
    redirect("/translations?error=insufficient_permission");
  }
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6 md:px-8">
      <div className="flex flex-col gap-2">
        <Link href="/translations" className="text-xs font-semibold text-slate-400">
          ← Danh sách bảng dịch
        </Link>
        <h1 className="text-3xl font-semibold text-white">Tạo bảng dịch mới</h1>
      </div>

      <CreateTranslationForm />
    </div>
  );
}

