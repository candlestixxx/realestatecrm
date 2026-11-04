import prisma from '@/lib/prisma';

/**
 * Audit logging helper — call from API routes to track CRUD actions.
 */
export async function logAudit(params: {
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  workspaceId: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        userId: params.userId,
        workspaceId: params.workspaceId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        changes: params.changes ? JSON.stringify(params.changes) : null,
      },
    });
  } catch (err) {
    // Non-critical — don't fail the main request
    console.error('Audit log error:', err);
  }
}
