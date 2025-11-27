import { Metadata } from 'next';
import { requireAuthAndSystemRole } from '@/lib/middleware/rbac';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import AuditLogsList from './audit-logs-list';

export const metadata: Metadata = {
  title: 'Audit Logs | Translation Workspace',
  description: 'Lịch sử các hành động trong hệ thống',
};

export default async function AdminAuditLogsPage() {
  const authResult = await requireAuthAndSystemRole(Role.ADMIN);
  if (authResult.error) {
    redirect('/login');
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <AuditLogsList />
    </div>
  );
}

