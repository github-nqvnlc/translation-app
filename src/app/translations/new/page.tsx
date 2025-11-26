import Link from "next/link";
import { CreateTranslationForm } from "@/components/translations/create-translation-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function NewTranslationPage() {
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

