import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess, isWorkspaceAccessError } from '@/lib/workspace-access';
import { AppRole, ROLE_HIERARCHY, hasPermission, isAtLeastRole } from '@/lib/permissions';
import { hashPassword, verifyPassword } from '@/lib/password';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Team Management API (white-label team workstream).
 *
 * GET    /api/team                      — list workspace members
 * POST   /api/team                      — invite a member (creates account)
 * PATCH  /api/team                      — change role / set password / self password change
 * DELETE /api/team?memberId=...          — remove a member
 *
 * RBAC: mutations require the 'manage:users' permission (OWNER/BROKER/ADMIN).
 * Hierarchy rules: you cannot assign a role above your own, cannot modify or
 * remove the last OWNER, and cannot remove yourself.
 *
 * SECURITY NOTE: accounts are password-protected via User.passwordHash
 * (scrypt). This endpoint previously had no counterpart at all while
 * auth.ts accepted any password for known emails — team management needs
 * real accounts with real credentials to mean anything.
 */

function tempPassword(): string {
  // 12 bytes -> 16 base64url chars: enough entropy for a temporary password
  // shown once to the inviting admin, who shares it over a secure channel.
  return crypto.randomBytes(12).toString('base64url');
}

function errorResponse(err: unknown, fallback: string) {
  if (isWorkspaceAccessError(err)) {
    return NextResponse.json({ error: (err as Error).message }, { status: (err as any).statusCode });
  }
  console.error('GET /api/team error:', err);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  let access;
  try {
    access = await requireWorkspaceAccess(session);
  } catch (err) {
    return errorResponse(err, 'Unauthorized');
  }

  try {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: access.workspaceId },
      include: { user: { select: { id: true, name: true, email: true, createdAt: true, passwordHash: true } } },
      orderBy: { user: { createdAt: 'asc' } },
    });

    return NextResponse.json({
      members: members.map(m => ({
        memberId: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        joinedAt: m.user.createdAt,
        // Honest signal for admins: has this account been given a password yet?
        hasPassword: !!m.user.passwordHash,
      })),
      yourRole: access.workspaceRole,
    });
  } catch (err) {
    return errorResponse(err, 'Failed to list members');
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  let access;
  try {
    access = await requireWorkspaceAccess(session);
  } catch (err) {
    return errorResponse(err, 'Unauthorized');
  }

  if (!hasPermission(access.workspaceRole, 'manage:users')) {
    return NextResponse.json({ error: 'You do not have permission to manage team members' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, name, role } = body;

    if (!email || !name) {
      return NextResponse.json({ error: 'email and name are required' }, { status: 400 });
    }
    const normalizedEmail = String(email).trim().toLowerCase();

    // Hierarchy guard: cannot invite someone above your own rank.
    const targetRole: AppRole = (role as AppRole) || AppRole.AGENT;
    if (!(targetRole in ROLE_HIERARCHY)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (ROLE_HIERARCHY[targetRole] > ROLE_HIERARCHY[(access.workspaceRole as AppRole) ?? AppRole.AGENT]) {
      return NextResponse.json({ error: 'You cannot invite someone with a role above your own' }, { status: 403 });
    }

    // Existing user?
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (user) {
      const existing = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: user.id, workspaceId: access.workspaceId } },
      });
      if (existing) {
        return NextResponse.json({ error: 'Already a member of this workspace' }, { status: 409 });
      }
      await prisma.workspaceMember.create({
        data: { userId: user.id, workspaceId: access.workspaceId, role: targetRole },
      });
      return NextResponse.json({
        member: { userId: user.id, name: user.name, email: user.email, role: targetRole },
        note: 'Existing account added to the workspace. They sign in with their existing password.',
      }, { status: 201 });
    }

    // New account with a one-time temporary password (shown once, never stored in plaintext).
    const password = tempPassword();
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        role: targetRole,
        passwordHash: hashPassword(password),
        workspaces: {
          create: { workspaceId: access.workspaceId, role: targetRole },
        },
      },
    });

    return NextResponse.json({
      member: { userId: user.id, name: user.name, email: user.email, role: targetRole },
      tempPassword: password,
      note: 'Account created. Share the temporary password over a secure channel — it is shown only once. The member should change it after first sign-in.',
    }, { status: 201 });
  } catch (err) {
    return errorResponse(err, 'Failed to invite member');
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  let access;
  try {
    access = await requireWorkspaceAccess(session);
  } catch (err) {
    return errorResponse(err, 'Unauthorized');
  }

  try {
    const body = await request.json();
    const { action, memberId, role, newPassword, currentPassword } = body;

    // Self-service password change: any member, requires current password.
    if (action === 'self-password') {
      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
      }
      const user = await prisma.user.findUnique({ where: { id: access.userId }, select: { passwordHash: true } });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      // If a password exists, the current one must be supplied and match.
      if (user.passwordHash) {
        if (!currentPassword || !verifyPassword(currentPassword, user.passwordHash)) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
        }
      }
      await prisma.user.update({ where: { id: access.userId }, data: { passwordHash: hashPassword(newPassword) } });
      return NextResponse.json({ success: true });
    }

    if (!hasPermission(access.workspaceRole, 'manage:users')) {
      return NextResponse.json({ error: 'You do not have permission to manage team members' }, { status: 403 });
    }
    if (!memberId) return NextResponse.json({ error: 'memberId is required' }, { status: 400 });

    const member = await prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId: access.workspaceId },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    if (action === 'role') {
      const targetRole = role as AppRole;
      if (!targetRole || !(targetRole in ROLE_HIERARCHY)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      if (ROLE_HIERARCHY[targetRole] > ROLE_HIERARCHY[(access.workspaceRole as AppRole) ?? AppRole.AGENT]) {
        return NextResponse.json({ error: 'You cannot assign a role above your own' }, { status: 403 });
      }
      // Last-owner protection: demoting the sole OWNER would orphan the workspace.
      if (member.role === 'OWNER' && targetRole !== 'OWNER') {
        const owners = await prisma.workspaceMember.count({ where: { workspaceId: access.workspaceId, role: 'OWNER' } });
        if (owners <= 1) {
          return NextResponse.json({ error: 'Cannot demote the last OWNER — assign another OWNER first' }, { status: 400 });
        }
      }
      await prisma.workspaceMember.update({ where: { id: member.id }, data: { role: targetRole } });
      await prisma.user.update({ where: { id: member.userId }, data: { role: targetRole } }).catch(() => {});
      return NextResponse.json({ success: true });
    }

    if (action === 'password') {
      // Admin-initiated password set/reset (e.g. member forgot password).
      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: member.userId },
        data: { passwordHash: hashPassword(newPassword) },
      });
      return NextResponse.json({ success: true, note: 'Password reset. Share it with the member over a secure channel.' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return errorResponse(err, 'Failed to update member');
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  let access;
  try {
    access = await requireWorkspaceAccess(session);
  } catch (err) {
    return errorResponse(err, 'Unauthorized');
  }

  if (!hasPermission(access.workspaceRole, 'manage:users')) {
    return NextResponse.json({ error: 'You do not have permission to manage team members' }, { status: 403 });
  }

  const memberId = request.nextUrl.searchParams.get('memberId');
  if (!memberId) return NextResponse.json({ error: 'memberId is required' }, { status: 400 });

  try {
    const member = await prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId: access.workspaceId },
    });
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    if (member.userId === access.userId) {
      return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 });
    }
    if (member.role === 'OWNER') {
      const owners = await prisma.workspaceMember.count({ where: { workspaceId: access.workspaceId, role: 'OWNER' } });
      if (owners <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last OWNER' }, { status: 400 });
      }
    }

    await prisma.workspaceMember.delete({ where: { id: member.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err, 'Failed to remove member');
  }
}
