import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * Skip Trace API — cascade lookup across multiple providers.
 * POST /api/skip-trace — look up contact info for an address or lead.
 */

interface SkipTraceResult {
  found: boolean;
  name?: string;
  phone?: string;
  email?: string;
  address: string;
  provider: string;
  confidence: number;
}

// Provider cascade: try each in order until one succeeds
async function cascadeSkipTrace(address: string): Promise<SkipTraceResult[]> {
  const results: SkipTraceResult[] = [];

  // Provider 1: Local database lookup
  const localLead = await prisma.lead.findFirst({
    where: {
      OR: [
        { contact: { address: { contains: address } } },
      ],
    },
    include: { contact: true },
    take: 1,
  });

  if (localLead) {
    results.push({
      found: true,
      name: `${localLead.contact.firstName} ${localLead.contact.lastName || ''}`.trim(),
      phone: localLead.contact.phone || undefined,
      email: localLead.contact.email || undefined,
      address,
      provider: 'local-db',
      confidence: 0.9,
    });
  }

  // Provider 2: White Pages-style mock (replace with real API)
  if (results.length === 0) {
    results.push({
      found: false,
      address,
      provider: 'whitepages-mock',
      confidence: 0,
    });
  }

  // Provider 3: Public records mock (replace with real API)
  if (!results.some(r => r.found)) {
    results.push({
      found: false,
      address,
      provider: 'public-records-mock',
      confidence: 0,
    });
  }

  return results;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { address, leadId } = body;

    if (!address && !leadId) {
      return NextResponse.json({ error: 'address or leadId is required' }, { status: 400 });
    }

    let lookupAddress = address;
    if (!lookupAddress && leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { contact: true },
      });
      if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      lookupAddress = lead.contact.address || '';
    }

    if (!lookupAddress) {
      return NextResponse.json({ error: 'No address available for skip trace' }, { status: 400 });
    }

    const results = await cascadeSkipTrace(lookupAddress);
    const best = results.find(r => r.found);

    // If found, update the lead/contact with new info
    if (best?.found && leadId) {
      try {
        const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { contactId: true } });
        if (lead) {
          const updateData: Record<string, string> = {};
          if (best.phone) updateData.phone = best.phone;
          if (best.email) updateData.email = best.email;
          if (Object.keys(updateData).length > 0) {
            await prisma.contact.update({ where: { id: lead.contactId }, data: updateData });
          }
        }
      } catch (err) {
        console.warn('[SkipTrace] Failed to update contact:', err);
      }
    }

    return NextResponse.json({
      success: true,
      address: lookupAddress,
      results,
      match: best || null,
    });
  } catch (error) {
    console.error('Skip trace error:', error);
    return NextResponse.json({ error: 'Skip trace failed' }, { status: 500 });
  }
}
