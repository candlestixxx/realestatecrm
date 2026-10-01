import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  const category = searchParams.get('category');

  const templates = await prisma.websiteTemplate.findMany({
    where: {
      ...(workspaceId && { workspaceId }),
      ...(category && { category }),
      isActive: true,
    },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, category, html, css, thumbnail, workspaceId } = body;

  if (!name || !html || !workspaceId) {
    return NextResponse.json({ error: 'name, html, workspaceId required' }, { status: 400 });
  }

  const template = await prisma.websiteTemplate.create({
    data: { name, category, html, css, thumbnail, workspaceId },
  });
  return NextResponse.json(template, { status: 201 });
}
