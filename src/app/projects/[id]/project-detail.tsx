'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  Settings,
  Users,
  FileText,
  Globe,
  Lock,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { Role } from '@prisma/client';
import { TranslationTablesTab } from './translation-tables-tab';
import { PoFilesTab } from './po-files-tab';
import { OverviewTab, OverviewSettings } from './overview-tab';

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
  members: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
    };
    role: Role;
    joinedAt: string;
  }>;
  overviewSettings: OverviewSettings;
}

type Tab = 'overview' | 'members' | 'translation-tables' | 'po-files' | 'settings';

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const defaultOverviewSettings: OverviewSettings = {
    showSummaryCards: true,
    showCompletionCard: true,
    showLanguageChart: true,
    showRecentUpdates: true,
    showTranslatorLeaderboard: true,
    showTranslatorTimeline: true,
  };
  const [overviewSettings, setOverviewSettings] = useState<OverviewSettings>(
    defaultOverviewSettings,
  );

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadProject = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError('Project không tồn tại');
        } else if (response.status === 403) {
          setError('Bạn không có quyền truy cập project này');
        } else {
          setError(result?.error || 'Không thể tải thông tin project');
        }
        return;
      }

      const overviewResponse =
        result.data.overviewSettings ?? defaultOverviewSettings;
      const settings: OverviewSettings = {
        showSummaryCards: overviewResponse.showSummaryCards ?? true,
        showCompletionCard: overviewResponse.showCompletionCard ?? true,
        showLanguageChart: overviewResponse.showLanguageChart ?? true,
        showRecentUpdates: overviewResponse.showRecentUpdates ?? true,
        showTranslatorLeaderboard:
          overviewResponse.showTranslatorLeaderboard ?? true,
        showTranslatorTimeline:
          overviewResponse.showTranslatorTimeline ?? true,
      };
      setProject({ ...result.data, overviewSettings: settings });
      setOverviewSettings(settings);
    } catch (err) {
      console.error('Load project error', err);
      setError('Có lỗi xảy ra khi tải thông tin project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    setIsDeleting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || 'Không thể xóa project');
        return;
      }

      setSuccessMessage('Project đã được xóa thành công');
      setTimeout(() => {
        router.push('/projects');
      }, 1000);
    } catch (err) {
      console.error('Delete project error', err);
      setError('Có lỗi xảy ra khi xóa project');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-sky-400" />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="space-y-4">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách
        </Link>
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const canEdit = project.userRole === Role.ADMIN;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Link
            href="/projects"
            className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Quay lại danh sách
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            {project.isPublic ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-300">
                <Globe className="size-3" />
                Public
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/30 bg-slate-500/20 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                <Lock className="size-3" />
                Private
              </span>
            )}
          </div>
          {project.description && (
            <p className="mt-2 text-slate-400">{project.description}</p>
          )}
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <Edit className="size-4" />
              Chỉnh sửa
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-950/40"
            >
              <Trash2 className="size-4" />
              Xóa
            </button>
          </div>
        )}
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

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="-mb-px flex gap-4">
          {[
            { id: 'overview' as Tab, label: 'Tổng quan', icon: FileText },
            { id: 'members' as Tab, label: 'Thành viên', icon: Users },
            { id: 'translation-tables' as Tab, label: 'Translation Tables', icon: FileText },
            { id: 'po-files' as Tab, label: 'PO Files', icon: FileText },
            { id: 'settings' as Tab, label: 'Cài đặt', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <OverviewTab projectId={projectId} settings={overviewSettings} />
        )}

        {activeTab === 'members' && (
          <MembersTab projectId={projectId} members={project.members} />
        )}

        {activeTab === 'translation-tables' && (
          <TranslationTablesTab projectId={projectId} userRole={project.userRole} />
        )}

        {activeTab === 'po-files' && (
          <PoFilesTab projectId={projectId} userRole={project.userRole} />
        )}

        {activeTab === 'settings' && canEdit && (
          <SettingsTab
            projectId={projectId}
            settings={overviewSettings}
            onSettingsChange={setOverviewSettings}
          />
        )}

        {activeTab === 'settings' && !canEdit && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-8 text-center">
            <p className="text-slate-400">
              Bạn cần quyền ADMIN để chỉnh sửa cài đặt project
            </p>
          </div>
        )}
      </div>

      {showEditModal && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            loadProject();
          }}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          projectName={project.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}

