import { requireAuth } from '@/lib/middleware/auth';
import { redirect } from 'next/navigation';
import EditProfileForm from '@/components/settings/edit-profile-form';

export default async function SettingsProfilePage() {
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    redirect('/login');
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Cài đặt Profile</h1>
        <p className="mt-2 text-slate-400">
          Quản lý thông tin cá nhân và quyền riêng tư của bạn
        </p>
      </div>

      <EditProfileForm />
    </div>
  );
}

