'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  Mail,
  Lock,
  Chrome,
  Github,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginErrors = Partial<Record<'email' | 'password', string>>;

const oauthProviders = [
  {
    id: 'google',
    label: 'Tiếp tục với Google',
    Icon: Chrome,
  },
  {
    id: 'github',
    label: 'Tiếp tục với GitHub',
    Icon: Github,
  },
];

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState(() =>
    searchParams?.get('registered')
      ? 'Tạo tài khoản thành công. Vui lòng đăng nhập để tiếp tục.'
      : ''
  );
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null
  );
  const [isRedirectingProvider, setIsRedirectingProvider] = useState<
    'google' | 'github' | null
  >(null);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const nextErrors: LoginErrors = {};

    if (!email) {
      nextErrors.email = 'Email là bắt buộc';
    } else if (!emailRegex.test(email.trim())) {
      nextErrors.email = 'Email không hợp lệ';
    }

    if (!password) {
      nextErrors.password = 'Mật khẩu là bắt buộc';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage('');
    setServerError('');
    setRemainingAttempts(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          rememberMe,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setServerError(
          result?.error ||
            'Không thể đăng nhập vào lúc này. Vui lòng thử lại sau.'
        );
        if (typeof result?.remainingAttempts === 'number') {
          setRemainingAttempts(result.remainingAttempts);
        }
        return;
      }

      setSuccessMessage('Đăng nhập thành công. Đang chuyển hướng...');
      // Trigger session refresh event
      window.dispatchEvent(new Event('auth-change'));
      router.push('/projects');
      router.refresh();
    } catch (error) {
      console.error('login error', error);
      setServerError('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    setIsRedirectingProvider(provider);
    // Các endpoint OAuth sẽ được triển khai ở bước 33-34
    window.location.href = `/api/auth/oauth/${provider}`;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-8 rounded-3xl border border-white/10 bg-slate-950/40 p-8 shadow-xl">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {serverError && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p>{serverError}</p>
                {remainingAttempts !== null && remainingAttempts >= 0 && (
                  <p className="mt-1 text-xs text-red-200/80">
                    Còn {remainingAttempts} lần thử trước khi tài khoản bị tạm
                    khóa.
                  </p>
                )}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <p>{successMessage}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white" htmlFor="email">
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
              <p className="text-sm text-red-300">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                className="text-sm font-medium text-white"
                htmlFor="password"
              >
                Mật khẩu
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-sky-300 underline-offset-4 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                  setServerError('');
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-12 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-300">{errors.password}</p>
            )}
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              className="size-5 rounded border-white/10 bg-white/5 text-sky-400 focus:ring-sky-500"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Ghi nhớ phiên đăng nhập trong 7 ngày
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Chưa có tài khoản?{' '}
          <Link
            href="/register"
            className="font-semibold text-white underline-offset-4 hover:text-sky-300 hover:underline"
          >
            Tạo tài khoản mới
          </Link>
        </p>
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/40 p-8 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Hoặc đăng nhập nhanh
        </p>

        <div className="space-y-3">
          {oauthProviders.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleOAuthLogin(id as 'google' | 'github')}
              className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
            >
              {isRedirectingProvider === id ? (
                <Loader2 className="size-4 animate-spin text-white" />
              ) : (
                <Icon className="size-4 text-sky-300" />
              )}
              {label}
              <ArrowRight className="size-4 text-white/70" />
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
          OAuth sẽ mở cửa sổ xác thực của nhà cung cấp tương ứng. Sau khi hoàn
          tất, bạn sẽ được chuyển về Translation Workspace với quyền được phân
          tự động.
        </div>
      </div>
    </div>
  );
}


