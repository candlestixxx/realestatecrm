import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';

/**
 * Owned Properties API — real-estate assets on a contact (Owner: Buy box).
 *
 * Why: the Lead Detail "Properties" tab previously rendered two hardcoded
 * duplicate cards (invented "3 beds | 2 baths | 1386 sqft", a fabricated
 * fallback address) and its buttons fired "Simulated: ..." toasts. These
 * endpoints back the tab with real persisted records.
 *
 * GET    /api/owned-properties?contactId=...  — list a contact's properties
 * POST   /api/owned-properties                — create one
 * DELETE /api/owned-properties?id=...         — remove one
 */

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  let access;
  try {
    access = await requireWorkspaceAccess(session);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contactId = request.nextUrl.searchParams.get('contactId');
  if (!contactId) {
    return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
  }

  try {
    const properties = await prisma.ownedProperty.findMany({
      where: { contactId, workspaceId: access.workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ properties });
  } catch (error: any) {
    console.error('GET /api/owned-properties error:', error);
    return NextResponse.json({ error: 'Failed to list properties' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  let access;
  try {
    access = await requireWorkspaceAccess(session);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { contactId, address, propertyType, label, beds, baths, squareFeet, estValue, notes } = body;

    if (!contactId || !address) {
      return NextResponse.json({ error: 'contactId and address are required' }, { status: 400 });
    }

    // The contact must belong to this workspace (no cross-workspace writes).
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, workspaceId: access.workspaceId },
      select: { id: true },
    });
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found in this workspace' }, { status: 404 });
    }

    const property = await prisma.ownedProperty.create({
      data: {
        contactId,
        workspaceId: access.workspaceId,
        address,
        propertyType: propertyType || 'Single Family',
        label: label || 'Home',
        beds: beds != null ? Number(beds) : null,
        baths: baths != null ? Number(baths) : null,
        squareFeet: squareFeet != null ? Number(squareFeet) : null,
        estValue: estValue != null ? Number(estValue) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/owned-properties error:', error);
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  let access;
  try {
    access = await requireWorkspaceAccess(session);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    // deleteMany scopes to the workspace so users can't delete across tenants.
    const result = await prisma.ownedProperty.deleteMany({
      where: { id, workspaceId: access.workspaceId },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/owned-properties error:', error);
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
  }
}
