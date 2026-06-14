/**
 * Formal Role Hierarchy and Permission Matrix for RealEstateCRM
 */

export enum AppRole {
  OWNER = 'OWNER',
  BROKER = 'BROKER',
  ASSOCIATE_BROKER = 'ASSOCIATE_BROKER',
  REALTOR_AGENT = 'REALTOR_AGENT',
  OFFER_MANAGER = 'OFFICE_MANAGER',
  ADMIN = 'ADMIN',
}

// Higher number = higher priority/power
export const ROLE_HIERARCHY: Record<AppRole, number> = {
  [AppRole.OWNER]: 100,
  [AppRole.BROKER]: 80,
  [AppRole.ASSOCIATE_BROKER]: 60,
  [AppRole.REALTOR_AGENT]: 40,
  [AppRole.OFFER_MANAGER]: 20,
  [AppRole.ADMIN]: 90, // Admin has high system power but may not have legal brokerage power
};

export type AppPermission =
  | 'view:dashboard'
  | 'view:leads'
  | 'view:contacts'
  | 'view:deals'
  | 'view:tasks'
  | 'view:financials'
  | 'manage:users'
  | 'manage:workspace'
  | 'approve:listings'
  | 'approve:offers'
  | 'delete:records'
  | 'audit:logs';

export const PERMISSION_MATRIX: Record<AppRole, AppPermission[]> = {
  [AppRole.OWNER]: [
    'view:dashboard',
    'view:leads',
    'view:contacts',
    'view:deals',
    'view:tasks',
    'view:financials',
    'manage:users',
    'manage:workspace',
    'approve:listings',
    'approve:offers',
    'delete:records',
    'audit:logs',
  ],
  [AppRole.BROKER]: [
    'view:dashboard',
    'view:leads',
    'view:contacts',
    'view:deals',
    'view:tasks',
    'view:financials',
    'approve:listings',
    'approve:offers',
    'delete:records',
    'audit:logs',
  ],
  [AppRole.ASSOCIATE_BROKER]: [
    'view:dashboard',
    'view:leads',
    'view:contacts',
    'view:deals',
    'view:tasks',
    'approve:listings',
    'approve:offers',
  ],
  [AppRole.REALTOR_AGENT]: [
    'view:dashboard',
    'view:leads',
    'view:contacts',
    'view:deals',
    'view:tasks',
  ],
  [AppRole.OFFER_MANAGER]: [
    'view:dashboard',
    'view:leads',
    'view:contacts',
    'view:deals',
    'view:tasks',
  ],
  [AppRole.ADMIN]: [
    'view:dashboard',
    'manage:users',
    'manage:workspace',
    'audit:logs',
  ],
};

export function hasPermission(role: string | null | undefined, permission: AppPermission): boolean {
  if (!role) return false;
  const normalizedRole = role.toUpperCase() as AppRole;
  const permissions = PERMISSION_MATRIX[normalizedRole] || [];
  return permissions.includes(permission);
}

export function isAtLeastRole(role: string | null | undefined, targetRole: AppRole): boolean {
  if (!role) return false;
  const currentLevel = ROLE_HIERARCHY[role.toUpperCase() as AppRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole];
  return currentLevel >= targetLevel;
}
