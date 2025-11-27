'use client';

import { ReactNode } from 'react';
import { Role } from '@prisma/client';
import { usePermission } from '@/hooks/use-permission';
import { Loader2, AlertTriangle } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  requiredRole?: Role;
  requiredRoles?: Role[];
  requiredPermission?: string;
  projectId?: string;
  fallback?: ReactNode;
  showError?: boolean;
  errorMessage?: string;
}

export function PermissionGuard({
  children,
  requiredRole,
  requiredRoles,
  requiredPermission,
  projectId,
  fallback,
  showError = true,
  errorMessage = 'Bạn không có quyền truy cập nội dung này',
}: PermissionGuardProps) {
  const { isLoading, hasAccess, isAuthenticated } = usePermission({
    requiredRole,
    requiredRoles,
    requiredPermission,
    projectId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-sky-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>Vui lòng đăng nhập để truy cập nội dung này</p>
          </div>
        </div>
      )
    );
  }

  if (!hasAccess) {
    if (showError) {
      return (
        fallback || (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          </div>
        )
      );
    }
    return null;
  }

  return <>{children}</>;
}

