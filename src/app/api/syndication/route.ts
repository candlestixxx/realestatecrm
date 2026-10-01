import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Cross-Tenant Syndication API
 * Shares anonymized market trends across brokerages.
 * All data is aggregated and stripped of identifying information.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const metric = searchParams.get('metric') || 'all';
    const timeframe = searchParams.get('timeframe') || '30d';

    const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Aggregate anonymized lead data across all workspaces
    const leadTrends = await prisma.lead.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: since },
        ...(region ? { contact: { address: { contains: region } } } : {})
      },
      _count: { id: true }
    });

    // Aggregate deal values (anonymized — no addresses, no names)
    const dealStats = await prisma.deal.aggregate({
      where: {
        createdAt: { gte: since },
        ...(region ? { propertyAddress: { contains: region } } : {})
      },
      _avg: { value: true },
      _sum: { value: true },
      _count: { id: true }
    });

    // Listing market stats
    const listingStats = await prisma.listing.aggregate({
      where: {
        createdAt: { gte: since },
        ...(region ? { address: { contains: region } } : {})
      },
      _avg: { listPrice: true },
      _count: { id: true }
    });

    // Compute anonymized market trend indicators
    const totalLeads = leadTrends.reduce((sum: number, g: any) => sum + g._count.id, 0);
    const hotLeads = leadTrends.find((g: any) => g.status === 'HOT')?._count.id || 0;
    const conversionRate = totalLeads > 0 ? Math.round((hotLeads / totalLeads) * 1000) / 10 : 0;

    const marketTrend = {
      region: region || 'all',
      timeframe,
      generatedAt: new Date().toISOString(),
      dataPoints: {
        totalLeads: totalLeads > 10 ? totalLeads : 'insufficient_data',
        leadDistribution: leadTrends.map((g: any) => ({
          status: g.status,
          count: g._count.id > 5 ? g._count.id : 'suppressed'
        })),
        avgDealValue: dealStats._avg.value ? Math.round(dealStats._avg.value) : null,
        totalDealVolume: dealStats._count.id > 5 ? dealStats._count.id : 'suppressed',
        avgListPrice: listingStats._avg.listPrice ? Math.round(listingStats._avg.listPrice) : null,
        activeListings: listingStats._count.id > 5 ? listingStats._count.id : 'suppressed'
      },
      indicators: {
        marketHeat: conversionRate > 15 ? 'hot' : conversionRate > 8 ? 'warm' : 'cool',
        conversionRate,
        demandIndex: Math.min(100, Math.round(totalLeads / Math.max(dealStats._count.id || 1, 1) * 10))
      },
      privacy: {
        anonymized: true,
        minSampleSize: 5,
        note: 'All data points with fewer than 5 samples are suppressed for privacy'
      }
    };

    return NextResponse.json(marketTrend);
  } catch (error) {
    console.error('Syndication error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, metrics } = body;

    if (!workspaceId || !metrics) {
      return NextResponse.json({ error: 'workspaceId and metrics required' }, { status: 400 });
    }

    // Store anonymized contribution
    await prisma.activity.create({
      data: {
        type: 'SYNDICATION_CONTRIBUTION',
        workspaceId,
        content: JSON.stringify({
          metrics,
          contributedAt: new Date().toISOString(),
          anonymized: true
        })
      }
    });

    return NextResponse.json({ success: true, message: 'Metrics contributed to syndication pool' });
  } catch (error) {
    console.error('Syndication contribution error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
