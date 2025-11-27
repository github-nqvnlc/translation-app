import VerifyEmailForm from './verify-email-form';

export const metadata = {
  title: 'Xác minh email | Translation Workspace',
  description: 'Xác minh địa chỉ email của bạn',
};

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-16">
      <VerifyEmailForm />
    </div>
  );
}

