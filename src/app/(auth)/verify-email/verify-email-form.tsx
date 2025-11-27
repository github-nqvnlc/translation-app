'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  Mail,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams?.get('token');

  const [token, setToken] = useState(tokenFromUrl || '');
  const [errors, setErrors] = useState<{ token?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const validate = (): boolean => {
    const nextErrors: { token?: string } = {};

    if (!token.trim()) {
      nextErrors.token = 'Token xác minh là bắt buộc';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage('');
    setServerError('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token.trim(),
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setServerError(
          result?.error ||
            'Không thể xác minh email vào lúc này. Vui lòng thử lại sau.'
        );
        return;
      }

      setSuccessMessage(
        result?.message || 'Email đã được xác minh thành công'
      );
      setIsVerified(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?verified=1');
      }, 2000);
    } catch (error) {
      console.error('verify email error', error);
      setServerError('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-slate-950/40 p-8 shadow-xl">
      <div className="space-y-2 text-center">
        <div className="mx-auto inline-flex rounded-2xl bg-sky-500/10 p-3">
          <Mail className="size-6 text-sky-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Xác minh email</h1>
        <p className="text-sm text-slate-400">
          Nhập token xác minh từ email của bạn để kích hoạt tài khoản
        </p>
      </div>

      {serverError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{serverError}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <div>
            <p>{successMessage}</p>
            {isVerified && (
              <p className="mt-1 text-xs text-emerald-200/80">
                Đang chuyển hướng đến trang đăng nhập...
              </p>
            )}
          </div>
        </div>
      )}

      {!isVerified && (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-white"
              htmlFor="token"
            >
              Token xác minh
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(event) => {
                setToken(event.target.value);
                setErrors((prev) => ({ ...prev, token: undefined }));
                setServerError('');
              }}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
              placeholder="Nhập token từ email"
              required
            />
            {errors.token && (
              <p className="text-xs text-red-400">{errors.token}</p>
            )}
            <p className="text-xs text-slate-400">
              Token được gửi đến email của bạn khi đăng ký
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-sky-500 px-6 py-3 font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 inline-block size-4 animate-spin" />
                Đang xác minh...
              </>
            ) : (
              'Xác minh email'
            )}
          </button>
        </form>
      )}

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          Quay lại đăng nhập
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

