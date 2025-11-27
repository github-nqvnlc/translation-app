'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Search,
  Shield,
  ShieldOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Role } from '@prisma/client';

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  systemRole: Role | null;
  projectCount: number;
  activeSessionCount: number;
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [grantingRole, setGrantingRole] = useState<string | null>(null);
  const [revokingRole, setRevokingRole] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, emailVerifiedFilter]);

  const loadUsers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search.trim()) {
        params.append('search', search.trim());
      }

      if (emailVerifiedFilter) {
        params.append('emailVerified', emailVerifiedFilter);
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setError('Bạn không có quyền truy cập trang này');
        } else {
          setError(result?.error || 'Không thể tải danh sách users');
        }
        return;
      }

      setUsers(result.data || []);
      setPagination(result.pagination || pagination);
    } catch (err) {
      console.error('Load users error', err);
      setError('Có lỗi xảy ra khi tải danh sách users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadUsers();
  };

  const handleGrantSystemRole = async (userId: string) => {
    setGrantingRole(userId);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/admin/users/${userId}/system-role`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || 'Không thể cấp system role');
        return;
      }

      setSuccessMessage('System role đã được cấp thành công');
      await loadUsers();
    } catch (err) {
      console.error('Grant system role error', err);
      setError('Có lỗi xảy ra khi cấp system role');
    } finally {
      setGrantingRole(null);
    }
  };

  const handleRevokeSystemRole = async (userId: string) => {
    if (
      !confirm(
        'Bạn có chắc chắn muốn thu hồi system role? User này sẽ mất quyền ADMIN.'
      )
    ) {
      return;
    }

    setRevokingRole(userId);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/admin/users/${userId}/system-role`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || 'Không thể thu hồi system role');
        return;
      }

      setSuccessMessage('System role đã được thu hồi thành công');
      await loadUsers();
    } catch (err) {
      console.error('Revoke system role error', err);
      setError('Có lỗi xảy ra khi thu hồi system role');
    } finally {
      setRevokingRole(null);
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-sky-400" />
      </div>
    );
  }

  if (error && users.length === 0) {
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
          <h1 className="text-3xl font-bold text-white">Quản lý Users</h1>
          <p className="mt-1 text-slate-400">
            Quản lý tất cả users trong hệ thống
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            placeholder="Tìm kiếm theo email hoặc tên..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-11 py-2.5 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
          />
        </div>
        <select
          value={emailVerifiedFilter}
          onChange={(e) => {
            setEmailVerifiedFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-sky-400 focus:outline-none"
        >
          <option value="">Tất cả email</option>
          <option value="true">Đã xác minh</option>
          <option value="false">Chưa xác minh</option>
        </select>
        <button
          onClick={handleSearch}
          className="rounded-2xl bg-sky-500 px-6 py-2.5 font-semibold text-white transition hover:bg-sky-600"
        >
          Tìm kiếm
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

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                User
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Email Verified
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                System Role
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Projects
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Sessions
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Last Login
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-white/5 transition hover:bg-white/5"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-semibold">
                      {user.name?.[0]?.toUpperCase() ||
                        user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {user.name || 'No name'}
                      </p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.emailVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300">
                      <CheckCircle2 className="size-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-300">
                      <XCircle className="size-3" />
                      Unverified
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {user.systemRole ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2.5 py-1 text-xs font-medium text-purple-300">
                      <Shield className="size-3" />
                      {user.systemRole}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {user.projectCount}
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {user.activeSessionCount}
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString('vi-VN')
                    : 'Never'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {user.systemRole ? (
                      <button
                        onClick={() => handleRevokeSystemRole(user.id)}
                        disabled={revokingRole === user.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {revokingRole === user.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <ShieldOff className="size-3" />
                        )}
                        Thu hồi
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGrantSystemRole(user.id)}
                        disabled={grantingRole === user.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-950/20 px-3 py-1.5 text-xs font-medium text-sky-300 transition hover:bg-sky-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {grantingRole === user.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Shield className="size-3" />
                        )}
                        Cấp Admin
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Hiển thị {((page - 1) * pagination.limit) + 1} -{' '}
            {Math.min(page * pagination.limit, pagination.total)} trong tổng số{' '}
            {pagination.total} users
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

