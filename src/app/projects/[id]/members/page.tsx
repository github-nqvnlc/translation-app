import { Metadata } from 'next';
import { requireAuth } from '@/lib/middleware/auth';
import { redirect } from 'next/navigation';
import MembersManagement from './members-management';

export const metadata: Metadata = {
  title: 'Quản lý thành viên | Translation Workspace',
  description: 'Quản lý thành viên của project',
};

export default async function MembersPage() {
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    redirect('/login');
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <MembersManagement />
    </div>
  );
}

