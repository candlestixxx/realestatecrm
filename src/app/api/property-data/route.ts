import { NextRequest, NextResponse } from 'next/server';

/**
 * BS&A / Realcomp Property Data Integration
 * Prefills listing and offer data from county property records.
 * Supports: BS&A Online (Michigan counties), Realcomp IDX.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const parcel = searchParams.get('parcel');
  const county = searchParams.get('county') || 'macomb';
  const action = searchParams.get('action') || 'lookup'; // lookup | prefill-listing | prefill-offer

  if (!address && !parcel) {
    return NextResponse.json({ error: 'address or parcel required' }, { status: 400 });
  }

  const BSA_API_KEY = process.env.BSA_API_KEY;
  const BSA_API_URL = process.env.BSA_API_URL || 'https://bsaonline.com/api';
  const REALCOMP_API_KEY = process.env.REALCOMP_API_KEY;
  const REALCOMP_API_URL = process.env.REALCOMP_API_URL || 'https://api.realcomp.com/v1';

  // Try BS&A first
  let propertyData: any = null;
  let source = 'mock';

  if (BSA_API_KEY) {
    try {
      const params = new URLSearchParams({ county, ...(parcel ? { parcel } : { address: address! }) });
      const resp = await fetch(`${BSA_API_URL}/property/search?${params}`, {
        headers: { 'Authorization': `Bearer ${BSA_API_KEY}` },
        signal: AbortSignal.timeout(15000),
      });
      if (resp.ok) {
        const data = await resp.json();
        propertyData = normalizeBSAData(data);
        source = 'bsa';
      }
    } catch (e) {
      console.error('BS&A lookup failed:', e);
    }
  }

  // Fallback to Realcomp
  if (!propertyData && REALCOMP_API_KEY) {
    try {
      const params = new URLSearchParams({ ...(parcel ? { parcelId: parcel } : { address: address! }) });
      const resp = await fetch(`${REALCOMP_API_URL}/properties?${params}`, {
        headers: { 'Authorization': `Bearer ${REALCOMP_API_KEY}` },
        signal: AbortSignal.timeout(15000),
      });
      if (resp.ok) {
        const data = await resp.json();
        propertyData = normalizeRealcompData(data);
        source = 'realcomp';
      }
    } catch (e) {
      console.error('Realcomp lookup failed:', e);
    }
  }

  // Mock data fallback for development
  if (!propertyData) {
    propertyData = {
      parcelId: parcel || 'MAC-26-12-345-678',
      address: address || '123 Main St, Macomb, MI 48042',
      city: 'Macomb',
      state: 'MI',
      zip: '48042',
      county: county === 'macomb' ? 'Macomb' : 'Wayne',
      assessedValue: 185000,
      taxableValue: 152000,
      marketValue: 225000,
      propertyType: 'SINGLE_FAMILY',
      yearBuilt: 1998,
      squareFeet: 2100,
      lotSize: 0.25,
      bedrooms: 3,
      bathrooms: 2.5,
      lastSalePrice: 210000,
      lastSaleDate: '2022-06-15',
      owner: 'Smith, John & Jane',
      taxYear: 2024,
      homestead: true,
    };
  }

  // Generate prefill payloads based on action
  if (action === 'prefill-listing') {
    return NextResponse.json({
      success: true,
      source,
      prefill: {
        address: propertyData.address,
        city: propertyData.city,
        state: propertyData.state,
        zip: propertyData.zip,
        propertyType: propertyData.propertyType,
        yearBuilt: propertyData.yearBuilt,
        squareFeet: propertyData.squareFeet,
        lotSize: propertyData.lotSize,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        description: generateListingDescription(propertyData),
      },
      raw: propertyData,
    });
  }

  if (action === 'prefill-offer') {
    // Suggest offer price based on assessed/market value
    const suggestedOffer = Math.round(propertyData.marketValue * 0.95);
    return NextResponse.json({
      success: true,
      source,
      prefill: {
        suggestedOffer,
        assessedValue: propertyData.assessedValue,
        marketValue: propertyData.marketValue,
        taxAnnual: Math.round(propertyData.taxableValue * 0.021),
        contingencies: ['Inspection', 'Financing', 'Appraisal'],
        closingDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        earnestMoney: Math.round(suggestedOffer * 0.01),
      },
      raw: propertyData,
    });
  }

  return NextResponse.json({
    success: true,
    source,
    data: propertyData,
  });
}

function normalizeBSAData(data: any) {
  return {
    parcelId: data.parcelId || data.parcel_id,
    address: data.address || data.propertyAddress,
    city: data.city,
    state: data.state || 'MI',
    zip: data.zip || data.zipCode,
    county: data.county,
    assessedValue: data.assessedValue || data.assessed_value,
    taxableValue: data.taxableValue || data.taxable_value,
    marketValue: data.marketValue || data.market_value,
    propertyType: normalizePropertyType(data.propertyType || data.property_type),
    yearBuilt: data.yearBuilt || data.year_built,
    squareFeet: data.squareFeet || data.square_feet,
    lotSize: data.lotSize || data.lot_size,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    lastSalePrice: data.lastSalePrice || data.last_sale_price,
    lastSaleDate: data.lastSaleDate || data.last_sale_date,
    owner: data.owner || data.ownerName,
    taxYear: data.taxYear,
    homestead: data.homestead,
  };
}

function normalizeRealcompData(data: any) {
  const listing = Array.isArray(data.listings) ? data.listings[0] : data;
  return {
    parcelId: listing.parcelId || listing.parcel_id,
    address: listing.address || listing.streetAddress,
    city: listing.city,
    state: listing.state || 'MI',
    zip: listing.zip || listing.zipCode,
    county: listing.county,
    assessedValue: listing.assessedValue,
    taxableValue: listing.taxableValue,
    marketValue: listing.listPrice || listing.marketValue,
    propertyType: normalizePropertyType(listing.propertyType),
    yearBuilt: listing.yearBuilt,
    squareFeet: listing.squareFeet || listing.livingArea,
    lotSize: listing.lotSize || listing.acres,
    bedrooms: listing.bedrooms || listing.beds,
    bathrooms: listing.bathrooms || listing.baths,
    lastSalePrice: listing.soldPrice,
    lastSaleDate: listing.soldDate,
    owner: listing.owner,
    taxYear: listing.taxYear,
    homestead: listing.homestead,
  };
}

function normalizePropertyType(type: string) {
  if (!type) return 'SINGLE_FAMILY';
  const t = type.toUpperCase().replace(/[\s-]/g, '_');
  if (t.includes('CONDO')) return 'CONDO';
  if (t.includes('TOWN')) return 'TOWNHOUSE';
  if (t.includes('MULTI')) return 'MULTI_FAMILY';
  if (t.includes('LAND') || t.includes('VACANT')) return 'LAND';
  if (t.includes('COMMERCIAL')) return 'COMMERCIAL';
  return 'SINGLE_FAMILY';
}

function generateListingDescription(data: any): string {
  const beds = data.bedrooms ? `${data.bedrooms} bedroom` : '';
  const baths = data.bathrooms ? ` ${data.bathrooms} bath` : '';
  const sqft = data.squareFeet ? ` ${data.squareFeet.toLocaleString()} sq ft` : '';
  const year = data.yearBuilt ? ` built in ${data.yearBuilt}` : '';
  return `Beautiful ${data.propertyType?.toLowerCase().replace('_', ' ') || 'property'} with${beds}${baths}${sqft}${year}. Located in ${data.city}, ${data.state}.`;
}
