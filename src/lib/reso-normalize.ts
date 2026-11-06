// Pure RESO Web API payload -> Listing field mapping. No imports, so it can
// be unit-tested without a database or Prisma client.

export interface NormalizedListing {
  mlsNumber: string;
  status: string;
  listPrice: number | null;
  soldPrice: number | null;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  propertyType: string | null;
  description: string | null;
  photos: string | null;
  virtualTourUrl: string | null;
  listAgentMlsId: string | null;
  listDate: Date | null;
  soldDate: Date | null;
  daysOnMarket: number | null;
}

const STATUS_MAP: Record<string, string> = {
  Active: 'ACTIVE', 'Active Under Contract': 'PENDING', Pending: 'PENDING',
  Closed: 'SOLD', Sold: 'SOLD', Expired: 'EXPIRED', Withdrawn: 'WITHDRAWN',
  Canceled: 'WITHDRAWN', Cancelled: 'WITHDRAWN',
};

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}
function int(v: unknown): number | null {
  const n = num(v);
  return n === null ? null : Math.round(n);
}
function date(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}
function addressOf(p: any): string {
  if (p.UnparsedAddress) return String(p.UnparsedAddress);
  const parts = [p.StreetNumber, p.StreetName, p.StreetSuffix, p.UnitNumber ? `#${p.UnitNumber}` : null].filter(Boolean);
  return parts.length ? parts.join(' ') : 'Unknown Address';
}
function photosOf(p: any): string | null {
  if (Array.isArray(p.Media) && p.Media.length) {
    const urls = p.Media.map((m: any) => m.MediaURL).filter(Boolean);
    return urls.length ? JSON.stringify(urls) : null;
  }
  if (Array.isArray(p.Photos) && p.Photos.length) return JSON.stringify(p.Photos);
  return null;
}

export function normalizeResoListing(p: any): NormalizedListing {
  const mlsNumber = String(p.ListingId || p.ListingKey || '');
  if (!mlsNumber) throw new Error('Invalid RESO payload: Missing ListingId/ListingKey');
  const rawStatus = String(p.StandardStatus || p.Status || 'ACTIVE');
  return {
    mlsNumber,
    status: STATUS_MAP[rawStatus] || rawStatus.toUpperCase(),
    listPrice: num(p.ListPrice),
    soldPrice: num(p.ClosePrice || p.SoldPrice),
    address: addressOf(p),
    city: p.City ? String(p.City) : null,
    state: p.StateOrProvince ? String(p.StateOrProvince) : null,
    zip: p.PostalCode ? String(p.PostalCode) : null,
    bedrooms: int(p.BedroomsTotal),
    bathrooms: num(p.BathroomsTotalDecimal || p.BathroomsFull),
    squareFeet: int(p.LivingArea),
    lotSize: num(p.LotSizeAcres),
    yearBuilt: int(p.YearBuilt),
    propertyType: p.PropertyType ? String(p.PropertyType).toUpperCase().replace(/[\s-]/g, '_') : null,
    description: p.PublicRemarks ? String(p.PublicRemarks) : null,
    photos: photosOf(p),
    virtualTourUrl: p.VirtualTourURLUnbranded || p.VirtualTourURLBranded || null,
    listAgentMlsId: p.ListAgentKey || p.ListAgentMlsId || p.MemberKey || null,
    listDate: date(p.ListingContractDate || p.OnMarketDate),
    soldDate: date(p.CloseDate),
    daysOnMarket: int(p.DaysOnMarket),
  };
}
