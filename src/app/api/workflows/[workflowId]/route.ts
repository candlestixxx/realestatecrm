import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { createEmptyWorkflowSnapshot, type WorkflowSnapshot } from '@/lib/workflow-state';
import { getWorkflowRecord, saveWorkflowRecord } from '@/lib/workflow-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: { workflowId: string } | Promise<{ workflowId: string }>;
};

function normalizeSnapshot(body: unknown): WorkflowSnapshot {
  const candidate = body as Partial<WorkflowSnapshot> | null;

  return {
    ...createEmptyWorkflowSnapshot(),
    ...(candidate ?? {}),
    draft: candidate?.draft ?? {},
    activity: candidate?.activity ?? [],
    lastSavedAt: candidate?.lastSavedAt ?? null,
    banner: candidate?.banner ?? 'Draft ready for editing.',
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { workflowId } = await Promise.resolve(context.params);
  const session = await getServerSession(authOptions);
  
  try {
    await requireWorkspaceAccess(session);
    const record = await getWorkflowRecord(workflowId);

    if (!record) {
      return NextResponse.json({ workflowId, snapshot: createEmptyWorkflowSnapshot(), found: false });
    }

    return NextResponse.json({ ...record, found: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { workflowId } = await Promise.resolve(context.params);
  const session = await getServerSession(authOptions);

  try {
    await requireWorkspaceAccess(session);
    const body = await request.json().catch(() => ({}));
    const snapshot = normalizeSnapshot((body as { snapshot?: unknown }).snapshot ?? body);
    const record = await saveWorkflowRecord(workflowId, snapshot);

    return NextResponse.json({ ...record, found: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
