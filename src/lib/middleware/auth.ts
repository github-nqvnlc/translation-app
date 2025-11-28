import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  systemRole: Role | null;
  projectRoles: Array<{
    projectId: string;
    projectName: string;
    role: Role;
  }>;
}

export interface AuthResult {
  authenticated: boolean;
  user?: AuthenticatedUser;
  error?: string;
  statusCode?: number;
}

/**
 * Get authenticated user from session token
 * Returns user info if authenticated, null otherwise
 * Optimized for performance with minimal queries
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;

    if (!sessionToken) {
      return null;
    }

    // Optimized query: only fetch what we need, check expiration first
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      select: {
        id: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            emailVerified: true,
            systemRole: {
              select: {
                role: true,
              },
            },
            projectMemberships: {
              select: {
                role: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Delete expired session (non-blocking)
      prisma.session.delete({ where: { id: session.id } }).catch(console.error);
      return null;
    }

    const user = session.user;

    // Get project roles
    const projectRoles = user.projectMemberships.map((membership) => ({
      projectId: membership.project.id,
      projectName: membership.project.name,
      role: membership.role,
    }));

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      emailVerified: user.emailVerified,
      systemRole: user.systemRole?.role || null,
      projectRoles,
    };
  } catch (error) {
    console.error('Get authenticated user error:', error);
    return null;
  }
}

/**
 * Middleware function to require authentication
 * Returns user if authenticated, or NextResponse with error if not
 */
export async function requireAuth(): Promise<AuthResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      authenticated: false,
      error: 'Bạn cần đăng nhập để truy cập tài nguyên này',
      statusCode: 401,
    };
  }

  return {
    authenticated: true,
    user,
  };
}

/**
 * Middleware function to require email verification
 * Must be called after requireAuth()
 */
export function requireEmailVerification(user: AuthenticatedUser): AuthResult {
  if (!user.emailVerified) {
    return {
      authenticated: false,
      error: 'Vui lòng xác minh email trước khi truy cập tài nguyên này',
      statusCode: 403,
    };
  }

  return {
    authenticated: true,
    user,
  };
}

/**
 * Helper to create error response from AuthResult
 */
export function createAuthErrorResponse(authResult: AuthResult): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: authResult.error || 'Unauthorized',
    },
    { status: authResult.statusCode || 401 }
  );
}

/**
 * Check if user has system role (Admin)
 */
export function hasSystemRole(user: AuthenticatedUser, role: Role): boolean {
  return user.systemRole === role;
}

/**
 * Check if user has role on a specific project
 */
export function hasProjectRole(
  user: AuthenticatedUser,
  projectId: string,
  role: Role
): boolean {
  // System admin has all permissions
  if (user.systemRole === Role.ADMIN) {
    return true;
  }

  const projectRole = user.projectRoles.find((pr) => pr.projectId === projectId);
  if (!projectRole) {
    return false;
  }

  // Role hierarchy: VIEWER < EDITOR < REVIEWER < ADMIN
  const roleHierarchy: Record<Role, number> = {
    [Role.VIEWER]: 1,
    [Role.EDITOR]: 2,
    [Role.REVIEWER]: 3,
    [Role.ADMIN]: 4,
  };

  return roleHierarchy[projectRole.role] >= roleHierarchy[role];
}

/**
 * Get user's role on a specific project
 */
export function getProjectRole(
  user: AuthenticatedUser,
  projectId: string
): Role | null {
  // System admin has all permissions
  if (user.systemRole === Role.ADMIN) {
    return Role.ADMIN;
  }

  const projectRole = user.projectRoles.find((pr) => pr.projectId === projectId);
  return projectRole?.role || null;
}

