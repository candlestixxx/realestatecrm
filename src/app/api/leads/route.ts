import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { geocodeAddress } from '@/lib/geocode';
import prisma from '@/lib/prisma';

/**
 * GET /api/leads — list leads in the caller's workspace.
 *
 * Why: the Lead Map (and other list views) fetch `/api/leads?limit=N`, but
 * this route never existed — every call 404'd. Response shape:
 *   { leads: [{ id, status, score, type, source, tags, contact, latitude,
 *               longitude, ... }] }
 * latitude/longitude are surfaced top-level (from the contact's geocode) so
 * map consumers can filter without digging into relations.
 *
 * Query params: limit (default 100, max 500), status, type, q (name search).
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  try {
    await requireWorkspaceAccess(session);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const access = await requireWorkspaceAccess(session);
    const params = request.nextUrl.searchParams;
    const limit = Math.min(500, Math.max(1, parseInt(params.get('limit') || '100') || 100));
    const status = params.get('status') || undefined;
    const type = params.get('type') || undefined;
    const q = params.get('q') || undefined;

    const where: any = { workspaceId: access.workspaceId };
    if (status) where.status = status;
    if (type) where.type = type;
    if (q) {
      where.contact = {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
          { address: { contains: q } },
        ],
      };
    }

    const leads = await prisma.lead.findMany({
      where,
      include: { contact: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    // Flatten geocoordinates top-level for map consumers.
    const shaped = leads.map((l: any) => ({
      ...l,
      latitude: l.contact?.latitude ?? null,
      longitude: l.contact?.longitude ?? null,
    }));

    return NextResponse.json({ leads: shaped, count: shaped.length });
  } catch (error: any) {
    console.error('GET /api/leads error:', error);
    return NextResponse.json({ error: 'Failed to list leads' }, { status: 500 });
  }
}

/**
 * POST /api/leads — create a lead (with contact) in the caller's workspace.
 * Geocodes the provided address so the Lead Map can plot it.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  let access;
  try {
    access = await requireWorkspaceAccess(session);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { firstName, lastName, email, phone, address, type, source, status, tags, notes } = body;
    if (!firstName) {
      return NextResponse.json({ error: 'firstName is required' }, { status: 400 });
    }

    // Geocode the address (Nominatim) so the map can plot the lead.
    const coords = address ? await geocodeAddress(address) : null;

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName: lastName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        workspaceId: access.workspaceId,
        userId: access.userId,
      },
    });

    const lead = await prisma.lead.create({
      data: {
        type: type || 'BUYER',
        source: source || 'Manual',
        status: status || 'NEW',
        tags: tags || null,
        workspaceId: access.workspaceId,
        contactId: contact.id,
        userId: access.userId,
      },
      include: { contact: true },
    });

    if (notes) {
      await prisma.activity.create({
        data: {
          type: 'NOTE',
          content: notes,
          workspaceId: access.workspaceId,
          userId: access.userId,
          leadId: lead.id,
        },
      });
    }

    return NextResponse.json({ lead: { ...lead, latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null } }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/leads error:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
