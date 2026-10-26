import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

/**
 * E-Signature Contracts API (replaces the old simulated "blockchain" contracts).
 *
 * Why: the previous /api/contracts fabricated txHash/blockNumber with
 * Math.random() and told users contracts were "deployed on-chain" — invented
 * records presented as legal fact. For a brokerage product that is unacceptable.
 *
 * This is a real signing workflow:
 *  - contracts with typed terms and named parties
 *  - signing links (per-party invite token) for buyer/seller/etc.
 *  - typed signature capture with IP + user-agent + timestamp attribution
 *  - SHA-256 document hash computed at send-time, stored on the contract, and
 *    cross-checked when signatures are recorded (integrity anchor)
 *  - full audit trail via ContractSignature rows (immutable sign events)
 *
 * DocuSign/HelloSign integration can replace the capture layer later without
 * changing this data model (signatures keep provider refs in signatureText).
 */

const VALID_TYPES = ['PURCHASE_AGREEMENT', 'LISTING_AGREEMENT', 'LEASE', 'EARNEST_MONEY', 'ADDENDUM'];
const VALID_ROLES = ['BUYER', 'SELLER', 'AGENT', 'CO_AGENT', 'WITNESS'];

function hashDocument(payload: object): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  let access;
  try {
    access = await requireWorkspaceAccess(session);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dealId = request.nextUrl.searchParams.get('dealId');
  try {
    const contracts = await prisma.contract.findMany({
      where: { workspaceId: access.workspaceId, ...(dealId ? { dealId } : {}) },
      include: { signatures: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ contracts });
  } catch (error: any) {
    console.error('GET /api/esign error:', error);
    return NextResponse.json({ error: 'Failed to list contracts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  let access;
  try {
    access = await requireWorkspaceAccess(session);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, contractType, terms, dealId, parties } = body;

    if (!title || !Array.isArray(parties) || parties.length === 0) {
      return NextResponse.json({ error: 'title and at least one party are required' }, { status: 400 });
    }
    if (contractType && !VALID_TYPES.includes(contractType)) {
      return NextResponse.json({ error: 'Invalid contractType' }, { status: 400 });
    }
    for (const p of parties) {
      if (!p.name || !p.email) {
        return NextResponse.json({ error: 'Each party needs a name and email' }, { status: 400 });
      }
      if (p.role && !VALID_ROLES.includes(p.role)) {
        return NextResponse.json({ error: `Invalid party role: ${p.role}` }, { status: 400 });
      }
    }

    if (dealId) {
      const deal = await prisma.deal.findFirst({ where: { id: dealId, workspaceId: access.workspaceId }, select: { id: true } });
      if (!deal) return NextResponse.json({ error: 'Deal not found in this workspace' }, { status: 404 });
    }

    const contract = await prisma.contract.create({
      data: {
        workspaceId: access.workspaceId,
        dealId: dealId || null,
        title,
        contractType: contractType || 'PURCHASE_AGREEMENT',
        terms: terms ? JSON.stringify(terms) : null,
        createdBy: (session?.user as any)?.id || null,
        signatures: {
          create: parties.map((p: any) => ({
            partyName: p.name,
            partyEmail: String(p.email).toLowerCase(),
            role: p.role || 'BUYER',
          })),
        },
      },
      include: { signatures: true },
    });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/esign error:', error);
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  let access;
  try {
    access = await requireWorkspaceAccess(session);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, action, title, terms } = body;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const contract = await prisma.contract.findFirst({
      where: { id, workspaceId: access.workspaceId },
      include: { signatures: true },
    });
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });

    if (action === 'send') {
      if (contract.status !== 'DRAFT') {
        return NextResponse.json({ error: `Only DRAFT contracts can be sent (current: ${contract.status})` }, { status: 400 });
      }
      // Integrity anchor: hash the exact content parties are agreeing to.
      const documentHash = hashDocument({
        title: contract.title,
        contractType: contract.contractType,
        terms: contract.terms,
        parties: contract.signatures.map(s => ({ name: s.partyName, email: s.partyEmail, role: s.role })),
      });
      const updated = await prisma.contract.update({
        where: { id },
        data: { status: 'SENT', sentAt: new Date(), documentHash },
        include: { signatures: true },
      });
      return NextResponse.json({ contract: updated });
    }

    if (action === 'void') {
      if (contract.status === 'COMPLETED') {
        return NextResponse.json({ error: 'Completed contracts cannot be voided' }, { status: 400 });
      }
      const updated = await prisma.contract.update({
        where: { id },
        data: { status: 'VOID' },
        include: { signatures: true },
      });
      return NextResponse.json({ contract: updated });
    }

    if (action === 'update') {
      if (contract.status !== 'DRAFT') {
        return NextResponse.json({ error: 'Only DRAFT contracts can be edited — sending locks the content' }, { status: 400 });
      }
      const updated = await prisma.contract.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(terms !== undefined ? { terms: JSON.stringify(terms) } : {}),
        },
        include: { signatures: true },
      });
      return NextResponse.json({ contract: updated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('PATCH /api/esign error:', error);
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  let access;
  try {
    access = await requireWorkspaceAccess(session);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  try {
    const result = await prisma.contract.deleteMany({ where: { id, workspaceId: access.workspaceId, status: 'DRAFT' } });
    if (result.count === 0) {
      return NextResponse.json({ error: 'Only DRAFT contracts can be deleted (or not found)' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/esign error:', error);
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 });
  }
}
