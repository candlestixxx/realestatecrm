import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendSmsAction } from '@/lib/actions/sms';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // ?simulate=true is a DRY RUN: it reports what would be suppressed using
  // real listing data, but performs no DB mutations and fabricates nothing.
  const simulate = searchParams.get('simulate') === 'true';

  try {
    // 1. Fetch leads that have active smart plans or are currently being worked
    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { smartPlanId: { not: null } },
          { status: { in: ['NEW', 'ATTEMPTING_CONTACT', 'NURTURING'] } }
        ]
      },
      include: {
        contact: true,
        workspace: true,
        user: true
      }
    });

    const results = [];
    let stoppedCount = 0;

    for (const lead of leads) {
      if (!lead.contact?.address) continue;

      // 2. Check MLS listing status against real PropertyListing records.
      // Only a genuine ACTIVE listing match suppresses a campaign — no
      // fabricated MLS numbers or prices ever enter the activity log.
      const matchingActiveListing = await prisma.propertyListing.findFirst({
        where: {
          workspaceId: lead.workspaceId,
          address: { contains: lead.contact.address },
          status: 'ACTIVE'
        }
      });

      const isRelistedActive = !!matchingActiveListing;
      const mlsNum = matchingActiveListing?.mlsNumber || 'MLS-LOCAL';
      const price = matchingActiveListing?.price || 0;

      if (isRelistedActive) {
        if (simulate) {
          // Dry-run: report only, no writes.
          stoppedCount++;
          results.push({
            leadId: lead.id,
            address: lead.contact.address,
            status: 'would-suppress (dry run)',
            mlsNumber: mlsNum,
            price
          });
          continue;
        }

        // 3. Pause Smart Plan / Campaign
        await prisma.lead.updateMany({
          where: { id: lead.id },
          data: {
            smartPlanId: null,
            status: 'CLOSED' // Mark as closed/resolved since it relisted with another broker
          }
        });

        // 4. Log Pinned Activity Note
        await prisma.activity.create({
          data: {
            type: 'STATUS_CHANGE',
            content: `⚠️ Campaign auto-suppressed: Property detected as ACTIVE on MLS (${mlsNum}) listed at $${price.toLocaleString()}. Expired outreach stopped.`,
            isPinned: true,
            workspaceId: lead.workspaceId,
            leadId: lead.id
          }
        });

        // 5. Create In-App Notification
        await prisma.systemNotification.create({
          data: {
            title: '🚨 MLS Campaign Suppressed',
            description: `Address ${lead.contact.address} relisted on MLS for $${price.toLocaleString()}. Drips paused.`,
            type: 'MLS_ALERT',
            workspaceId: lead.workspaceId,
            userId: lead.userId || null
          }
        });

        // 6. Notify the Agent
        if (lead.user) {
          // A. Email alert log
          if (lead.user.emailAlertsMlsRelist) {
            // console.log(`[MLS Scrubber] Email alert sent to agent ${lead.user.email}: Listing ${lead.contact.address} is active.`);
          }

          // B. SMS alert log
          if (lead.user.smsAlertsMlsRelist && lead.user.email) {
            try {
              // Retrieve Twilio number or configuration to send SMS alert
              // console.log(`[MLS Scrubber] Sending SMS alert to agent: "Property at ${lead.contact.address} is active on MLS. Drip stopped."`);
              
              // If there's an SMS action, we trigger it:
              const formData = new FormData();
              formData.append('leadId', lead.id);
              formData.append('message', `CRM ALERT: Property at ${lead.contact.address} is active on MLS. Outreach campaign stopped.`);
              await sendSmsAction(formData);
            } catch (smsError) {
              console.error('Failed to dispatch SMS alert:', smsError);
            }
          }
        }

        stoppedCount++;
        results.push({
          leadId: lead.id,
          address: lead.contact.address,
          status: 'suppressed',
          mlsNumber: mlsNum,
          price: price
        });
      }
    }

    return NextResponse.json({
      message: 'MLS Address Scrubbing complete.',
      totalChecked: leads.length,
      suppressedCount: stoppedCount,
      details: results
    });

  } catch (error: any) {
    console.error('MLS Scrubber Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
