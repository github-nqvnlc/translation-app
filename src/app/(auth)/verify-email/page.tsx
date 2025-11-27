import { Suspense } from 'react';
import VerifyEmailForm from './verify-email-form';

export const metadata = {
  title: 'Xác minh email | Translation Workspace',
  description: 'Xác minh địa chỉ email của bạn',
};

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-16">
      <Suspense
        fallback={
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 px-8 py-6 text-center text-slate-400">
            Đang tải biểu mẫu xác minh email...
          </div>
        }
      >
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}

