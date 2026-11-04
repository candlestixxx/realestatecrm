import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Legacy MLS Historical Search
 * Searches sold/expired/withdrawn listings for comps analysis and offer drafting.
 * Sources: MLS historical data, Realist tax records, prior transactions.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const city = searchParams.get('city');
  const zip = searchParams.get('zip');
  const soldAfter = searchParams.get('soldAfter');
  const soldBefore = searchParams.get('soldBefore');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const bedrooms = searchParams.get('bedrooms');
  const bathrooms = searchParams.get('bathrooms');
  const propertyType = searchParams.get('propertyType');
  const radius = searchParams.get('radius'); // miles from address
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50') || 50));

  // Build search over sold/expired/withdrawn listings
  const where: any = {
    status: { in: ['SOLD', 'EXPIRED', 'WITHDRAWN'] },
  };

  if (address) where.address = { contains: address };
  if (city) where.city = { contains: city };
  if (zip) where.zip = { contains: zip };
  if (propertyType) where.propertyType = propertyType;
  if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms) };
  if (bathrooms) where.bathrooms = { gte: parseFloat(bathrooms) };

  if (minPrice || maxPrice) {
    where.soldPrice = {};
    if (minPrice) where.soldPrice.gte = parseFloat(minPrice);
    if (maxPrice) where.soldPrice.lte = parseFloat(maxPrice);
  }

  if (soldAfter || soldBefore) {
    where.soldDate = {};
    if (soldAfter) where.soldDate.gte = new Date(soldAfter);
    if (soldBefore) where.soldDate.lte = new Date(soldBefore);
  }

  const listings = await prisma.listing.findMany({
    where,
    include: {
      offers: { select: { amount: true, status: true, createdAt: true } },
    },
    orderBy: { soldDate: 'desc' },
    take: limit,
  });

  // Compute comps summary
  const soldListings = listings.filter(l => l.status === 'SOLD' && l.soldPrice);
  const prices = soldListings.map(l => l.soldPrice!);
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const avgPricePerSqft = soldListings
    .filter(l => l.squareFeet && l.squareFeet > 0)
    .map(l => l.soldPrice! / l.squareFeet!);
  const medianPricePerSqft = avgPricePerSqft.length
    ? avgPricePerSqft.sort((a, b) => a - b)[Math.floor(avgPricePerSqft.length / 2)]
    : 0;

  return NextResponse.json({
    listings,
    comps: {
      totalSold: soldListings.length,
      averagePrice: Math.round(avgPrice),
      medianPricePerSqft: Math.round(medianPricePerSqft * 100) / 100,
      priceRange: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
      daysOnMarket: soldListings
        .filter(l => l.listDate && l.soldDate)
        .map(l => Math.floor((new Date(l.soldDate!).getTime() - new Date(l.listDate!).getTime()) / 86400000)),
    },
  });
}
