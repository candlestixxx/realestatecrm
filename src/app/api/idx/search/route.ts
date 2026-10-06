import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_WORKSPACE_SLUG } from '@/lib/workspace-context';

/**
 * IDX Property Search API for website builder.
 * Public-facing endpoint used by agent websites to display listings.
 * Supports: search, filters, pagination, saved searches.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain'); // agent website domain
  const q = searchParams.get('q'); // free-text search
  const city = searchParams.get('city');
  const zip = searchParams.get('zip');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const beds = searchParams.get('beds');
  const baths = searchParams.get('baths');
  const propertyType = searchParams.get('propertyType');
  const status = searchParams.get('status') || 'ACTIVE';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '12') || 12));
  const sort = searchParams.get('sort') || 'newest'; // newest | price_asc | price_desc

  const where: any = { status };
  if (q) {
    where.OR = [
      { address: { contains: q } },
      { city: { contains: q } },
      { zip: { contains: q } },
      { description: { contains: q } },
    ];
  }
  if (city) where.city = { contains: city };
  if (zip) where.zip = { contains: zip };
  if (propertyType) where.propertyType = propertyType;
  if (beds) where.bedrooms = { gte: parseInt(beds) };
  if (baths) where.bathrooms = { gte: parseFloat(baths) };
  if (minPrice || maxPrice) {
    where.listPrice = {};
    if (minPrice) where.listPrice.gte = parseFloat(minPrice);
    if (maxPrice) where.listPrice.lte = parseFloat(maxPrice);
  }

  const orderBy: any = sort === 'price_asc' ? { listPrice: 'asc' }
    : sort === 'price_desc' ? { listPrice: 'desc' }
    : { createdAt: 'desc' };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, mlsNumber: true, status: true, listPrice: true,
        address: true, city: true, state: true, zip: true,
        bedrooms: true, bathrooms: true, squareFeet: true,
        propertyType: true, photos: true, description: true,
        listDate: true,
      },
    }),
    prisma.listing.count({ where }),
  ]);

  return NextResponse.json({
    listings,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

/**
 * POST: Create a saved search for a visitor on an agent website.
 */
export async function POST(request: NextRequest) {
  let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  const { domain, email, criteria, name } = body;

  if (!email || !criteria) {
    return NextResponse.json({ error: 'email and criteria required' }, { status: 400 });
  }

  // Store saved search as an Activity (type=SAVED_SEARCH) linked to contact
  const contact = await prisma.contact.findFirst({ where: { email } });

  const activity = await prisma.activity.create({
    data: {
      type: 'SAVED_SEARCH',
      content: JSON.stringify({ name: name || 'Saved Search', criteria, domain }),
      workspaceId: DEFAULT_WORKSPACE_SLUG,
      ...(contact && { contactId: contact.id }),
    },
  });

  return NextResponse.json({ id: activity.id, message: 'Saved search created' }, { status: 201 });
}
