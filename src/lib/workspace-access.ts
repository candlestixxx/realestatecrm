import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { Session } from 'next-auth';

import prisma from './prisma';
import { DEFAULT_WORKSPACE_SLUG } from './workspace-context';

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
  return session?.user?.id === 'demo-user' || (demoEmail && session?.user?.email === demoEmail);
}

export async function resolveWorkspaceAccess(session?: Session | null): Promise<WorkspaceAccess | null> {
  const user = session?.user;

  if (!user?.id) {
    return null;
  }

  if (isDemoIdentity(session)) {
    return {
      userId: user.id,
      workspaceId: DEFAULT_WORKSPACE_SLUG,
      workspaceSlug: DEFAULT_WORKSPACE_SLUG,
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
          orderBy: {
            workspaceId: 'asc',
          },
        },
      },
    });

    if (!dbUser || dbUser.workspaces.length === 0) {
      return null;
    }

    const activeMembership = dbUser.workspaces[0];

    return {
      userId: dbUser.id,
      workspaceId: activeMembership.workspaceId,
      workspaceSlug: activeMembership.workspaceId,
      workspaceRole: activeMembership.role ?? dbUser.role ?? 'AGENT',
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
