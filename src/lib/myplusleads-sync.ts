import prisma from '@/lib/prisma';
import { authenticate, fetchListings } from '@/lib/myplusleads';
import { routeLeadAction } from '@/lib/routing';

export async function runMyPlusLeadsSync() {
  // Find all active MyPlusLeads integrations
  const integrations = await prisma.myPlusLeadsIntegration.findMany({
    where: { isActive: true },
  });

  if (integrations.length === 0) {
    return { message: 'No active integrations found.', results: [] };
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

      for (const listingRaw of res.listings) {
        const listing = listingRaw as any;
        // Extract primary contact details
        const primaryPhone = listing.contact1?.phone1 || listing.owner?.phone1 || '';
        const primaryEmail = listing.contact1?.email || '';

        // Parse and group all unique phone numbers
        const p1 = listing.contact1?.phone1 || '';
        const p2 = listing.contact1?.phone2 || '';
        const p3 = listing.contact1?.phone3 || '';
        const o1 = listing.owner?.phone1 || '';
        const o2 = listing.owner?.phone2 || '';
        const o3 = listing.owner?.phone3 || '';
        const c2p1 = listing.contact2?.phone1 || '';
        const c2p2 = listing.contact2?.phone2 || '';

        const rawUniquePhones = Array.from(new Set([p1, p2, p3, o1, o2, o3, c2p1, c2p2].filter(Boolean)));
        const finalPrimaryPhone = rawUniquePhones[0] || primaryPhone || null;
        const additionalPhones = rawUniquePhones.slice(1).map((val, idx) => ({
          value: val,
          label: idx === 0 ? 'Cell Phone 2' : idx === 1 ? 'Landline' : 'Work Phone'
        }));

        let contactId = null;

        // Attempt to find existing contact
        if (primaryEmail || finalPrimaryPhone) {
          const existingContact = await prisma.contact.findFirst({
            where: {
              workspaceId: integration.workspaceId,
              OR: [
                ...(primaryEmail ? [{ email: primaryEmail }] : []),
                ...(finalPrimaryPhone ? [{ phone: finalPrimaryPhone }] : []),
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
          generatedTag = `#${statusRaw.replace(/\s+/g, '')}`;
        }

        // Handle Spouse / Second Contact details
        const spouseName = listing.contact2?.name || null;
        const spousePhone = listing.contact2?.phone1 || null;
        const spouseEmail = listing.contact2?.email || null;

        const fullAddress = [
          listing.propertyAddress?.streetAddress,
          listing.propertyAddress?.city,
          listing.propertyAddress?.state,
          listing.propertyAddress?.zip
        ].filter(Boolean).join(', ');

        // Fallback names
        const streetName = listing.propertyAddress?.streetAddress || '';
        const fallbackName = streetName ? `Owner of ${streetName}` : 'Unknown';
        const nameParts = (listing.owner?.name || listing.contact1?.name || fallbackName).split(' ');
        const firstName = listing.owner?.firstName || nameParts[0] || 'Unknown';
        const lastName = listing.owner?.lastName || nameParts.slice(1).join(' ') || null;

        // If no contact found, create one. If found, update it.
        if (!contactId) {
          const newContact = await prisma.contact.create({
            data: {
              firstName,
              lastName,
              email: primaryEmail || null,
              phone: finalPrimaryPhone,
              address: fullAddress || null,
              workspaceId: integration.workspaceId,
              additionalPhones: additionalPhones.length > 0 ? JSON.stringify(additionalPhones) : null,
              spouseName,
              spousePhone,
              spouseEmail,
            },
          });
          contactId = newContact.id;
        } else {
          // Update existing contact details
          await prisma.contact.update({
            where: { id: contactId },
            data: {
              additionalPhones: additionalPhones.length > 0 ? JSON.stringify(additionalPhones) : undefined,
              spouseName: spouseName || undefined,
              spousePhone: spousePhone || undefined,
              spouseEmail: spouseEmail || undefined,
              address: fullAddress || undefined,
            },
          });
        }

        // Now create the lead
        const lead = await prisma.lead.create({
          data: {
            type: 'SELLER',
            source: 'MyPlusLeads',
            status: 'NEW',
            workspaceId: integration.workspaceId,
            contactId,
            tags: `${generatedTag} id:${listing.listingId || ''}`.trim() || null,
          },
        });

        // Store detailed remarks and contact info as a timeline activity NOTE
        let timelineNotes = `Detailed Summary: ${firstName} ${lastName || ''} is a new lead from MyPlusLeads.\n`;
        
        if (fullAddress) {
          timelineNotes += `Property Address: ${fullAddress}\n`;
        }
        if (listing.listDate) {
          timelineNotes += `List Date: ${listing.listDate}\n`;
        }
        
        const priceVal = listing.price || listing.propertyDetails?.price;
        if (priceVal) {
          timelineNotes += `Listing Price: ${priceVal}\n`;
        }
        if (listing.propertyDetails?.bedrooms) {
          timelineNotes += `Bedrooms: ${listing.propertyDetails.bedrooms}\n`;
        }
        if (listing.propertyDetails?.bathrooms) {
          timelineNotes += `Bathrooms: ${listing.propertyDetails.bathrooms}\n`;
        }
        if (listing.propertyDetails?.square_footage) {
          timelineNotes += `Square Footage: ${listing.propertyDetails.square_footage}\n`;
        }
        if (listing.propertyDetails?.yearBuilt) {
          timelineNotes += `Year Built: ${listing.propertyDetails.yearBuilt}\n`;
        }
        if (listing.propertyDetails?.mlsNumber) {
          timelineNotes += `MLS Number: ${listing.propertyDetails.mlsNumber}\n`;
        }

        // Contact 1 Details
        const c1Name = listing.contact1?.name || `${firstName} ${lastName || ''}`.trim();
        if (c1Name) {
          timelineNotes += `Contact 1 Name: ${c1Name}\n`;
        }
        if (p1) {
          timelineNotes += `Contact 1 Phone 1: ${p1}\n`;
          timelineNotes += `Contact 1 Phone 1 Line Type: Cell\n`;
        }
        if (p2) {
          timelineNotes += `Contact 1 Phone 2: ${p2}\n`;
          timelineNotes += `Contact 1 Phone 2 Line Type: Landline\n`;
        }
        if (p3) {
          timelineNotes += `Contact 1 Phone 3: ${p3}\n`;
          timelineNotes += `Contact 1 Phone 3 Line Type: Alt\n`;
        }

        // Contact 2 (Spouse/Co-owner)
        if (spouseName || spousePhone) {
          timelineNotes += `Contact 2 Name: ${spouseName || 'Spouse/Co-owner'}\n`;
          if (spousePhone) {
            timelineNotes += `Contact 2 Phone 1: ${spousePhone}\n`;
            timelineNotes += `Contact 2 Phone 1 Line Type: Cell\n`;
          }
        }

        if (listing.remarks) {
          timelineNotes += `Remarks: ${listing.remarks}\n`;
        }

        await prisma.activity.create({
          data: {
            type: 'NOTE',
            content: timelineNotes.trim(),
            workspaceId: integration.workspaceId,
            leadId: lead.id,
          },
        });

        // Route the lead using round-robin team assignment rules
        try {
          await routeLeadAction(lead.id);
        } catch (routingErr) {
          console.error(`[Lead Routing] Error auto-routing lead ${lead.id}:`, routingErr);
        }

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

  return { message: 'Sync complete', results };
}
