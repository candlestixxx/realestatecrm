import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { Session } from 'next-auth';

import prisma from './prisma';
import { DEFAULT_WORKSPACE_SLUG, getActiveWorkspaceSlug } from './workspace-context';

export class WorkspaceAccessError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'WorkspaceAccessError';
    this.statusCode = statusCode;
  }
}

export type WorkspaceAccess = {
  userId: string;
  workspaceId: string;
  workspaceSlug: string;
  workspaceRole: string;
  isDemo: boolean;
};

function isDemoIdentity(session?: Session | null) {
  const demoEmail = process.env.AUTH_DEMO_EMAIL?.trim();
  return (
    session?.user?.id === 'demo-user' ||
    session?.user?.id === 'universal-admin' ||
    (demoEmail && session?.user?.email === demoEmail)
  );
}

export async function resolveWorkspaceAccess(session?: Session | null): Promise<WorkspaceAccess | null> {
  const user = session?.user;

  if (!user?.id) {
    return null;
  }

  const activeSlug = await getActiveWorkspaceSlug(session);

  if (isDemoIdentity(session)) {
    return {
      userId: user.id,
      workspaceId: activeSlug,
      workspaceSlug: activeSlug,
      workspaceRole: user.role ?? 'OWNER',
      isDemo: true,
    };
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        role: true,
        workspaces: {
          select: {
            role: true,
            workspaceId: true,
          },
        },
      },
    });

    if (!dbUser || dbUser.workspaces.length === 0) {
      return null;
    }

    // Check if user has access to the active slug
    const membership = dbUser.workspaces.find(w => w.workspaceId === activeSlug) 
      || dbUser.workspaces[0];

    return {
      userId: dbUser.id,
      workspaceId: membership.workspaceId,
      workspaceSlug: membership.workspaceId,
      workspaceRole: membership.role ?? dbUser.role ?? 'REALTOR_AGENT',
      isDemo: false,
    };
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      return null;
    }

    throw error;
  }
}

export async function requireWorkspaceAccess(session?: Session | null) {
  const access = await resolveWorkspaceAccess(session);

  if (!access) {
    throw new WorkspaceAccessError('Authentication and workspace membership are required.', 401);
  }

  return access;
}

import { hasPermission, type UserRole } from './roles';

export async function requireWorkspaceRole(session: Session | null | undefined, requiredRole: UserRole) {
  const access = await requireWorkspaceAccess(session);

  if (!hasPermission(access.workspaceRole, requiredRole)) {
    throw new WorkspaceAccessError('Insufficient permissions for this action.', 403);
  }

  return access;
}
