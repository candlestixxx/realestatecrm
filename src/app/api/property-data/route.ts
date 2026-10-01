import { NextRequest, NextResponse } from 'next/server';

/**
 * Property Data Integration (BS&A / Realcomp)
 * Prefills listing and offer data from county property records.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const parcel = searchParams.get('parcel');
  const county = searchParams.get('county') || 'macomb';

  if (!address && !parcel) {
    return NextResponse.json({ error: 'address or parcel required' }, { status: 400 });
  }

  // BS&A Online / Realcomp lookup scaffold
  // In production, connect to BS&A API or Realcomp IDX feed
  const baseUrl = process.env.BSA_API_URL || 'https://bsaonline.com/api';
  const apiKey = process.env.BSA_API_KEY;

  if (!apiKey) {
    // Return mock data for development
    return NextResponse.json({
      success: true,
      source: 'mock',
      data: {
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
        bedrooms: 4,
        bathrooms: 2.5,
        owner: 'Smith, John & Jane',
        lastSaleDate: '2018-06-15',
        lastSalePrice: 210000,
        taxYear: 2025,
        annualTaxes: 3850,
      },
    });
  }

  try {
    const resp = await fetch(`${baseUrl}/property?address=${encodeURIComponent(address || '')}&parcel=${encodeURIComponent(parcel || '')}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });
    const data = await resp.json();
    return NextResponse.json({ success: resp.ok, source: 'bsa', data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 502 });
  }
}
