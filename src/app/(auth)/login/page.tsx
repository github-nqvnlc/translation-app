import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginForm from './login-form';

export const metadata: Metadata = {
  title: 'Đăng nhập | Translation Workspace',
  description:
    'Đăng nhập để tiếp tục quản lý file dịch, bảng thuật ngữ và phân quyền thành viên trên Translation Workspace.',
};

export default function LoginPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-160px)] w-full max-w-5xl flex-col gap-10 px-4 py-16 text-white md:px-8">
      <div className="space-y-5 text-center">
        <p className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-1.5 text-xs font-semibold text-slate-300">
          Chào mừng trở lại
        </p>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Truy cập workspace của bạn
          </h1>
          <p className="text-base text-slate-300 md:text-lg">
            Duy trì phiên đăng nhập an toàn với token rotation, rate limiting và
            audit logs theo thời gian thực.
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-8 text-center text-slate-400">
            Đang tải biểu mẫu đăng nhập...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </section>
  );
}