function MembersTab({
  projectId,
  members,
}: {
  projectId: string;
  members: Project['members'];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Thành viên</h2>
        <Link
          href={`/projects/${projectId}/members`}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Quản lý thành viên
        </Link>
      </div>
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-semibold">
                {member.user.name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-white">
                  {member.user.name || member.user.email}
                </p>
                <p className="text-sm text-slate-400">{member.user.email}</p>
              </div>
            </div>
            <span className="rounded-full border border-sky-500/30 bg-sky-500/20 px-2.5 py-0.5 text-xs font-medium text-sky-300">
              {member.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab({
  projectId,
  settings,
  onSettingsChange,
}: {
  projectId: string;
  settings: OverviewSettings;
  onSettingsChange: (settings: OverviewSettings) => void;
}) {
  const [localSettings, setLocalSettings] =
    useState<OverviewSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleToggle = (key: keyof OverviewSettings) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`/api/projects/${projectId}/overview-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localSettings),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Không thể lưu cài đặt');
      }

      onSettingsChange(result.data);
      setMessage('Đã lưu cài đặt hiển thị dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể lưu cài đặt',
      );
    } finally {
      setSaving(false);
    }
  };

  const toggles: Array<{
    key: keyof OverviewSettings;
    title: string;
    description: string;
  }> = [
    {
      key: 'showSummaryCards',
      title: 'Thẻ tổng quan',
      description: 'Hiển thị số lượng thành viên, bảng dịch và PO files.',
    },
    {
      key: 'showCompletionCard',
      title: 'Tiến độ dịch',
      description: 'Hiển thị tỉ lệ entries đã được dịch.',
    },
    {
      key: 'showLanguageChart',
      title: 'Biểu đồ ngôn ngữ',
      description: 'Phân bố ngôn ngữ giữa các bảng dịch và PO files.',
    },
    {
      key: 'showRecentUpdates',
      title: 'Hoạt động gần đây',
      description: 'Danh sách cập nhật mới nhất của project.',
    },
    {
      key: 'showTranslatorLeaderboard',
      title: 'Biểu đồ người dịch',
      description: 'Hiển thị top người đóng góp trong project.',
    },
    {
      key: 'showTranslatorTimeline',
      title: 'Hoạt động theo thời gian',
      description: 'Biểu đồ đường theo dõi từng người dịch theo ngày.',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Cài đặt dashboard</h2>
        <p className="text-sm text-slate-400">
          Chọn những widget sẽ hiển thị trong tab Tổng quan.
        </p>
      </div>

      {(error || message) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            error
              ? 'border-red-500/30 bg-red-950/40 text-red-200'
              : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-100'
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {toggles.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => handleToggle(item.key)}
            className={`flex flex-col rounded-2xl border px-4 py-4 text-left transition ${
              localSettings[item.key]
                ? 'border-sky-500/40 bg-sky-500/10 text-white'
                : 'border-white/10 bg-slate-950/40 text-slate-300 hover:border-white/30'
            }`}
          >
            <span className="text-sm font-semibold">{item.title}</span>
            <span className="mt-1 text-xs text-slate-400">{item.description}</span>
            <span className="mt-3 text-xs font-medium">
              {localSettings[item.key] ? 'Đang hiển thị' : 'Đang ẩn'}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          Lưu cài đặt
        </button>
      </div>
    </div>
  );
}

function EditProjectModal({
  project,
  onClose,
  onSuccess,
}: {
  project: Project;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [isPublic, setIsPublic] = useState(project.isPublic);
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
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isPublic,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || 'Không thể cập nhật project');
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Update project error', err);
      setError('Có lỗi xảy ra khi cập nhật project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-white">Chỉnh sửa project</h2>

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
              Project công khai
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

function DeleteConfirmModal({
  projectName,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-slate-950 p-6 shadow-xl">
        <h2 className="mb-2 text-xl font-bold text-white">Xác nhận xóa project</h2>
        <p className="mb-6 text-slate-400">
          Bạn có chắc chắn muốn xóa project <strong className="text-white">&quot;{projectName}&quot;</strong>? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan (files, translation tables, members).
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-2xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 inline-block size-4 animate-spin" />
                Đang xóa...
              </>
            ) : (
              'Xóa project'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

