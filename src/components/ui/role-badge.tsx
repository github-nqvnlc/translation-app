'use client';

import { Role } from '@prisma/client';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: Role | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const roleConfig: Record<
  Role,
  { label: string; className: string; icon?: string }
> = {
  [Role.ADMIN]: {
    label: 'Admin',
    className: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  [Role.REVIEWER]: {
    label: 'Reviewer',
    className: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  [Role.EDITOR]: {
    label: 'Editor',
    className: 'bg-green-500/20 text-green-300 border-green-500/30',
  },
  [Role.VIEWER]: {
    label: 'Viewer',
    className: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  },
};

const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function RoleBadge({ role, className, size = 'md' }: RoleBadgeProps) {
  if (!role) {
    return (
      <span
        className={cn(
          'inline-block rounded-full border border-slate-500/30 bg-slate-500/20 px-2.5 py-1 text-xs font-medium text-slate-300',
          sizeConfig[size],
          className
        )}
      >
        -
      </span>
    );
  }

  const config = roleConfig[role];

  return (
    <span
      className={cn(
        'inline-block rounded-full border font-medium',
        config.className,
        sizeConfig[size],
        className
      )}
    >
      {config.label}
    </span>
  );
}

