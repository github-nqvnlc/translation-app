'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface Session {
  id: string;
  sessionToken: string;
  isCurrent: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
}

function getDeviceIcon(userAgent: string | null): typeof Monitor {
  if (!userAgent) return Globe;

  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return Smartphone;
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return Tablet;
  }
  return Monitor;
}

function parseUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown Device';

  // Extract browser name
  let browser = 'Unknown Browser';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('Opera')) {
    browser = 'Opera';
  }

  // Extract OS
  let os = '';
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }

  return os ? `${browser} on ${os}` : browser;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function SessionsList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/sessions');
      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || 'Không thể tải danh sách sessions');
        return;
      }

      setSessions(result.data || []);
    } catch (err) {
      console.error('Load sessions error', err);
      setError('Có lỗi xảy ra khi tải danh sách sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất thiết bị này?')) {
      return;
    }

    setDeletingId(sessionId);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || 'Không thể xóa session');
        return;
      }

      setSuccessMessage('Đã đăng xuất thiết bị thành công');
      // Reload sessions list
      await loadSessions();
    } catch (err) {
      console.error('Delete session error', err);
      setError('Có lỗi xảy ra khi xóa session');
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

  if (error && sessions.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-8 text-center">
          <p className="text-slate-400">Không có session nào đang hoạt động</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const DeviceIcon = getDeviceIcon(session.userAgent);
            const deviceInfo = parseUserAgent(session.userAgent);

            return (
              <div
                key={session.id}
                className={`rounded-2xl border p-6 ${
                  session.isCurrent
                    ? 'border-sky-500/50 bg-sky-950/20'
                    : 'border-white/10 bg-slate-950/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="rounded-xl bg-white/5 p-3">
                      <DeviceIcon
                        className={`size-5 ${
                          session.isCurrent ? 'text-sky-400' : 'text-slate-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">
                          {deviceInfo}
                        </h3>
                        {session.isCurrent && (
                          <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs font-medium text-sky-300">
                            Thiết bị hiện tại
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-slate-400">
                        {session.ipAddress && (
                          <p>
                            <span className="font-medium">IP:</span>{' '}
                            {session.ipAddress}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Đăng nhập:</span>{' '}
                          {formatDate(session.createdAt)}
                        </p>
                        <p>
                          <span className="font-medium">Hết hạn:</span>{' '}
                          {new Date(session.expiresAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      disabled={deletingId === session.id}
                      className="ml-4 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === session.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="mr-1.5 inline-block size-4" />
                          Đăng xuất
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
        <p>
          <strong className="text-white">Lưu ý:</strong> Đăng xuất một thiết bị
          sẽ chấm dứt phiên đăng nhập trên thiết bị đó. Bạn sẽ cần đăng nhập lại
          để tiếp tục sử dụng.
        </p>
      </div>
    </div>
  );
}

