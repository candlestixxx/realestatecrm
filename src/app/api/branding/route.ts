import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess, isWorkspaceAccessError } from '@/lib/workspace-access';
import { hasPermission } from '@/lib/permissions';
import { getWorkspaceBranding, sanitizeColor, DEFAULT_BRANDING } from '@/lib/branding';
import prisma from '@/lib/prisma';

/**
 * White-label Branding API.
 * GET /api/branding — current branding (any member)
 * PUT /api/branding — update branding (requires 'manage:workspace')
 */

const SLUG = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;

export async function GET() {
  const session = await getServerSession(authOptions);
  let access;
  try {
    access = await requireWorkspaceAccess(session);
  } catch (err) {
    if (isWorkspaceAccessError(err)) {
      return NextResponse.json({ error: (err as Error).message }, { status: (err as any).statusCode });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const branding = await getWorkspaceBranding(access.workspaceId);
    return NextResponse.json({ branding });
  } catch (error: any) {
    console.error('GET /api/branding error:', error);
    return NextResponse.json({ error: 'Failed to load branding' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  let access;
  try {
    access = await requireWorkspaceAccess(session);
  } catch (err) {
    if (isWorkspaceAccessError(err)) {
      return NextResponse.json({ error: (err as Error).message }, { status: (err as any).statusCode });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(access.workspaceRole, 'manage:workspace')) {
    return NextResponse.json({ error: 'You do not have permission to manage workspace branding' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, logoUrl, primaryColor, accentColor, portalSlug, emailFooter, brokeragePhone, brokerageAddress } = body;

    // Validate before writing anything.
    const data: Record<string, any> = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      }
      data.name = name.trim();
    }
    if (logoUrl !== undefined) {
      if (logoUrl && typeof logoUrl === 'string' && !/^https?:\/\//i.test(logoUrl)) {
        return NextResponse.json({ error: 'Logo URL must be an http(s) URL' }, { status: 400 });
      }
      data.logoUrl = logoUrl || null;
    }
    if (primaryColor !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
        return NextResponse.json({ error: 'primaryColor must be a hex color like #2563eb' }, { status: 400 });
      }
      data.primaryColor = primaryColor;
    }
    if (accentColor !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(accentColor)) {
        return NextResponse.json({ error: 'accentColor must be a hex color like #d4af37' }, { status: 400 });
      }
      data.accentColor = accentColor;
    }
    if (portalSlug !== undefined) {
      if (portalSlug && !SLUG.test(portalSlug)) {
        return NextResponse.json({ error: 'Portal slug must be 3-64 chars: lowercase letters, numbers, hyphens' }, { status: 400 });
      }
      if (portalSlug) {
        // Slug uniqueness is global (it namespaces client portal URLs).
        const taken = await prisma.workspace.findFirst({
          where: { portalSlug, id: { not: access.workspaceId } },
          select: { id: true },
        });
        if (taken) {
          return NextResponse.json({ error: 'That portal slug is already taken' }, { status: 409 });
        }
      }
      data.portalSlug = portalSlug || null;
    }
    if (emailFooter !== undefined) data.emailFooter = String(emailFooter || '').slice(0, 2000) || null;
    if (brokeragePhone !== undefined) data.brokeragePhone = String(brokeragePhone || '').slice(0, 40) || null;
    if (brokerageAddress !== undefined) data.brokerageAddress = String(brokerageAddress || '').slice(0, 500) || null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    await prisma.workspace.update({ where: { id: access.workspaceId }, data });
    const branding = await getWorkspaceBranding(access.workspaceId);
    return NextResponse.json({ branding });
  } catch (error: any) {
    console.error('PUT /api/branding error:', error);
    return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 });
  }
}
