import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { qualifyLead } from '@/lib/ai/qualify';

/**
 * POST /api/leads/[id]/qualify — Run AI qualification on a lead.
 * GET  /api/leads/[id]/qualify — Get latest qualification for a lead.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const result = await qualifyLead(id);
    if (!result) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    return NextResponse.json({
      success: true,
      score: result.score,
      grade: result.grade,
      reasoning: result.reasoning,
      factors: result.factors,
    });
  } catch (error) {
    console.error('Qualification error:', error);
    return NextResponse.json({ error: 'Failed to qualify lead' }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const qualification = await prisma.leadQualification.findFirst({
    where: { leadId: id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ qualification });
}
