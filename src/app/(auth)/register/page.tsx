import type { Metadata } from 'next';
import RegisterForm from './register-form';

export const metadata: Metadata = {
  title: 'Đăng ký tài khoản | Translation Workspace',
  description:
    'Tạo tài khoản mới để quản lý dự án dịch thuật, phân quyền thành viên và theo dõi tiến trình trên Translation Workspace.',
};

export default function RegisterPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-160px)] w-full max-w-4xl flex-col gap-10 px-4 py-16 text-white md:px-8">
      <div className="space-y-5 text-center">
        <p className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-1.5 text-xs font-semibold text-slate-300">
          Đăng ký tài khoản mới
        </p>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Sẵn sàng chuẩn hóa quy trình dịch?
          </h1>
          <p className="text-base text-slate-300 md:text-lg">
            Chỉ vài bước để bạn khởi tạo workspace riêng, mời thành viên và bắt
            đầu quản lý file .po, bảng dịch cũng như phân quyền truy cập an toàn.
          </p>
        </div>
      </div>

      <RegisterForm />
    </section>
  );
}


