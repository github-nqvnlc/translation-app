import { Metadata } from 'next';
import { requireAuth } from '@/lib/middleware/auth';
import { redirect } from 'next/navigation';
import SessionsList from './sessions-list';

export const metadata: Metadata = {
  title: 'Quản lý phiên đăng nhập | Translation Workspace',
  description: 'Xem và quản lý các phiên đăng nhập của bạn',
};

export default async function SessionsPage() {
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    redirect('/login');
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Quản lý phiên đăng nhập</h1>
        <p className="text-slate-400">
          Xem và quản lý tất cả các thiết bị đã đăng nhập vào tài khoản của bạn
        </p>
      </div>

      <SessionsList />
    </div>
  );
}

