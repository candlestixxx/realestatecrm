import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate, fetchListings } from '@/lib/myplusleads';


function collectPhoneValues(value: unknown, out: string[] = []): string[] {
  if (!value) return out;

  if (typeof value === 'string') {
    const cleaned = value.trim();
    if (cleaned && !out.includes(cleaned)) out.push(cleaned);
    return out;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectPhoneValues(entry, out));
    return out;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const [key, child] of Object.entries(record)) {
      if (key.toLowerCase().includes('phone')) {
        collectPhoneValues(child, out);
      } else if (child && typeof child === 'object') {
        collectPhoneValues(child, out);
      }
    }
  }

  return out;
}

function serializeAdditionalPhones(phones: string[]) {
  return JSON.stringify(phones.slice(1).map((phone, index) => ({
    value: phone,
    label: index === 0 ? 'Cell Phone 2' : `Phone ${index + 2}`,
  })));
}

// Disable caching for cron jobs
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Simple check to prevent unauthorized access if called externally,
  // typically Vercel passes x-vercel-cron header or similar,
  // or we could require a secret token query param.
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // If CRON_SECRET is set but not matched, return 401
    // (For local development, we might not have it set, so we can let it pass if null)
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Find all active MyPlusLeads integrations
    const integrations = await prisma.myPlusLeadsIntegration.findMany({
      where: { isActive: true },
    });

    if (integrations.length === 0) {
      return NextResponse.json({ message: 'No active integrations found.' });
    }

    const results = [];

    for (const integration of integrations) {
      try {
        // 1. Authenticate
        const token = await authenticate(integration.email, integration.password);

        // 2. Fetch Listings
        const res = await fetchListings(token, integration.lastID);

        // 3. Process Listings
        let processedCount = 0;
        const newLastID = integration.lastID;

        for (const listing of res.listings) {
          // Check if contact already exists by email or phone
          const phone = listing.contact1?.phone1 || '';
          const email = listing.contact1?.email || '';

          let contactId = null;

          // Attempt to find existing contact
          if (email || phone) {
            const existingContact = await prisma.contact.findFirst({
              where: {
                workspaceId: integration.workspaceId,
                OR: [
                  ...(email ? [{ email }] : []),
                  ...(phone ? [{ phone }] : []),
                ],
              },
            });
            if (existingContact) {
              contactId = existingContact.id;
            }
          }

          // Generate appropriate hashtag from status
          const statusRaw = listing.propertyDetails?.status || listing.propertyDetails?.normalizedStatus || '';
          let generatedTag = '';
          if (statusRaw) {
            // e.g. "Expired" -> "#Expired", "FSBO" -> "#FSBO"
            generatedTag = `#${statusRaw.replace(/\s+/g, '')}`;
          }

          // If no contact found, create one
          if (!contactId) {
            const nameParts = (listing.owner?.name || listing.contact1?.name || 'Unknown').split(' ');
            const firstName = listing.owner?.firstName || nameParts[0] || 'Unknown';
            const lastName = listing.owner?.lastName || nameParts.slice(1).join(' ') || null;

            const newContact = await prisma.contact.create({
              data: {
                firstName,
                lastName,
                email: email || null,
                phone: phone || null,
                address: listing.propertyAddress?.streetAddress || null,
                workspaceId: integration.workspaceId,
              },
            });
            contactId = newContact.id;
          }

          // Now create the lead
          await prisma.lead.create({
            data: {
              type: 'SELLER', // Expired/FSBO are typically sellers
              source: 'MyPlusLeads',
              status: 'NEW', // Keep as NEW so agent sees it
              workspaceId: integration.workspaceId,
              contactId,
              tags: generatedTag || null,
            },
          });

          processedCount++;
        }

        // Update the integration with the new lastID and sync time
        const returnedLastID = res.result.lastID ? String(res.result.lastID) : null;
        if (returnedLastID && returnedLastID !== integration.lastID) {
          await prisma.myPlusLeadsIntegration.update({
            where: { id: integration.id },
            data: { 
              lastID: returnedLastID,
              lastSyncAt: new Date()
            },
          });
        }

        results.push({
          workspaceId: integration.workspaceId,
          status: 'success',
          processedCount,
        });

      } catch (err: any) {
        console.error(`Error processing integration for workspace ${integration.workspaceId}:`, err);
        results.push({
          workspaceId: integration.workspaceId,
          status: 'error',
          error: err.message,
        });
      }
    }

    return NextResponse.json({ message: 'Sync complete', results });

  } catch (error: any) {
    console.error('Fatal cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
