'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  Users,
  Mail,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  UserPlus,
} from 'lucide-react';
import { Role } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Member {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    emailVerified: boolean;
    createdAt: string;
  };
  role: Role;
  invitedBy: string | null;
  joinedAt: string;
  updatedAt: string;
}

function getRoleLabel(role: Role): string {
  switch (role) {
    case Role.ADMIN:
      return 'Admin';
    case Role.REVIEWER:
      return 'Reviewer';
    case Role.EDITOR:
      return 'Editor';
    case Role.VIEWER:
      return 'Viewer';
  }
}

function getRoleBadgeColor(role: Role): string {
  switch (role) {
    case Role.ADMIN:
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case Role.REVIEWER:
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case Role.EDITOR:
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    case Role.VIEWER:
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
}

export default function MembersManagement() {
  const params = useParams();
  const projectId = params.id as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (projectId) {
      loadMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadMembers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/projects/${projectId}/members`);
      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || 'Không thể tải danh sách thành viên');
        return;
      }

      setMembers(result.data || []);
    } catch (err) {
      console.error('Load members error', err);
      setError('Có lỗi xảy ra khi tải danh sách thành viên');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (memberId: string, memberEmail: string) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa thành viên "${memberEmail}" khỏi project?`
      )
    ) {
      return;
    }

    setDeletingId(memberId);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${memberId}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || 'Không thể xóa thành viên');
        return;
      }

      setSuccessMessage('Thành viên đã được xóa thành công');
      await loadMembers();
    } catch (err) {
      console.error('Delete member error', err);
      setError('Có lỗi xảy ra khi xóa thành viên');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-sky-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/projects/${projectId}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Quay lại project
          </Link>
          <h1 className="text-3xl font-bold text-white">Quản lý thành viên</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-3 font-semibold text-white transition hover:bg-sky-600"
        >
          <UserPlus className="size-5" />
          Thêm thành viên
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {members.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-12 text-center">
          <Users className="mx-auto mb-4 size-12 text-slate-500" />
          <h3 className="mb-2 text-lg font-semibold text-white">
            Chưa có thành viên nào
          </h3>
          <p className="mb-6 text-slate-400">
            Thêm thành viên đầu tiên vào project
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-3 font-semibold text-white transition hover:bg-sky-600"
          >
            <UserPlus className="size-5" />
            Thêm thành viên
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 p-4"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="size-12 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-semibold text-lg">
                  {member.user.name?.[0]?.toUpperCase() ||
                    member.user.email[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">
                      {member.user.name || member.user.email}
                    </p>
                    {member.user.emailVerified && (
                      <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-300">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{member.user.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Tham gia: {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${getRoleBadgeColor(
                    member.role
                  )}`}
                >
                  {getRoleLabel(member.role)}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setEditingMember(member)}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <Edit className="size-4" />
                </button>
                <button
                  onClick={() => handleDelete(member.id, member.user.email)}
                  disabled={deletingId === member.id}
                  className="rounded-lg border border-red-500/30 bg-red-950/20 p-2 text-red-300 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === member.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadMembers();
          }}
        />
      )}

      {editingMember && (
        <EditMemberModal
          projectId={projectId}
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSuccess={() => {
            setEditingMember(null);
            loadMembers();
          }}
        />
      )}
    </div>
  );
}

function AddMemberModal({
  projectId,
  onClose,
  onSuccess,
}: {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(Role.VIEWER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email là bắt buộc');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || 'Không thể thêm thành viên');
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Add member error', err);
      setError('Có lỗi xảy ra khi thêm thành viên');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-white">Thêm thành viên</h2>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white">
              Email *
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-11 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                placeholder="user@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white">
              Vai trò *
            </label>
            <Select value={role} onValueChange={(value) => setRole(value as Role)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.VIEWER}>Viewer</SelectItem>
                <SelectItem value={Role.EDITOR}>Editor</SelectItem>
                <SelectItem value={Role.REVIEWER}>Reviewer</SelectItem>
                <SelectItem value={Role.ADMIN}>Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white transition hover:bg-white/10"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 inline-block size-4 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                'Thêm thành viên'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditMemberModal({
  projectId,
  member,
  onClose,
  onSuccess,
}: {
  projectId: string;
  member: Member;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [role, setRole] = useState<Role>(member.role);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${member.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || 'Không thể cập nhật vai trò');
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Update member role error', err);
      setError('Có lỗi xảy ra khi cập nhật vai trò');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-white">
          Chỉnh sửa vai trò
        </h2>
        <p className="mb-4 text-sm text-slate-400">
          {member.user.name || member.user.email}
        </p>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white">
              Vai trò *
            </label>
            <Select value={role} onValueChange={(value) => setRole(value as Role)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.VIEWER}>Viewer</SelectItem>
                <SelectItem value={Role.EDITOR}>Editor</SelectItem>
                <SelectItem value={Role.REVIEWER}>Reviewer</SelectItem>
                <SelectItem value={Role.ADMIN}>Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white transition hover:bg-white/10"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 inline-block size-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                'Cập nhật'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

