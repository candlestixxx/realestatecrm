import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * IDX Search — MLS listing search for public-facing sites.
 * Returns published listings matching criteria for embedding in agent websites.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const city = searchParams.get('city');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const beds = searchParams.get('beds');
  const baths = searchParams.get('baths');
  const propertyType = searchParams.get('propertyType');
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0);

  const where: any = { status: 'ACTIVE' };
  if (q) where.OR = [
    { address: { contains: q } },
    { city: { contains: q } },
    { zip: { contains: q } },
  ];
  if (city) where.city = { contains: city };
  if (minPrice) where.listPrice = { ...where.listPrice, gte: parseFloat(minPrice) };
  if (maxPrice) where.listPrice = { ...where.listPrice, lte: parseFloat(maxPrice) };
  if (beds) where.bedrooms = { gte: parseInt(beds) };
  if (baths) where.bathrooms = { gte: parseFloat(baths) };
  if (propertyType) where.propertyType = propertyType;

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      select: {
        id: true, address: true, city: true, state: true, zip: true,
        listPrice: true, bedrooms: true, bathrooms: true, squareFeet: true,
        propertyType: true, photos: true, status: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.listing.count({ where }),
  ]);

  return NextResponse.json({ listings, total, limit, offset });
}
