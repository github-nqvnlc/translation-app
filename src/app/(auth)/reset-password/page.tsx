import ResetPasswordForm from './reset-password-form';

export const metadata = {
  title: 'Đặt lại mật khẩu | Translation Workspace',
  description: 'Đặt lại mật khẩu của bạn',
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-16">
      <ResetPasswordForm />
    </div>
  );
}

