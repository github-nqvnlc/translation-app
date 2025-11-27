import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import {
  AuthenticatedUser,
  requireAuth,
  createAuthErrorResponse,
  hasSystemRole,
  hasProjectRole,
  getProjectRole,
} from './auth';
import { hasRole, hasPermission } from '@/lib/permissions';

export interface RBACResult {
  authorized: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Require user to have a specific system role (e.g., ADMIN)
 */
export function requireSystemRole(
  user: AuthenticatedUser,
  requiredRole: Role
): RBACResult {
  if (!hasSystemRole(user, requiredRole)) {
    return {
      authorized: false,
      error: `Yêu cầu quyền ${requiredRole} để truy cập tài nguyên này`,
      statusCode: 403,
    };
  }

  return { authorized: true };
}

/**
 * Require user to have a specific role on a project
 */
export function requireProjectRole(
  user: AuthenticatedUser,
  projectId: string,
  requiredRole: Role
): RBACResult {
  if (!hasProjectRole(user, projectId, requiredRole)) {
    const userRole = getProjectRole(user, projectId);
    return {
      authorized: false,
      error: `Yêu cầu quyền ${requiredRole} trên project này. Bạn hiện có quyền ${userRole || 'không có'}.`,
      statusCode: 403,
    };
  }

  return { authorized: true };
}

/**
 * Require user to have at least one of the specified roles on a project
 */
export function requireAnyProjectRole(
  user: AuthenticatedUser,
  projectId: string,
  requiredRoles: Role[]
): RBACResult {
  // System admin has all permissions
  if (user.systemRole === Role.ADMIN) {
    return { authorized: true };
  }

  const userRole = getProjectRole(user, projectId);
  if (!userRole) {
    return {
      authorized: false,
      error: `Bạn không có quyền truy cập project này. Yêu cầu một trong các quyền: ${requiredRoles.join(', ')}`,
      statusCode: 403,
    };
  }

  // Check if user role is in required roles
  const hasRequiredRole = requiredRoles.some((role) =>
    hasRole(userRole, role)
  );

  if (!hasRequiredRole) {
    return {
      authorized: false,
      error: `Yêu cầu một trong các quyền: ${requiredRoles.join(', ')}. Bạn hiện có quyền ${userRole}.`,
      statusCode: 403,
    };
  }

  return { authorized: true };
}

/**
 * Require user to have a specific permission
 */
export function requirePermission(
  user: AuthenticatedUser,
  permission: string,
  projectId?: string
): RBACResult {
  // System admin has all permissions
  if (user.systemRole === Role.ADMIN) {
    return { authorized: true };
  }

  // If projectId is provided, check project role
  if (projectId) {
    const projectRole = getProjectRole(user, projectId);
    if (!projectRole) {
      return {
        authorized: false,
        error: 'Bạn không có quyền truy cập project này',
        statusCode: 403,
      };
    }

    if (!hasPermission(projectRole, permission)) {
      return {
        authorized: false,
        error: `Bạn không có quyền "${permission}" trên project này`,
        statusCode: 403,
      };
    }
  } else {
    // Check system role permissions
    if (!user.systemRole) {
      return {
        authorized: false,
        error: `Yêu cầu quyền "${permission}"`,
        statusCode: 403,
      };
    }

    if (!hasPermission(user.systemRole, permission)) {
      return {
        authorized: false,
        error: `Bạn không có quyền "${permission}"`,
        statusCode: 403,
      };
    }
  }

  return { authorized: true };
}

/**
 * Get project ID from request (from URL params or body)
 */
export function getProjectIdFromRequest(
  request: Request,
  params?: { id?: string; projectId?: string }
): string | null {
  // Try to get from URL params first
  if (params?.id) {
    return params.id;
  }
  if (params?.projectId) {
    return params.projectId;
  }

  // Try to get from request body (for POST/PATCH requests)
  // Note: This requires parsing the body, which should be done in route handler
  return null;
}

/**
 * Combined middleware: Require auth + project role
 * Use this in route handlers that need both authentication and project authorization
 */
export async function requireAuthAndProjectRole(
  projectId: string,
  requiredRole: Role
): Promise<{
  user?: AuthenticatedUser;
  error?: NextResponse;
}> {
  // First check authentication
  const authResult = await requireAuth();
  if (!authResult.authenticated || !authResult.user) {
    return {
      error: createAuthErrorResponse(authResult),
    };
  }

  const user = authResult.user;

  // Then check project role
  const rbacResult = requireProjectRole(user, projectId, requiredRole);
  if (!rbacResult.authorized) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: rbacResult.error,
        },
        { status: rbacResult.statusCode || 403 }
      ),
    };
  }

  return { user };
}

/**
 * Combined middleware: Require auth + system role
 */
export async function requireAuthAndSystemRole(
  requiredRole: Role
): Promise<{
  user?: AuthenticatedUser;
  error?: NextResponse;
}> {
  // First check authentication
  const authResult = await requireAuth();
  if (!authResult.authenticated || !authResult.user) {
    return {
      error: createAuthErrorResponse(authResult),
    };
  }

  const user = authResult.user;

  // Then check system role
  const rbacResult = requireSystemRole(user, requiredRole);
  if (!rbacResult.authorized) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: rbacResult.error,
        },
        { status: rbacResult.statusCode || 403 }
      ),
    };
  }

  return { user };
}

/**
 * Combined middleware: Require auth + permission
 */
export async function requireAuthAndPermission(
  permission: string,
  projectId?: string
): Promise<{
  user?: AuthenticatedUser;
  error?: NextResponse;
}> {
  // First check authentication
  const authResult = await requireAuth();
  if (!authResult.authenticated || !authResult.user) {
    return {
      error: createAuthErrorResponse(authResult),
    };
  }

  const user = authResult.user;

  // Then check permission
  const rbacResult = requirePermission(user, permission, projectId);
  if (!rbacResult.authorized) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: rbacResult.error,
        },
        { status: rbacResult.statusCode || 403 }
      ),
    };
  }

  return { user };
}

/**
 * Helper to create error response from RBACResult
 */
export function createRBACErrorResponse(rbacResult: RBACResult): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: rbacResult.error || 'Forbidden',
    },
    { status: rbacResult.statusCode || 403 }
  );
}

