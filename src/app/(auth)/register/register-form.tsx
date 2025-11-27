'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Mail,
  Lock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const initialFormState: FormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
};

export default function RegisterForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordIssues, setPasswordIssues] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};
    const issues = getPasswordIssues(formState.password);

    if (!formState.email) {
      nextErrors.email = 'Email là bắt buộc';
    } else if (!emailRegex.test(formState.email.trim())) {
      nextErrors.email = 'Email không hợp lệ';
    }

    if (!formState.password) {
      nextErrors.password = 'Mật khẩu là bắt buộc';
    } else if (issues.length > 0) {
      nextErrors.password = 'Mật khẩu chưa đáp ứng yêu cầu';
    }

    if (!formState.confirmPassword) {
      nextErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu';
    } else if (formState.password !== formState.confirmPassword) {
      nextErrors.confirmPassword = 'Mật khẩu nhập lại không khớp';
    }

    if (!formState.acceptTerms) {
      nextErrors.acceptTerms = 'Bạn cần đồng ý với điều khoản sử dụng';
    }

    setErrors(nextErrors);
    setPasswordIssues(issues);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
    setServerError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setServerError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formState.email.trim(),
          password: formState.password,
          name: formState.name.trim() || null,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setServerError(
          result?.error ||
            'Không thể đăng ký vào lúc này. Vui lòng thử lại sau.'
        );
        return;
      }

      setSuccessMessage(
        result?.message ||
          'Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.'
      );
      setFormState(initialFormState);
      setPasswordIssues([]);

      // Chuyển hướng nhẹ sau khi hiển thị thông báo
      setTimeout(() => {
        router.push('/login?registered=1');
      }, 1800);
    } catch (error) {
      console.error('register error', error);
      setServerError('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-white/10 bg-slate-950/40 p-8 shadow-xl"
    >
      <div className="space-y-3 text-center">
        <p className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
          <ShieldCheck className="size-4 text-emerald-400" />
          Bảo mật nhiều lớp
        </p>
        <p className="text-sm text-slate-400">
          Tạo tài khoản để bắt đầu quản lý dự án dịch thuật và mời thành viên
          làm việc chung.
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
          <p>{successMessage}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-white" htmlFor="name">
          Họ và tên (không bắt buộc)
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={formState.name}
            onChange={(event) => handleChange('name', event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-11 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
            placeholder="Nguyễn Văn A"
          />
        </div>
        {errors.name && (
          <p className="text-sm text-red-300">{errors.name}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-white" htmlFor="email">
          Email đăng ký
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={formState.email}
            onChange={(event) => handleChange('email', event.target.value)}
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
          <label className="text-sm font-medium text-white" htmlFor="password">
            Mật khẩu
          </label>
          <span className="text-xs text-slate-400">
            Cần đủ mạnh để bật 2FA sau này
          </span>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={formState.password}
            onChange={(event) => handleChange('password', event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-11 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
            placeholder="••••••••"
            required
          />
        </div>
        {errors.password && (
          <p className="text-sm text-red-300">{errors.password}</p>
        )}
        {passwordIssues.length > 0 && (
          <ul className="space-y-1 text-xs text-slate-400">
            {passwordIssues.map((issue) => (
              <li key={issue} className="flex items-center gap-2 text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                {issue}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          className="text-sm font-medium text-white"
          htmlFor="confirmPassword"
        >
          Nhập lại mật khẩu
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={formState.confirmPassword}
            onChange={(event) =>
              handleChange('confirmPassword', event.target.value)
            }
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-11 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
            placeholder="••••••••"
            required
          />
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-300">{errors.confirmPassword}</p>
        )}
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          className="mt-1 size-5 rounded border-white/10 bg-white/5 text-sky-400 focus:ring-sky-500"
          checked={formState.acceptTerms}
          onChange={(event) =>
            handleChange('acceptTerms', event.target.checked)
          }
        />
        <span>
          Tôi đồng ý với{' '}
          <Link
            href="/docs"
            className="text-sky-400 underline-offset-4 hover:underline"
          >
            điều khoản sử dụng
          </Link>{' '}
          và cam kết bảo mật dữ liệu dịch thuật.
        </span>
      </label>
      {errors.acceptTerms && (
        <p className="text-sm text-red-300">{errors.acceptTerms}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Đang tạo tài khoản...
          </>
        ) : (
          'Tạo tài khoản'
        )}
      </button>

      <p className="text-center text-sm text-slate-400">
        Đã có tài khoản?{' '}
        <Link
          href="/login"
          className="font-semibold text-white underline-offset-4 hover:text-sky-300 hover:underline"
        >
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}


