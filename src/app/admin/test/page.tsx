'use client';

import { useState } from 'react';
import { usePermission } from '@/hooks/use-permission';
import { Mail, Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function AdminTestPage() {
  const { user, isLoading, isAdmin } = usePermission({ requiredRole: 'ADMIN' });
  const [testEmail, setTestEmail] = useState('');
  const [emailType, setEmailType] = useState<'verification' | 'password-reset'>('verification');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-sky-400" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="size-16 text-red-400" />
        <h1 className="text-2xl font-bold text-white">Không có quyền truy cập</h1>
        <p className="text-slate-400">Chỉ System Admin mới có thể truy cập trang này.</p>
      </div>
    );
  }

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      setResult({ success: false, message: 'Vui lòng nhập email' });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/test/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, type: emailType }),
      });

      const data = await response.json();
      setResult({
        success: response.ok,
        message: data.message || (response.ok ? 'Email đã được gửi!' : 'Gửi email thất bại'),
      });
    } catch (error) {
      setResult({ success: false, message: 'Lỗi kết nối server' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">🧪 Admin Test Panel</h1>
        <p className="text-slate-400">Test các tính năng hệ thống</p>
      </div>

      {/* Email Test Section */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-sky-500/20 p-3">
            <Mail className="size-6 text-sky-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Test Email</h2>
            <p className="text-sm text-slate-400">Gửi email test để kiểm tra cấu hình</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Email nhận
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Loại email
            </label>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="emailType"
                  value="verification"
                  checked={emailType === 'verification'}
                  onChange={() => setEmailType('verification')}
                  className="size-4 accent-sky-500"
                />
                <span className="text-sm text-slate-300">Xác thực email</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="emailType"
                  value="password-reset"
                  checked={emailType === 'password-reset'}
                  onChange={() => setEmailType('password-reset')}
                  className="size-4 accent-sky-500"
                />
                <span className="text-sm text-slate-300">Đặt lại mật khẩu</span>
              </label>
            </div>
          </div>

          {result && (
            <div
              className={`flex items-center gap-2 rounded-xl p-4 ${
                result.success
                  ? 'bg-green-500/10 text-green-300'
                  : 'bg-red-500/10 text-red-300'
              }`}
            >
              {result.success ? (
                <CheckCircle className="size-5" />
              ) : (
                <AlertCircle className="size-5" />
              )}
              {result.message}
            </div>
          )}

          <button
            onClick={handleSendTestEmail}
            disabled={sending || !testEmail}
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
            {sending ? 'Đang gửi...' : 'Gửi email test'}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/30 p-4">
        <h3 className="mb-2 font-medium text-white">📋 Thông tin cấu hình</h3>
        <div className="space-y-1 text-sm text-slate-400">
          <p>• Đảm bảo đã cấu hình biến môi trường email (RESEND_API_KEY hoặc SENDGRID_API_KEY)</p>
          <p>• Xem chi tiết tại <code className="rounded bg-white/10 px-1">docs-system/env-variables.md</code></p>
          <p>• Log chi tiết sẽ hiện trong terminal server</p>
        </div>
      </div>
    </div>
  );
}

