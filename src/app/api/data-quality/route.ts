import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Data Quality API
 * Analyzes records for completeness, accuracy, and consistency.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') || 'excel-legacy-team';

  const [leads, contacts, listings] = await Promise.all([
    prisma.lead.findMany({
      where: { workspaceId },
      include: { contact: { select: { email: true, phone: true, firstName: true, lastName: true } } },
    }),
    prisma.contact.findMany({
      where: { workspaceId },
      select: { id: true, email: true, phone: true, firstName: true, lastName: true, address: true },
    }),
    prisma.listing.findMany({
      where: { workspaceId },
      select: { id: true, address: true, listPrice: true, bedrooms: true, bathrooms: true, squareFeet: true, photos: true, description: true, zip: true },
    }),
  ]);

  // Lead quality analysis (email/phone live on contact)
  const leadMissingEmail = leads.filter(l => !l.contact?.email).length;
  const leadMissingPhone = leads.filter(l => !l.contact?.phone).length;
  const leadMissingSource = leads.filter(l => !l.source).length;
  const leadScore = leads.length ? Math.round(((leads.length * 3 - leadMissingEmail - leadMissingPhone - leadMissingSource) / (leads.length * 3)) * 100) : 100;

  // Contact quality analysis
  const contactMissingEmail = contacts.filter(c => !c.email).length;
  const contactMissingPhone = contacts.filter(c => !c.phone).length;
  const contactMissingAddress = contacts.filter(c => !c.address).length;
  const contactScore = contacts.length ? Math.round(((contacts.length * 3 - contactMissingEmail - contactMissingPhone - contactMissingAddress) / (contacts.length * 3)) * 100) : 100;

  // Listing quality analysis
  const listingMissingPrice = listings.filter(l => !l.listPrice).length;
  const listingMissingPhotos = listings.filter(l => !l.photos).length;
  const listingMissingDesc = listings.filter(l => !l.description).length;
  const listingMissingBeds = listings.filter(l => !l.bedrooms).length;
  const listingScore = listings.length ? Math.round(((listings.length * 4 - listingMissingPrice - listingMissingPhotos - listingMissingDesc - listingMissingBeds) / (listings.length * 4)) * 100) : 100;

  // Duplicate detection
  const emailCounts = new Map<string, number>();
  contacts.forEach(c => {
    if (c.email) emailCounts.set(c.email, (emailCounts.get(c.email) || 0) + 1);
  });
  const duplicateEmails = Array.from(emailCounts.values()).filter(c => c > 1).length;

  const metrics = [
    {
      label: 'Lead Data Completeness',
      score: leadScore,
      total: leads.length,
      issues: [
        ...(leadMissingEmail > 0 ? [{ field: 'Missing email', count: leadMissingEmail, severity: 'high' as const }] : []),
        ...(leadMissingPhone > 0 ? [{ field: 'Missing phone', count: leadMissingPhone, severity: 'high' as const }] : []),
        ...(leadMissingSource > 0 ? [{ field: 'Missing source', count: leadMissingSource, severity: 'low' as const }] : []),
      ],
    },
    {
      label: 'Contact Data Completeness',
      score: contactScore,
      total: contacts.length,
      issues: [
        ...(contactMissingEmail > 0 ? [{ field: 'Missing email', count: contactMissingEmail, severity: 'high' as const }] : []),
        ...(contactMissingPhone > 0 ? [{ field: 'Missing phone', count: contactMissingPhone, severity: 'medium' as const }] : []),
        ...(contactMissingAddress > 0 ? [{ field: 'Missing address', count: contactMissingAddress, severity: 'low' as const }] : []),
      ],
    },
    {
      label: 'Listing Data Completeness',
      score: listingScore,
      total: listings.length,
      issues: [
        ...(listingMissingPrice > 0 ? [{ field: 'Missing price', count: listingMissingPrice, severity: 'high' as const }] : []),
        ...(listingMissingPhotos > 0 ? [{ field: 'Missing photos', count: listingMissingPhotos, severity: 'high' as const }] : []),
        ...(listingMissingDesc > 0 ? [{ field: 'Missing description', count: listingMissingDesc, severity: 'medium' as const }] : []),
        ...(listingMissingBeds > 0 ? [{ field: 'Missing bedrooms', count: listingMissingBeds, severity: 'low' as const }] : []),
      ],
    },
    {
      label: 'Duplicate Detection',
      score: duplicateEmails === 0 ? 100 : Math.max(100 - duplicateEmails * 10, 0),
      total: contacts.length,
      issues: [
        ...(duplicateEmails > 0 ? [{ field: 'Duplicate email addresses', count: duplicateEmails, severity: 'medium' as const }] : []),
      ],
    },
  ];

  const overallScore = Math.round(metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length);

  return NextResponse.json({ metrics, overallScore });
}
