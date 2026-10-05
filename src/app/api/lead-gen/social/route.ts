import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface SocialLeadSource {
  platform: string;
  postId: string;
  engagementType: string;
  userData: {
    name?: string;
    email?: string;
    phone?: string;
    profileUrl?: string;
  };
  metadata?: Record<string, any>;
}

async function syncToHubSpot(lead: any, apiKey: string): Promise<string | null> {
  if (!apiKey) return null;
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          firstname: lead.firstName || '',
          lastname: lead.lastName || '',
          email: lead.email || '',
          phone: lead.phone || '',
          lead_source: 'Social Media - ' + (lead.platform || 'unknown'),
          lifecyclestage: 'lead'
        }
      })
    });
    if (response.ok) {
      const data = await response.json();
      return data.id;
    }
    return null;
  } catch (error) {
    console.error('HubSpot sync error:', error);
    return null;
  }
}

async function syncToSalesforce(lead: any, apiKey: string, instanceUrl: string): Promise<string | null> {
  if (!apiKey || !instanceUrl) return null;
  try {
    const response = await fetch(instanceUrl + '/services/data/v58.0/sobjects/Lead', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        FirstName: lead.firstName || '',
        LastName: lead.lastName || 'Unknown',
        Email: lead.email || '',
        Phone: lead.phone || '',
        LeadSource: 'Social Media',
        Company: 'Social Lead'
      })
    });
    if (response.ok) {
      const data = await response.json();
      return data.id;
    }
    return null;
  } catch (error) {
    console.error('Salesforce sync error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { source, workspaceId, connectors } = body;

    if (!source || !workspaceId) {
      return NextResponse.json({ error: 'source and workspaceId required' }, { status: 400 });
    }

    const fullName = source.userData.name || 'Social Lead';
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Social';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Lead';

    let contact = await prisma.contact.findFirst({
      where: {
        email: source.userData.email || undefined,
        workspaceId
      }
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          firstName,
          lastName,
          email: source.userData.email || null,
          phone: source.userData.phone || null,
          workspaceId
        }
      });
    } else {
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          phone: source.userData.phone || contact.phone
        }
      });
    }

    const lead = await prisma.lead.create({
      data: {
        contactId: contact.id,
        workspaceId,
        source: 'Social - ' + source.platform,
        status: 'NEW',
        tags: 'social,' + source.platform + ',' + source.engagementType
      }
    });

    await prisma.activity.create({
      data: {
        type: 'SOCIAL_LEAD_CAPTURED',
        workspaceId,
        leadId: lead.id,
        content: JSON.stringify({
          platform: source.platform,
          postId: source.postId,
          engagementType: source.engagementType
        })
      }
    });

    const syncResults: Record<string, string | null> = {};
    if (connectors && connectors.length > 0) {
      for (const connector of connectors) {
        if (connector.type === 'hubspot') {
          syncResults.hubspot = await syncToHubSpot(
            { firstName, lastName, ...source.userData, platform: source.platform },
            connector.apiKey
          );
        } else if (connector.type === 'salesforce') {
          syncResults.salesforce = await syncToSalesforce(
            { firstName, lastName, ...source.userData, platform: source.platform },
            connector.apiKey,
            connector.instanceUrl || ''
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      contactId: contact.id,
      crmSync: syncResults
    });
  } catch (error) {
    console.error('Social lead gen error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const platform = searchParams.get('platform');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    const where: any = {
      workspaceId,
      source: { startsWith: 'Social' }
    };
    if (platform) {
      where.source = { contains: platform };
    }

    const leads = await prisma.lead.findMany({
      where,
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ leads, total: leads.length });
  } catch (error) {
    console.error('Social lead fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
