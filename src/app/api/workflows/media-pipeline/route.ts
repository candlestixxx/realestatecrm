import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { AutomationTriggerService } from '@/lib/media-pipeline/automation-trigger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  try {
    // Authenticate the user session or check an API token
    await requireWorkspaceAccess(session);

    const body = await request.json().catch(() => ({}));
    
    // Trigger the integrated media pipeline directly
    const result = await AutomationTriggerService.triggerPipeline({
      event: body.event || 'manual',
      listingId: body.listingId || `listing-${Date.now()}`,
      address: body.address || '123 Main St',
      agentId: session?.user?.email || 'unknown',
      statusUpdate: body.statusUpdate
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Media pipeline API failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized or request failed' },
      { status: 401 }
    );
  }
}
