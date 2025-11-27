'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  Folder,
  Users,
  FileText,
  Globe,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { Role } from '@prisma/client';

interface Project {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  memberCount: number;
  translationTableCount: number;
  poFileCount: number;
  userRole: Role | null;
}

function getRoleBadgeColor(role: Role | null): string {
  switch (role) {
    case Role.ADMIN:
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case Role.REVIEWER:
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case Role.EDITOR:
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    case Role.VIEWER:
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    default:
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
}

function getRoleLabel(role: Role | null): string {
  switch (role) {
    case Role.ADMIN:
      return 'Admin';
    case Role.REVIEWER:
      return 'Reviewer';
    case Role.EDITOR:
      return 'Editor';
    case Role.VIEWER:
      return 'Viewer';
    default:
      return 'Public';
  }
}

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/projects');
      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || 'Không thể tải danh sách projects');
        return;
      }

      setProjects(result.data || []);
    } catch (err) {
      console.error('Load projects error', err);
      setError('Có lỗi xảy ra khi tải danh sách projects');
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-sky-400" />
      </div>
    );
  }

  if (error && projects.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="mt-1 text-slate-400">
            Quản lý các dự án dịch thuật của bạn
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-3 font-semibold text-white transition hover:bg-sky-600"
        >
          <Plus className="size-5" />
          Tạo project mới
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}


      {projects.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-12 text-center">
          <Folder className="mx-auto mb-4 size-12 text-slate-500" />
          <h3 className="mb-2 text-lg font-semibold text-white">
            Chưa có project nào
          </h3>
          <p className="mb-6 text-slate-400">
            Tạo project đầu tiên để bắt đầu quản lý dịch thuật
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-3 font-semibold text-white transition hover:bg-sky-600"
          >
            <Plus className="size-5" />
            Tạo project mới
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative rounded-2xl border border-white/10 bg-slate-950/40 p-6 transition-all hover:border-white/20 hover:bg-slate-950/60 hover:shadow-xl"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-sky-500/10 p-2">
                    <Folder className="size-5 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{project.name}</h3>
                    {project.isPublic ? (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400">
                        <Globe className="size-3" />
                        Public
                      </span>
                    ) : (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400">
                        <Lock className="size-3" />
                        Private
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {project.description && (
                <p className="mb-4 line-clamp-2 text-sm text-slate-400">
                  {project.description}
                </p>
              )}

              <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Users className="size-4" />
                  <span>{project.memberCount} thành viên</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="size-4" />
                  <span>{project.poFileCount} files</span>
                </div>
              </div>

              {project.userRole && (
                <div className="mb-4">
                  <span
                    className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(
                      project.userRole
                    )}`}
                  >
                    {getRoleLabel(project.userRole)}
                  </span>
                </div>
              )}

              <Link
                href={`/projects/${project.id}`}
                className="block rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-white/10"
              >
                Mở project
              </Link>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadProjects();
          }}
        />
      )}
    </div>
  );
}

function CreateProjectModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Tên project là bắt buộc');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null, isPublic }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || 'Không thể tạo project');
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Create project error', err);
      setError('Có lỗi xảy ra khi tạo project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-white">Tạo project mới</h2>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white">
              Tên project *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
              placeholder="Tên project"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
              placeholder="Mô tả project (tùy chọn)"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="size-4 rounded border-white/20 bg-white/5 text-sky-500 focus:ring-sky-500"
            />
            <label htmlFor="isPublic" className="text-sm text-white">
              Project công khai (mọi người có thể xem)
            </label>
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
                  Đang tạo...
                </>
              ) : (
                'Tạo project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

