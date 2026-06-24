export type UserRole =
  | 'OWNER'
  | 'BROKER'
  | 'ASSOCIATE_BROKER'
  | 'REALTOR_AGENT'
  | 'OFFICE_MANAGER'
  | 'ADMIN';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 100,
  ADMIN: 90,
  BROKER: 80,
  ASSOCIATE_BROKER: 70,
  OFFICE_MANAGER: 50,
  REALTOR_AGENT: 10,
};

export function hasPermission(userRole: string | undefined | null, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  const userRank = ROLE_HIERARCHY[userRole as UserRole] ?? 0;
  const requiredRank = ROLE_HIERARCHY[requiredRole];
  return userRank >= requiredRank;
}

export function isComplianceApprover(userRole: string | undefined | null): boolean {
  return hasPermission(userRole, 'BROKER');
}
