'use client';

import { useState, useEffect } from 'react';
import { Role } from '@prisma/client';
import { hasRole, hasPermission, hasAnyRole } from '@/lib/permissions';

interface UserSession {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  systemRole: Role | null;
  projectRoles: Array<{
    projectId: string;
    role: Role;
  }>;
}

interface UsePermissionOptions {
  requiredRole?: Role;
  requiredRoles?: Role[];
  requiredPermission?: string;
  projectId?: string;
}

export function usePermission(options: UsePermissionOptions = {}) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (!user) {
      setHasAccess(false);
      return;
    }

    let access = true;

    // Check system role
    if (options.requiredRole) {
      if (user.systemRole === Role.ADMIN) {
        // Admin has access to everything
        setHasAccess(true);
        return;
      }
      if (user.systemRole) {
        access = hasRole(user.systemRole, options.requiredRole);
      } else {
        access = false;
      }
    }

    // Check any of required roles
    if (options.requiredRoles && access) {
      if (user.systemRole === Role.ADMIN) {
        setHasAccess(true);
        return;
      }
      if (user.systemRole) {
        access = hasAnyRole(user.systemRole, options.requiredRoles);
      } else {
        access = false;
      }
    }

    // Check project role
    if (options.projectId && access) {
      if (user.systemRole === Role.ADMIN) {
        setHasAccess(true);
        return;
      }
      const projectRole = user.projectRoles.find(
        (pr) => pr.projectId === options.projectId
      );
      if (!projectRole) {
        access = false;
      } else if (options.requiredRole) {
        access = hasRole(projectRole.role, options.requiredRole);
      } else if (options.requiredRoles) {
        access = hasAnyRole(projectRole.role, options.requiredRoles);
      }
    }

    // Check permission
    if (options.requiredPermission && access) {
      if (user.systemRole === Role.ADMIN) {
        setHasAccess(true);
        return;
      }
      const roleToCheck = options.projectId
        ? user.projectRoles.find((pr) => pr.projectId === options.projectId)
            ?.role
        : user.systemRole;
      if (roleToCheck) {
        access = hasPermission(roleToCheck, options.requiredPermission);
      } else {
        access = false;
      }
    }

    setHasAccess(access);
  }, [user, options]);

  const loadSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const result = await response.json();

      if (response.ok && result.success) {
        setUser(result.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Load session error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    hasAccess,
    isAuthenticated: !!user,
    isAdmin: user?.systemRole === Role.ADMIN,
    refresh: loadSession,
  };
}

