'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  } | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function AuditLogsList() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    userId: '',
    resourceType: '',
    action: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const loadLogs = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (filters.userId) {
        params.append('userId', filters.userId);
      }
      if (filters.resourceType) {
        params.append('resourceType', filters.resourceType);
      }
      if (filters.action) {
        params.append('action', filters.action);
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || 'Không thể tải audit logs');
        return;
      }

      setLogs(result.data || []);
      setPagination(result.pagination || pagination);
    } catch (err) {
      console.error('Load audit logs error', err);
      setError('Có lỗi xảy ra khi tải audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    loadLogs();
  };

  const handleResetFilters = () => {
    setFilters({
      userId: '',
      resourceType: '',
      action: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
  };

  useEffect(() => {
    if (showFilters) {
      loadLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, showFilters]);

  const getActionLabel = (action: string): string => {
    const actionMap: Record<string, string> = {
      project_created: 'Tạo project',
      project_updated: 'Cập nhật project',
      project_deleted: 'Xóa project',
      member_added: 'Thêm thành viên',
      member_removed: 'Xóa thành viên',
      member_role_updated: 'Cập nhật role thành viên',
      system_role_granted: 'Cấp system role',
      system_role_revoked: 'Thu hồi system role',
      email_verified: 'Xác minh email',
      password_changed: 'Đổi mật khẩu',
      password_reset: 'Reset mật khẩu',
      password_reset_requested: 'Yêu cầu reset mật khẩu',
      session_revoked: 'Thu hồi session',
    };
    return actionMap[action] || action;
  };

  const getResourceTypeLabel = (resourceType: string): string => {
    const typeMap: Record<string, string> = {
      user: 'User',
      project: 'Project',
      project_member: 'Thành viên',
      session: 'Session',
    };
    return typeMap[resourceType] || resourceType;
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-sky-400" />
      </div>
    );
  }

  if (error && logs.length === 0) {
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
          <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
          <p className="mt-1 text-slate-400">
            Lịch sử các hành động trong hệ thống
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 font-medium text-white transition hover:bg-white/10"
        >
          <Filter className="size-4" />
          {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/40 p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white">
                User ID
              </label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) =>
                  setFilters({ ...filters, userId: e.target.value })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                placeholder="Filter theo user ID"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white">
                Resource Type
              </label>
              <select
                value={filters.resourceType}
                onChange={(e) =>
                  setFilters({ ...filters, resourceType: e.target.value })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-sky-400 focus:outline-none"
              >
                <option value="">Tất cả</option>
                <option value="user">User</option>
                <option value="project">Project</option>
                <option value="project_member">Thành viên</option>
                <option value="session">Session</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white">
                Action
              </label>
              <input
                type="text"
                value={filters.action}
                onChange={(e) =>
                  setFilters({ ...filters, action: e.target.value })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                placeholder="Filter theo action"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white">
                Từ ngày
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-sky-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white">
                Đến ngày
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleApplyFilters}
              className="rounded-2xl bg-sky-500 px-6 py-2.5 font-semibold text-white transition hover:bg-sky-600"
            >
              Áp dụng bộ lọc
            </button>
            <button
              onClick={handleResetFilters}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 font-medium text-white transition hover:bg-white/10"
            >
              Đặt lại
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Thời gian
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                User
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Action
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Resource
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                IP Address
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  Không có audit log nào
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-white/5 transition hover:bg-white/5"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="size-4" />
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {log.user ? (
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-semibold text-xs">
                          {log.user.name?.[0]?.toUpperCase() ||
                            log.user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {log.user.name || 'No name'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {log.user.email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">System</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-sky-500/20 px-2.5 py-1 text-xs font-medium text-sky-300">
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-white">
                        {getResourceTypeLabel(log.resourceType)}
                      </p>
                      {log.resourceId && (
                        <p className="text-xs text-slate-400">
                          ID: {log.resourceId.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {log.ipAddress || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Hiển thị {((page - 1) * pagination.limit) + 1} -{' '}
            {Math.min(page * pagination.limit, pagination.total)} trong tổng số{' '}
            {pagination.total} logs
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!pagination.hasPrevPage}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-4 py-2 text-sm text-slate-400">
              Trang {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasNextPage}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

