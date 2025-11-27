import { requireAuth } from '@/lib/middleware/auth';
import { redirect } from 'next/navigation';
import ProjectDetail from './project-detail';

export default async function ProjectDetailPage() {
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    redirect('/login');
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <ProjectDetail />
    </div>
  );
}

