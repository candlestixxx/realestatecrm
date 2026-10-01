import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (token) {
    // Public endpoint for client portal access
    const portal = await prisma.clientPortal.findUnique({
      where: { token },
      include: {
        contact: true,
        workspace: true,
      },
    });
    if (!portal || !portal.isActive || (portal.expiresAt && portal.expiresAt < new Date())) {
      return NextResponse.json({ error: 'Portal not found or expired' }, { status: 404 });
    }
    // Return limited data for the client
    const listings = await prisma.listing.findMany({
      where: { workspaceId: portal.workspaceId, status: 'ACTIVE' },
      select: { id: true, address: true, listPrice: true, bedrooms: true, bathrooms: true, squareFeet: true, photos: true, status: true },
    });
    return NextResponse.json({ portal: { title: portal.title, contactName: portal.contact.firstName }, listings });
  }

  const workspaceId = searchParams.get('workspaceId');
  const portals = await prisma.clientPortal.findMany({
    where: { ...(workspaceId && { workspaceId }), isActive: true },
    include: { contact: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(portals);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { contactId, title, expiresAt, workspaceId } = body;

  if (!contactId || !workspaceId) {
    return NextResponse.json({ error: 'contactId and workspaceId required' }, { status: 400 });
  }

  const portal = await prisma.clientPortal.create({
    data: {
      contactId, title, workspaceId,
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });
  return NextResponse.json(portal, { status: 201 });
}
