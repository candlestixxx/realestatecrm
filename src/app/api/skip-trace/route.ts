import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * Skip Trace API — cascade lookup across multiple providers.
 * POST /api/skip-trace — look up contact info for an address or lead.
 *
 * Live providers (in cascade order):
 *   1. Local DB      — always available (prisma lookup)
 *   2. Twilio Lookup — SKIP_TRACE_TWILIO_ACCOUNT_SID + SKIP_TRACE_TWILIO_AUTH_TOKEN
 *                     (name + carrier + line type; phone validation)
 *   3. Whitepages Pro — SKIP_TRACE_WHITEPAGES_API_KEY (name/phone/email)
 *
 * No fabricated fallback records: if no provider key is configured the
 * response reports `found: false` with an explicit `unconfigured` reason so
 * the UI can tell the operator exactly what to wire.
 */

interface SkipTraceResult {
  found: boolean;
  name?: string;
  phone?: string;
  email?: string;
  address: string;
  provider: string;
  confidence: number;
  note?: string;
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

  if (results.some(r => r.found)) return results;

  // Provider 2: Twilio Lookup (live person-enrichment endpoint).
  // Requires a phone number on file; address-only queries fall through.
  const twilioSid = process.env.SKIP_TRACE_TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.SKIP_TRACE_TWILIO_AUTH_TOKEN;
  const phone = localLead?.contact.phone;
  if (twilioSid && twilioToken && phone) {
    try {
      const resp = await fetch(
        `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(phone)}?Fields=line_type_intelligence`,
        {
          headers: { Authorization: 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64') },
          signal: AbortSignal.timeout(15000),
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        results.push({
          found: true,
          phone: data.phone_number || phone,
          address,
          provider: 'twilio-lookup',
          confidence: 0.8,
          note: data.line_type_intelligence?.type,
        });
      } else {
        results.push({ found: false, address, provider: 'twilio-lookup', confidence: 0, note: 'no match (HTTP ' + resp.status + ')' });
      }
    } catch (e) {
      results.push({ found: false, address, provider: 'twilio-lookup', confidence: 0, note: 'lookup failed' });
    }
  }

  // Provider 3: Whitepages Pro (live person/address enrichment)
  const wpKey = process.env.SKIP_TRACE_WHITEPAGES_API_KEY;
  if (wpKey) {
    try {
      const params = new URLSearchParams({ address, api_key: wpKey });
      const resp = await fetch(`https://proapi.whitepages.com/3.0/person?${params}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (resp.ok) {
        const data = await resp.json();
        const person = data?.results?.[0];
        if (person) {
          results.push({
            found: true,
            name: person.name?.full_name,
            phone: person.phones?.[0]?.phone_number,
            email: person.emails?.[0]?.email,
            address,
            provider: 'whitepages-pro',
            confidence: 0.85,
          });
        } else {
          results.push({ found: false, address, provider: 'whitepages-pro', confidence: 0, note: 'no person record' });
        }
      } else {
        results.push({ found: false, address, provider: 'whitepages-pro', confidence: 0, note: 'HTTP ' + resp.status });
      }
    } catch {
      results.push({ found: false, address, provider: 'whitepages-pro', confidence: 0, note: 'lookup failed' });
    }
  }

  // If no enrichment providers are configured, say so explicitly — never
  // fabricate a plausible-looking fake result.
  if (!twilioSid && !wpKey) {
    results.push({
      found: false,
      address,
      provider: 'unconfigured',
      confidence: 0,
      note: 'No enrichment providers configured. Set SKIP_TRACE_TWILIO_ACCOUNT_SID + SKIP_TRACE_TWILIO_AUTH_TOKEN or SKIP_TRACE_WHITEPAGES_API_KEY.',
    });
  }

  return results;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
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
