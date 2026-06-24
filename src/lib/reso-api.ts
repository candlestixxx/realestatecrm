import prisma from './prisma';

/**
 * Normalizes standard RESO Web API fields into our internal CRM `PropertyListing` schema.
 */
export async function syncResoListing(workspaceId: string, resoPayload: any) {
  // Mock RESO mapping sequence
  const mlsNumber = resoPayload.ListingId || resoPayload.ListingKey;

  if (!mlsNumber) {
    throw new Error('Invalid RESO payload: Missing ListingId');
  }

  return await prisma.propertyListing.upsert({
    where: { mlsNumber },
    create: {
      workspaceId,
      mlsNumber,
      source: 'RESO',
      address: resoPayload.StreetName || 'Unknown Address',
      city: resoPayload.City,
      state: resoPayload.StateOrProvince,
      zip: resoPayload.PostalCode,
      price: resoPayload.ListPrice ? parseFloat(resoPayload.ListPrice) : null,
      bedrooms: resoPayload.BedroomsTotal ? parseInt(resoPayload.BedroomsTotal) : null,
      bathroomsFull: resoPayload.BathroomsFull ? parseInt(resoPayload.BathroomsFull) : null,
      bathroomsHalf: resoPayload.BathroomsHalf ? parseInt(resoPayload.BathroomsHalf) : null,
      squareFeet: resoPayload.LivingArea ? parseInt(resoPayload.LivingArea) : null,
      yearBuilt: resoPayload.YearBuilt ? parseInt(resoPayload.YearBuilt) : null,
      propertyType: resoPayload.PropertyType,
      status: resoPayload.StandardStatus || 'ACTIVE',
      description: resoPayload.PublicRemarks,
      images: resoPayload.Media ? JSON.stringify(resoPayload.Media.map((m: any) => m.MediaURL)) : null,
    },
    update: {
      price: resoPayload.ListPrice ? parseFloat(resoPayload.ListPrice) : null,
      status: resoPayload.StandardStatus || 'ACTIVE',
      description: resoPayload.PublicRemarks,
      images: resoPayload.Media ? JSON.stringify(resoPayload.Media.map((m: any) => m.MediaURL)) : null,
    }
  });
}
