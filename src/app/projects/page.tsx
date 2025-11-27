import { Metadata } from 'next';
import { requireAuth } from '@/lib/middleware/auth';
import { redirect } from 'next/navigation';
import ProjectsList from './projects-list';

export const metadata: Metadata = {
  title: 'Projects | Translation Workspace',
  description: 'Quản lý các dự án dịch thuật của bạn',
};

export default async function ProjectsPage() {
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    redirect('/login');
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <ProjectsList />
    </div>
  );
}

