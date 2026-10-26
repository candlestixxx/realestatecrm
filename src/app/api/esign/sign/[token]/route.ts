import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Public e-signing endpoint — accessed by signing parties via their invite
 * token (no app login required; the token IS the credential, like DocuSign
 * envelope links). Capture layer records ESIGN-style attribution:
 * signature text, consent, timestamp, IP, user agent.
 */

function hashDocument(payload: object): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const signature = await prisma.contractSignature.findUnique({
      where: { inviteToken: token },
      include: { contract: { include: { signatures: true, workspace: {
        select: { name: true, logoUrl: true, primaryColor: true, accentColor: true, brokeragePhone: true, brokerageAddress: true, emailFooter: true },
      } } } },
    });
    if (!signature) return NextResponse.json({ error: 'Invalid signing link' }, { status: 404 });

    const c = signature.contract;
    if (c.status === 'VOID') return NextResponse.json({ error: 'This contract has been voided' }, { status: 410 });

    return NextResponse.json({
      branding: c.workspace ? {
        name: c.workspace.name,
        logoUrl: c.workspace.logoUrl,
        primaryColor: c.workspace.primaryColor,
        accentColor: c.workspace.accentColor,
        brokeragePhone: c.workspace.brokeragePhone,
        brokerageAddress: c.workspace.brokerageAddress,
        emailFooter: c.workspace.emailFooter,
      } : null,
      contract: {
        id: c.id,
        title: c.title,
        contractType: c.contractType,
        status: c.status,
        terms: c.terms ? JSON.parse(c.terms) : null,
        sentAt: c.sentAt,
        // Show parties without leaking invite tokens of other parties.
        parties: c.signatures.map(s => ({
          name: s.partyName, role: s.role, status: s.status,
          signedAt: s.signedAt, isYou: s.id === signature.id,
        })),
      },
      yourParty: {
        name: signature.partyName,
        email: signature.partyEmail,
        role: signature.role,
        status: signature.status,
      },
    });
  } catch (error: any) {
    console.error('GET /api/esign/sign error:', error);
    return NextResponse.json({ error: 'Failed to load signing view' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const body = await request.json();
    const { signatureText, consent, action, declineReason } = body;

    const signature = await prisma.contractSignature.findUnique({
      where: { inviteToken: token },
      include: { contract: { include: { signatures: true } } },
    });
    if (!signature) return NextResponse.json({ error: 'Invalid signing link' }, { status: 404 });

    const contract = signature.contract;
    if (contract.status === 'VOID') return NextResponse.json({ error: 'This contract has been voided' }, { status: 410 });
    if (contract.status === 'DRAFT') return NextResponse.json({ error: 'This contract has not been sent yet' }, { status: 400 });
    if (signature.status !== 'PENDING') {
      return NextResponse.json({ error: `Already ${signature.status.toLowerCase()}` }, { status: 400 });
    }

    if (action === 'decline') {
      await prisma.contractSignature.update({
        where: { id: signature.id },
        data: { status: 'DECLINED', declinedReason: declineReason || null, ipAddress: clientIp(request), userAgent: request.headers.get('user-agent') || null },
      });
      await prisma.contract.update({ where: { id: contract.id }, data: { status: 'VOID' } });
      return NextResponse.json({ success: true, status: 'DECLINED' });
    }

    // Sign
    if (!signatureText || typeof signatureText !== 'string' || signatureText.trim().length < 3) {
      return NextResponse.json({ error: 'Typed signature is required' }, { status: 400 });
    }
    if (consent !== true) {
      return NextResponse.json({ error: 'Electronic signature consent is required' }, { status: 400 });
    }

    // Integrity check: the content at send-time must still hash to the anchor.
    if (contract.documentHash) {
      const recomputed = hashDocument({
        title: contract.title,
        contractType: contract.contractType,
        terms: contract.terms,
        parties: contract.signatures.map(s => ({ name: s.partyName, email: s.partyEmail, role: s.role })),
      });
      if (recomputed !== contract.documentHash) {
        return NextResponse.json({ error: 'Contract content changed after sending — signing blocked' }, { status: 409 });
      }
    }

    const updated = await prisma.contractSignature.update({
      where: { id: signature.id },
      data: {
        status: 'SIGNED',
        signatureText: signatureText.trim(),
        signedAt: new Date(),
        ipAddress: clientIp(request),
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    // Roll up contract status.
    const remaining = await prisma.contractSignature.count({
      where: { contractId: contract.id, status: 'PENDING' },
    });
    const signedCount = await prisma.contractSignature.count({
      where: { contractId: contract.id, status: 'SIGNED' },
    });

    let contractStatus = 'PARTIALLY_SIGNED';
    let completedAt: Date | null = null;
    if (remaining === 0 && signedCount > 0) {
      contractStatus = 'COMPLETED';
      completedAt = new Date();
    }
    await prisma.contract.update({
      where: { id: contract.id },
      data: { status: contractStatus, ...(completedAt ? { completedAt } : {}) },
    });

    return NextResponse.json({ success: true, status: updated.status, contractStatus });
  } catch (error: any) {
    console.error('POST /api/esign/sign error:', error);
    return NextResponse.json({ error: 'Failed to record signature' }, { status: 500 });
  }
}
