import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  const slug = searchParams.get('slug');

  if (slug) {
    // Public endpoint for published site
    const site = await prisma.agentSite.findUnique({
      where: { slug },
      include: { template: true, user: { select: { name: true, email: true, image: true } } },
    });
    if (!site || !site.isPublished) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }
    return NextResponse.json(site);
  }

  const sites = await prisma.agentSite.findMany({
    where: { ...(workspaceId && { workspaceId }) },
    include: { template: true, user: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json(sites);
}

export async function POST(request: NextRequest) {
  let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  const { slug, title, content, domain, templateId, userId, workspaceId } = body;

  if (!slug || !title || !workspaceId) {
    return NextResponse.json({ error: 'slug, title, workspaceId required' }, { status: 400 });
  }

  // FK validation — workspaceId must exist or Prisma throws P2003 → 500
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const site = await prisma.agentSite.create({
    data: {
      slug, title,
      content: content ? JSON.stringify(content) : null,
      domain, templateId, userId, workspaceId,
    },
  });
  return NextResponse.json(site, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  // P2025 guard — update on missing id throws → 500
  const existing = await prisma.agentSite.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Website not found' }, { status: 404 });
  if (data.content) data.content = JSON.stringify(data.content);
  const site = await prisma.agentSite.update({ where: { id }, data });
  return NextResponse.json(site);
}
