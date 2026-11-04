import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { Session } from 'next-auth';
import { NextResponse } from 'next/server';

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

/**
 * Duck-type guard that replaces `instanceof WorkspaceAccessError`.
 *
 * Why: Turbopack bundles this module into multiple server chunks. The
 * class thrown by `requireWorkspaceAccess` can be a *different* class
 * object than the one imported by a route's catch block, so `instanceof`
 * silently returns false and the 401 escapes as an opaque 500. Checking
 * `name` + `statusCode` is immune to that identity mismatch.
 */
export function isWorkspaceAccessError(err: unknown): err is WorkspaceAccessError {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { name?: unknown }).name === 'WorkspaceAccessError' &&
    typeof (err as { statusCode?: unknown }).statusCode === 'number'
  );
}

/**
 * Map a caught error to a proper NextResponse when it carries an HTTP
 * `statusCode` (WorkspaceAccessError and similar). Returns `null` for
 * errors the caller should re-throw or handle itself.
 *
 * Why not `isWorkspaceAccessError` alone: even the name+statusCode duck-type
 * can miss if the error object is proxied/wrapped across a Turbopack chunk
 * boundary. A bare `statusCode` number check is the most primitive signal
 * and always survives serialization boundaries.
 */
export function workspaceErrorResponse(err: unknown): NextResponse | null {
  const statusCode = typeof err === 'object' && err !== null
    ? (err as { statusCode?: unknown }).statusCode
    : undefined;
  if (typeof statusCode === 'number') {
    const msg = err instanceof Error ? err.message : 'Workspace access denied.';
    return NextResponse.json({ error: msg }, { status: statusCode });
  }
  return null;
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
