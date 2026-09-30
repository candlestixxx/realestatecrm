import prisma from '@/lib/prisma';
import { createProviderClient } from '@/lib/ai/llm-providers';

/**
 * AI Lead Qualification Engine
 *
 * Scores leads 0-100 and grades them HOT/WARM/COLD based on
 * contact data, activity history, and engagement signals.
 */

interface QualificationResult {
  score: number;
  grade: 'HOT' | 'WARM' | 'COLD';
  reasoning: string;
  factors: Record<string, number>;
}

export async function qualifyLead(leadId: string): Promise<QualificationResult | null> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      contact: true,
      Activity: { orderBy: { createdAt: 'desc' }, take: 10 },
      tasks: true,
    },
  });

  if (!lead) return null;

  // Build context for LLM
  const activitySummary = lead.Activity.map(a =>
    `[${a.createdAt.toISOString().split('T')[0]}] ${a.type}: ${a.content.slice(0, 100)}`
  ).join('\n');

  const prompt = `Score this real estate lead from 0-100 for conversion potential.

Lead Profile:
- Name: ${lead.contact.firstName} ${lead.contact.lastName || ''}
- Email: ${lead.contact.email || 'none'}
- Phone: ${lead.contact.phone || 'none'}
- Status: ${lead.status}
- Source: ${lead.source || 'unknown'}
- Tags: ${lead.tags || 'none'}
- Score (existing): ${lead.score || 0}
- Created: ${lead.createdAt.toISOString().split('T')[0]}
- Has email: ${!!lead.contact.email}
- Has phone: ${!!lead.contact.phone}

Recent Activity:
${activitySummary || 'No activity yet'}

Open Tasks: ${lead.tasks.filter(t => t.status !== 'DONE').length}

Scoring criteria:
- Complete contact info (email + phone): +15
- Recent engagement (activity in last 7 days): +20
- Multiple interactions: +15
- HOT status: +20, ACTIVE: +10
- Has open follow-up tasks: +10
- Lead age < 48h: +10
- Source quality (Zillow/Realtor/referral): +10

Respond with ONLY a JSON object:
{"score": <0-100>, "grade": "HOT|WARM|COLD", "reasoning": "<2-3 sentence explanation>", "factors": {"contact_completeness": <0-15>, "engagement": <0-20>, "interaction_depth": <0-15>, "status_quality": <0-20>, "follow_up": <0-10>, "freshness": <0-10>, "source_quality": <0-10>}}`;

  try {
    // Try LLM-based scoring
    const apiKeyRecord = await prisma.apiKey.findFirst({ where: { provider: 'openai' } });
    if (apiKeyRecord) {
      const { decrypt } = await import('@/lib/encryption');
      const key = decrypt(apiKeyRecord.key);
      const client = createProviderClient('openai', 'gpt-4o-mini', key);
      const result = await client.complete({
        prompt,
        system: 'You are a real estate lead scoring AI. Respond only with valid JSON.',
      });

      const parsed = JSON.parse(result.text);
      const qualification = {
        leadId,
        score: Math.min(100, Math.max(0, parsed.score || 0)),
        grade: parsed.grade || (parsed.score >= 70 ? 'HOT' : parsed.score >= 40 ? 'WARM' : 'COLD'),
        reasoning: parsed.reasoning || '',
        factors: JSON.stringify(parsed.factors || {}),
        model: 'gpt-4o-mini',
      };

      await prisma.leadQualification.create({ data: qualification });
      await prisma.lead.update({ where: { id: leadId }, data: { score: qualification.score } });

      return {
        score: qualification.score,
        grade: qualification.grade as 'HOT' | 'WARM' | 'COLD',
        reasoning: qualification.reasoning,
        factors: parsed.factors || {},
      };
    }
  } catch (err) {
    console.warn('[Qualification] LLM scoring failed, using rule-based fallback:', err);
  }

  // Rule-based fallback scoring
  return ruleBasedQualification(lead);
}

function ruleBasedQualification(lead: {
  status: string;
  source: string | null;
  score: number | null;
  createdAt: Date;
  contact: { email: string | null; phone: string | null };
  Activity: unknown[];
  tasks: { status: string }[];
}): QualificationResult {
  const factors: Record<string, number> = {};

  // Contact completeness (0-15)
  let contactScore = 0;
  if (lead.contact.email) contactScore += 8;
  if (lead.contact.phone) contactScore += 7;
  factors['contact_completeness'] = contactScore;

  // Engagement — activity in last 7 days (0-20)
  const recentActivity = lead.Activity.length > 0 ? 20 : 0;
  factors['engagement'] = recentActivity;

  // Interaction depth (0-15)
  const interactionScore = Math.min(15, lead.Activity.length * 3);
  factors['interaction_depth'] = interactionScore;

  // Status quality (0-20)
  const statusMap: Record<string, number> = {
    'HOT': 20, 'ACTIVE': 10, 'NEW': 5, 'COLD': 2,
    'CLOSED_WON': 15, 'CLOSED_LOST': 0,
  };
  factors['status_quality'] = statusMap[lead.status] ?? 5;

  // Follow-up tasks (0-10)
  const openTasks = lead.tasks.filter(t => t.status !== 'DONE').length;
  factors['follow_up'] = openTasks > 0 ? 10 : 0;

  // Freshness (0-10)
  const ageHours = (Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60);
  factors['freshness'] = ageHours < 48 ? 10 : ageHours < 168 ? 5 : 0;

  // Source quality (0-10)
  const goodSources = ['zillow', 'realtor.com', 'referral', 'sphere'];
  factors['source_quality'] = lead.source && goodSources.some(s => lead.source!.toLowerCase().includes(s)) ? 10 : 3;

  const totalScore = Object.values(factors).reduce((a, b) => a + b, 0);
  const grade = totalScore >= 70 ? 'HOT' : totalScore >= 40 ? 'WARM' : 'COLD';

  return {
    score: totalScore,
    grade,
    reasoning: `Rule-based score: ${totalScore}/100. Contact: ${contactScore}/15, Engagement: ${recentActivity}/20, Interactions: ${interactionScore}/15.`,
    factors,
  };
}
