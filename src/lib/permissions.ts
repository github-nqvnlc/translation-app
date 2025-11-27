import { Role } from '@prisma/client';

// Role hierarchy: higher number = more permissions
const ROLE_HIERARCHY: Record<Role, number> = {
  VIEWER: 1,
  EDITOR: 2,
  REVIEWER: 3,
  ADMIN: 4,
};

// Check if user has required role or higher
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Check if user has any of the required roles
export function hasAnyRole(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.some((role) => hasRole(userRole, role));
}

// Permission mapping for each role
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  VIEWER: [
    'view_entries',
    'view_files',
    'view_projects',
    'export_files',
    'view_comments',
    'view_labels',
  ],
  EDITOR: [
    'view_entries',
    'view_files',
    'view_projects',
    'export_files',
    'view_comments',
    'view_labels',
    'create_entries',
    'edit_entries',
    'use_ai_translate',
    'create_comments',
    'create_labels',
    'upload_files',
    'import_files',
    'create_translation_tables',
  ],
  REVIEWER: [
    'view_entries',
    'view_files',
    'view_projects',
    'export_files',
    'view_comments',
    'view_labels',
    'create_entries',
    'edit_entries',
    'use_ai_translate',
    'create_comments',
    'create_labels',
    'upload_files',
    'import_files',
    'create_translation_tables',
    'approve_entries',
    'reject_entries',
    'delete_entries',
    'delete_files',
    'manage_project_members',
    'view_audit_logs',
  ],
  ADMIN: [
    'view_entries',
    'view_files',
    'view_projects',
    'export_files',
    'view_comments',
    'view_labels',
    'create_entries',
    'edit_entries',
    'use_ai_translate',
    'create_comments',
    'create_labels',
    'upload_files',
    'import_files',
    'create_translation_tables',
    'approve_entries',
    'reject_entries',
    'delete_entries',
    'delete_files',
    'manage_project_members',
    'view_audit_logs',
    'delete_projects',
    'configure_projects',
    'manage_users',
    'configure_system',
    'view_all_audit_logs',
  ],
};

// Check if role has specific permission
export function hasPermission(role: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Get all permissions for a role
export function getRolePermissions(role: Role): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

