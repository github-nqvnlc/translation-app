'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Mail,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = (): boolean => {
    const nextErrors: { email?: string } = {};

    if (!email) {
      nextErrors.email = 'Email là bắt buộc';
    } else if (!emailRegex.test(email.trim())) {
      nextErrors.email = 'Email không hợp lệ';
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
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const result = await response.json().catch(() => ({}));

      // API always returns success to prevent email enumeration
      if (result.success) {
        setSuccessMessage(
          result?.message ||
            'Nếu email tồn tại, chúng tôi đã gửi link reset mật khẩu đến email của bạn.'
        );
        setIsSubmitted(true);
      } else {
        setServerError(
          result?.error ||
            'Không thể gửi email reset mật khẩu vào lúc này. Vui lòng thử lại sau.'
        );
      }
    } catch (error) {
      console.error('forgot password error', error);
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
        <h1 className="text-2xl font-bold text-white">Quên mật khẩu</h1>
        <p className="text-sm text-slate-400">
          Nhập email của bạn để nhận link reset mật khẩu
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
            <p className="mt-2 text-xs text-emerald-200/80">
              Vui lòng kiểm tra hộp thư đến và thư mục spam. Link reset mật
              khẩu có hiệu lực trong 1 giờ.
            </p>
          </div>
        </div>
      )}

      {!isSubmitted && (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-white"
              htmlFor="email"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined }));
                  setServerError('');
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-11 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                placeholder="you@example.com"
                required
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-sky-500 px-6 py-3 font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 inline-block size-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              'Gửi link reset mật khẩu'
            )}
          </button>
        </form>
      )}

      <div className="space-y-3 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          Quay lại đăng nhập
          <ArrowRight className="size-4" />
        </Link>
        {isSubmitted && (
          <p className="text-xs text-slate-500">
            Không nhận được email?{' '}
            <button
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
                setSuccessMessage('');
              }}
              className="text-sky-400 hover:text-sky-300"
            >
              Gửi lại
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

