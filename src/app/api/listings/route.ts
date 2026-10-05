import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  const status = searchParams.get('status');
  const propertyType = searchParams.get('propertyType');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  const listings = await prisma.listing.findMany({
    where: {
      ...(workspaceId && { workspaceId }),
      ...(status && { status }),
      ...(propertyType && { propertyType }),
      ...(minPrice && { listPrice: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { listPrice: { lte: parseFloat(maxPrice) } }),
    },
    include: { offers: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(listings);
}

export async function POST(request: NextRequest) {
  let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  const {
    mlsNumber, status, listPrice, address, city, state, zip,
    bedrooms, bathrooms, squareFeet, lotSize, yearBuilt, propertyType,
    description, photos, virtualTourUrl, listingAgentId, sellerContactId, listDate, workspaceId,
  } = body;

  if (!address || !workspaceId) {
    return NextResponse.json({ error: 'address and workspaceId required' }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: {
      mlsNumber, status, listPrice, address, city, state, zip,
      bedrooms, bathrooms, squareFeet, lotSize, yearBuilt, propertyType,
      description, photos: photos ? JSON.stringify(photos) : null,
      virtualTourUrl, listingAgentId, sellerContactId,
      listDate: listDate ? new Date(listDate) : new Date(), workspaceId,
    },
  });
  return NextResponse.json(listing, { status: 201 });
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
  const listing = await prisma.listing.update({ where: { id }, data });
  return NextResponse.json(listing);
}
