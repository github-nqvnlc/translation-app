'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';

function getPasswordIssues(password: string): string[] {
  const issues: string[] = [];

  if (password.length < 8) {
    issues.push('Ít nhất 8 ký tự');
  }
  if (!/[a-z]/.test(password)) {
    issues.push('Có chữ thường');
  }
  if (!/[A-Z]/.test(password)) {
    issues.push('Có chữ hoa');
  }
  if (!/[0-9]/.test(password)) {
    issues.push('Có chữ số');
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    issues.push('Có ký tự đặc biệt');
  }

  return issues;
}

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams?.get('token');

  const [token, setToken] = useState(tokenFromUrl || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    token?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [passwordIssues, setPasswordIssues] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isReset, setIsReset] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  useEffect(() => {
    if (password) {
      setPasswordIssues(getPasswordIssues(password));
    } else {
      setPasswordIssues([]);
    }
  }, [password]);

  const validate = (): boolean => {
    const nextErrors: {
      token?: string;
      password?: string;
      confirmPassword?: string;
    } = {};
    const issues = getPasswordIssues(password);

    if (!token.trim()) {
      nextErrors.token = 'Token reset mật khẩu là bắt buộc';
    }

    if (!password) {
      nextErrors.password = 'Mật khẩu là bắt buộc';
    } else if (issues.length > 0) {
      nextErrors.password = 'Mật khẩu chưa đáp ứng yêu cầu';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Mật khẩu nhập lại không khớp';
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
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token.trim(),
          newPassword: password,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Handle password validation errors
        if (result.details && Array.isArray(result.details)) {
          setServerError(
            result.error || 'Mật khẩu không đáp ứng yêu cầu'
          );
          setPasswordIssues(result.details);
        } else {
          setServerError(
            result?.error ||
              'Không thể reset mật khẩu vào lúc này. Vui lòng thử lại sau.'
          );
        }
        return;
      }

      setSuccessMessage(
        result?.message || 'Mật khẩu đã được đặt lại thành công'
      );
      setIsReset(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?reset=1');
      }, 2000);
    } catch (error) {
      console.error('reset password error', error);
      setServerError('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-slate-950/40 p-8 shadow-xl">
      <div className="space-y-2 text-center">
        <div className="mx-auto inline-flex rounded-2xl bg-sky-500/10 p-3">
          <Lock className="size-6 text-sky-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Đặt lại mật khẩu</h1>
        <p className="text-sm text-slate-400">
          Nhập mật khẩu mới cho tài khoản của bạn
        </p>
      </div>

      {serverError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div className="flex-1">
            <p>{serverError}</p>
            {passwordIssues.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                {passwordIssues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <div>
            <p>{successMessage}</p>
            {isReset && (
              <p className="mt-1 text-xs text-emerald-200/80">
                Đang chuyển hướng đến trang đăng nhập...
              </p>
            )}
          </div>
        </div>
      )}

      {!isReset && (
        <form className="space-y-6" onSubmit={handleSubmit}>
          {!tokenFromUrl && (
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-white"
                htmlFor="token"
              >
                Token reset mật khẩu
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
            </div>
          )}

          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-white"
              htmlFor="password"
            >
              Mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                  setServerError('');
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-11 pr-11 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                placeholder="Nhập mật khẩu mới"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password}</p>
            )}
            {password && passwordIssues.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Yêu cầu mật khẩu:</p>
                <ul className="space-y-1 text-xs text-slate-500">
                  {passwordIssues.map((issue, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-red-400">✗</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {password && passwordIssues.length === 0 && (
              <p className="text-xs text-emerald-400">
                ✓ Mật khẩu đáp ứng tất cả yêu cầu
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-white"
              htmlFor="confirmPassword"
            >
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                  }));
                  setServerError('');
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-11 pr-11 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                placeholder="Nhập lại mật khẩu"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-400">
                {errors.confirmPassword}
              </p>
            )}
            {confirmPassword &&
              password === confirmPassword &&
              password &&
              passwordIssues.length === 0 && (
                <p className="text-xs text-emerald-400">
                  ✓ Mật khẩu khớp
                </p>
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
                Đang đặt lại...
              </>
            ) : (
              'Đặt lại mật khẩu'
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

