import ForgotPasswordForm from './forgot-password-form';

export const metadata = {
  title: 'Quên mật khẩu | Translation Workspace',
  description: 'Khôi phục mật khẩu của bạn',
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-16">
      <ForgotPasswordForm />
    </div>
  );
}

