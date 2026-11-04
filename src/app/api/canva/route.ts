import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_WORKSPACE_SLUG } from '@/lib/workspace-context';

/**
 * Canva Branding Integration
 * Generates deep links to Canva with brand kit pre-applied.
 * Supports: social posts, listing flyers, email headers.
 */
export async function POST(request: NextRequest) {
  let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  const { templateType, brandKitId, content, listingId, workspaceId, outputFormat } = body;

  const CANVA_API_KEY = process.env.CANVA_API_KEY;
  const CANVA_BRAND_ID = process.env.CANVA_BRAND_KIT_ID;

  // Load brand kit from Activity records
  let brandKit = null;
  if (brandKitId) {
    const activity = await prisma.activity.findUnique({ where: { id: brandKitId } }).catch(() => null);
    if (activity) {
      try { brandKit = JSON.parse(activity.content); } catch { /* skip */ }
    }
  }

  // Generate Canva deep link with pre-filled design
  const canvaUrl = buildCanvaDeepLink(templateType, brandKit, content, outputFormat);

  // Track as activity
  await prisma.activity.create({
    data: {
      type: 'CANVA_DESIGN',
      content: JSON.stringify({
        templateType, brandKitId: brandKitId || null,
        content: content || '', listingId: listingId || null,
        canvaUrl, outputFormat: outputFormat || 'png',
      }),
      workspaceId: workspaceId || DEFAULT_WORKSPACE_SLUG,
    },
  });

  return NextResponse.json({
    canvaUrl,
    templateType,
    brandKit: brandKit ? { name: brandKit.name, colors: brandKit.colors, fonts: brandKit.fonts } : null,
    method: CANVA_API_KEY ? 'canva-connect' : 'deep-link',
  });
}

function buildCanvaDeepLink(templateType: string, brandKit: any, content?: string, outputFormat?: string): string {
  const templates: Record<string, string> = {
    'social-post': 'instagram-post',
    'story': 'instagram-story',
    'listing-flyer': 'a4-document',
    'email-header': 'email-header',
    'open-house': 'facebook-event-cover',
    'just-sold': 'facebook-post',
    'market-update': 'presentation-16-9',
    'business-card': 'business-card',
  };

  const designType = templates[templateType] || 'instagram-post';

  // Canva deep link format
  const params = new URLSearchParams({
    designType,
    ...(content && { text: content }),
    ...(brandKit?.colors && { colors: brandKit.colors }),
  });

  return 'https://www.canva.com/design/create?' + params.toString();
}

/**
 * GET: List available Canva templates and brand kits.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') || DEFAULT_WORKSPACE_SLUG;

  const brandKits = await prisma.activity.findMany({
    where: { workspaceId, type: 'BRAND_KIT' },
    orderBy: { createdAt: 'desc' },
    take: 10,
  }).then(activities => activities.map(a => {
    try { return JSON.parse(a.content); } catch { return { id: a.id, name: 'Brand Kit' }; }
  })).catch(() => []);

  return NextResponse.json({
    templates: [
      { type: 'social-post', label: 'Social Media Post', sizes: '1080x1080' },
      { type: 'story', label: 'Instagram Story', sizes: '1080x1920' },
      { type: 'listing-flyer', label: 'Listing Flyer', sizes: 'A4' },
      { type: 'email-header', label: 'Email Header', sizes: '600x200' },
      { type: 'open-house', label: 'Open House Flyer', sizes: '1200x628' },
      { type: 'just-sold', label: 'Just Sold Post', sizes: '1200x630' },
      { type: 'market-update', label: 'Market Update', sizes: '1920x1080' },
      { type: 'business-card', label: 'Business Card', sizes: '1050x600' },
    ],
    brandKits,
    canvaConfigured: !!process.env.CANVA_API_KEY,
  });
}
