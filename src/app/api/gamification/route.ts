import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Gamification Engine
 * Points, badges, and leaderboards for agents based on:
 * - Workflow executions
 * - Leads enriched
 * - Outbound volume
 * - Deals closed
 */

const POINTS: Record<string, number> = {
  LEAD_CREATED: 5,
  LEAD_ENRICHED: 10,
  LEAD_QUALIFIED: 15,
  CALL_MADE: 8,
  EMAIL_SENT: 3,
  SMS_SENT: 3,
  SHOWING_SCHEDULED: 20,
  OFFER_WRITTEN: 30,
  DEAL_CLOSED: 100,
  LISTING_CREATED: 25,
  CONTENT_PUBLISHED: 12,
  REFERRAL_SENT: 15,
  WORKFLOW_COMPLETED: 10,
  SKIP_TRACE_COMPLETED: 10,
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') || 'excel-legacy-team';
  const period = searchParams.get('period') || 'all'; // all, month, week

  const since = period === 'week' ? new Date(Date.now() - 7 * 86400000)
    : period === 'month' ? new Date(Date.now() - 30 * 86400000)
    : new Date(0);

  // Fetch all activities for scoring
  const activities = await prisma.activity.findMany({
    where: {
      workspaceId,
      createdAt: { gte: since },
      userId: { not: null },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    take: 5000,
  });

  // Score each user
  const userScores = new Map<string, { name: string; email: string; points: number; breakdown: Record<string, number> }>();

  for (const a of activities) {
    if (!a.user) continue;
    const userId = a.user.id;
    const points = POINTS[a.type] || 2;

    if (!userScores.has(userId)) {
      userScores.set(userId, { name: a.user.name || a.user.email || userId, email: a.user.email || '', points: 0, breakdown: {} });
    }

    const entry = userScores.get(userId)!;
    entry.points += points;
    entry.breakdown[a.type] = (entry.breakdown[a.type] || 0) + 1;
  }

  // Sort leaderboard
  const leaderboard = Array.from(userScores.entries())
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 50);

  // Assign badges
  const badges = leaderboard.map((entry, index) => {
    const earned: string[] = [];
    if (entry.points >= 500) earned.push('Century Club');
    if (entry.points >= 200) earned.push('High Achiever');
    if (entry.points >= 100) earned.push('Rising Star');
    if ((entry.breakdown.DEAL_CLOSED || 0) >= 3) earned.push('Closer');
    if ((entry.breakdown.CALL_MADE || 0) >= 20) earned.push('Dialer Pro');
    if ((entry.breakdown.LEAD_ENRICHED || 0) >= 15) earned.push('Data Wizard');
    if (index === 0) earned.push('Top Performer');
    return { ...entry, rank: index + 1, badges: earned };
  });

  return NextResponse.json({
    leaderboard: badges,
    period,
    totalParticipants: badges.length,
    pointsSystem: POINTS,
    generatedAt: new Date().toISOString(),
  });
}

/**
 * POST: Award points for a specific action.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, userId, workspaceId, metadata } = body;

  if (!action || !userId) {
    return NextResponse.json({ error: 'action and userId required' }, { status: 400 });
  }

  const points = POINTS[action] || 2;

  await prisma.activity.create({
    data: {
      type: 'GAMIFICATION',
      content: JSON.stringify({ action, points, metadata: metadata || {} }),
      userId,
      workspaceId: workspaceId || 'excel-legacy-team',
    },
  });

  return NextResponse.json({ action, points, awarded: true });
}
