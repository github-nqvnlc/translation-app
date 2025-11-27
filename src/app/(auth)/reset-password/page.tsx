import { Suspense } from 'react';
import ResetPasswordForm from './reset-password-form';

export const metadata = {
  title: 'Đặt lại mật khẩu | Translation Workspace',
  description: 'Đặt lại mật khẩu của bạn',
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-16">
      <Suspense
        fallback={
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 px-8 py-6 text-center text-slate-400">
            Đang tải biểu mẫu đặt lại mật khẩu...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

