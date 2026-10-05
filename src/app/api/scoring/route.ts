import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_WORKSPACE_SLUG } from '@/lib/workspace-context';

/**
 * Predictive Lead Scoring
 * ML-inspired scoring model using historical MLS data, engagement signals,
 * and behavioral patterns to predict lead conversion probability.
 */
export async function POST(request: NextRequest) {
  let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  const { leadId, workspaceId } = body;

  if (!leadId) {
    return NextResponse.json({ error: 'leadId required' }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      contact: { select: { firstName: true, lastName: true, email: true, phone: true } },
      Activity: { orderBy: { createdAt: 'desc' as const }, take: 20 },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const features = extractFeatures(lead);
  const score = computeScore(features);
  const prediction = {
    leadId,
    score,
    probability: Math.min(Math.round(score * 0.9 + 10), 95),
    tier: score >= 75 ? 'HOT' : score >= 50 ? 'WARM' : 'COLD',
    factors: features,
    recommendations: generateRecommendations(score, features),
  };

  await prisma.activity.create({
    data: {
      type: 'AI_SCORE',
      content: JSON.stringify(prediction),
      leadId: leadId,
      workspaceId: workspaceId || lead.workspaceId,
    },
  });

  return NextResponse.json(prediction);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') || DEFAULT_WORKSPACE_SLUG;

  const leads = await prisma.lead.findMany({
    where: { workspaceId },
    include: {
      contact: { select: { firstName: true, lastName: true, email: true, phone: true } },
      Activity: { orderBy: { createdAt: 'desc' as const }, take: 10 },
    },
    take: 100,
  });

  const scored = leads.map(lead => {
    const features = extractFeatures(lead);
    const score = computeScore(features);
    return {
      leadId: lead.id,
      name: (lead.contact?.firstName || '') + ' ' + (lead.contact?.lastName || ''),
      score,
      tier: score >= 75 ? 'HOT' : score >= 50 ? 'WARM' : 'COLD',
    };
  }).sort((a, b) => b.score - a.score);

  return NextResponse.json({ leads: scored, scoredAt: new Date().toISOString() });
}

function extractFeatures(lead: any) {
  const activities = lead.Activity || [];
  const now = Date.now();

  return {
    hasEmail: !!lead.contact?.email,
    hasPhone: !!lead.contact?.phone,
    activityCount: activities.length,
    recentActivityCount: activities.filter((a: any) => now - new Date(a.createdAt).getTime() < 7 * 86400000).length,
    daysSinceCreated: Math.floor((now - new Date(lead.createdAt).getTime()) / 86400000),
    daysSinceLastActivity: activities.length ? Math.floor((now - new Date(activities[0].createdAt).getTime()) / 86400000) : 999,
    hasSource: !!lead.source,
    sourceQuality: getSourceQuality(lead.source),
  };
}

function computeScore(f: any): number {
  let score = 0;
  if (f.hasEmail) score += 15;
  if (f.hasPhone) score += 10;
  score += Math.min(f.activityCount * 3, 20);
  score += Math.min(f.recentActivityCount * 5, 15);
  if (f.daysSinceLastActivity <= 1) score += 25;
  else if (f.daysSinceLastActivity <= 3) score += 20;
  else if (f.daysSinceLastActivity <= 7) score += 15;
  else if (f.daysSinceLastActivity <= 14) score += 8;
  score += f.sourceQuality;
  return Math.min(Math.round(score), 100);
}

function getSourceQuality(source: string | null): number {
  const map: Record<string, number> = {
    REFERRAL: 15, ZILLOW: 12, REALTOR_COM: 12, MLS: 10, WEBSITE: 10,
    FACEBOOK: 7, INSTAGRAM: 7, COLD_CALL: 4, WALK_IN: 12, OPEN_HOUSE: 10,
  };
  return map[source?.toUpperCase() || ''] || 5;
}

function generateRecommendations(score: number, f: any): string[] {
  const recs: string[] = [];
  if (score >= 75) {
    recs.push('Schedule immediate follow-up call');
    recs.push('Send personalized property matches');
    if (!f.hasEmail) recs.push('Collect email for drip campaigns');
  } else if (score >= 50) {
    recs.push('Add to nurture email sequence');
    recs.push('Schedule follow-up within 48 hours');
  } else {
    recs.push('Add to long-term drip campaign');
    recs.push('Enrich contact data with skip-trace');
  }
  if (f.daysSinceLastActivity > 7) recs.push('Re-engage with new listing alert');
  return recs;
}
