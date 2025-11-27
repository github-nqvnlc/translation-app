import { Metadata } from 'next';
import { requireAuthAndSystemRole } from '@/lib/middleware/rbac';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import UsersList from './users-list';

export const metadata: Metadata = {
  title: 'Quản lý Users | Translation Workspace',
  description: 'Quản lý tất cả users trong hệ thống',
};

export default async function AdminUsersPage() {
  const authResult = await requireAuthAndSystemRole(Role.ADMIN);
  if (authResult.error) {
    redirect('/login');
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <UsersList />
    </div>
  );
}

