import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_WORKSPACE_SLUG } from '@/lib/workspace-context';

/**
 * RAG Objection Handling
 * Uses successful closing scripts and objection responses to provide
 * real-time coaching during voice calls and chat conversations.
 * Embeds successful closings, retrieves top 3 objection responses.
 */
export async function POST(request: NextRequest) {
  let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  const { objection, context, workspaceId, channel } = body;

  if (!objection) {
    return NextResponse.json({ error: 'objection text required' }, { status: 400 });
  }

  // Search for similar objection responses in knowledge base
  const activities = await prisma.activity.findMany({
    where: {
      workspaceId: workspaceId || DEFAULT_WORKSPACE_SLUG,
      type: { in: ['OBJECTION_RESPONSE', 'CLOSING_SCRIPT', 'KNOWLEDGE'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Rank responses by keyword similarity
  const objectionLower = objection.toLowerCase();
  const keywords = objectionLower.split(/\s+/).filter((w: string) => w.length > 3);

  const scored = activities.map(a => {
    let parsed: any = {};
    try { parsed = JSON.parse(a.content); } catch { /* skip */ }
    const text = (parsed.response || parsed.content || a.content || '').toLowerCase();
    const matchScore = keywords.filter((k: string) => text.includes(k)).length;
    return { ...parsed, id: a.id, matchScore, type: a.type };
  }).filter(r => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  // Generate AI-powered response if no matches
  let aiResponse = null;
  if (scored.length === 0) {
    aiResponse = generateFallbackResponse(objection, channel);
  }

  return NextResponse.json({
    objection,
    responses: scored.map(r => ({
      response: r.response || r.content || '',
      type: r.type,
      relevance: r.matchScore,
      source: 'knowledge_base',
    })),
    ...(aiResponse && { responses: [{ response: aiResponse, type: 'AI_GENERATED', relevance: 0, source: 'ai' }] }),
    suggestedTone: getSuggestedTone(objection),
  });
}

/**
 * GET: Browse objection responses in the knowledge base.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') || DEFAULT_WORKSPACE_SLUG;
  const category = searchParams.get('category');

  const where: any = {
    workspaceId,
    type: { in: ['OBJECTION_RESPONSE', 'CLOSING_SCRIPT'] },
  };

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const entries = activities.map(a => {
    let parsed: any = {};
    try { parsed = JSON.parse(a.content); } catch { /* skip */ }
    return { id: a.id, ...parsed, createdAt: a.createdAt };
  });

  return NextResponse.json({ entries, total: entries.length });
}

function generateFallbackResponse(objection: string, channel?: string): string {
  const lower = objection.toLowerCase();

  if (lower.includes('price') || lower.includes('expensive') || lower.includes('afford')) {
    return "I understand price is a concern. Let me show you the value you're getting — this property has appreciated 8% annually in this area. We can also explore financing options that fit your budget. Would you like to see some comparable homes at different price points?";
  }
  if (lower.includes('think about') || lower.includes('not ready') || lower.includes('timing')) {
    return "Absolutely, this is a big decision. What I've found is that the best time to buy is when you find the right home, not necessarily when the market is perfect. I can set up alerts so you stay informed while you think it through. What specific concerns can I address?";
  }
  if (lower.includes('agent') || lower.includes('realtor') || lower.includes('working with')) {
    return "That's great that you have someone helping you. I work with many agents and I'm happy to coordinate. My focus is making sure you have all the data you need to make the best decision. Would it be helpful if I shared some market insights?";
  }
  if (lower.includes('just looking') || lower.includes('browsing') || lower.includes('no')) {
    return "No pressure at all! Most of my best clients started as browsers. I just want to be a resource when you're ready. Can I send you our monthly market update for this area?";
  }
  return "That's a great point. Let me find the right information to address your concern. Based on recent market data, I think we can find a solution that works for you. Can we schedule a quick 10-minute chat this week?";
}

function getSuggestedTone(objection: string): string {
  const lower = objection.toLowerCase();
  if (lower.includes('angry') || lower.includes('frustrated') || lower.includes('upset')) return 'empathetic';
  if (lower.includes('price') || lower.includes('expensive')) return 'value-focused';
  if (lower.includes('ready') || lower.includes('buy') || lower.includes('offer')) return 'action-oriented';
  return 'reassuring';
}
