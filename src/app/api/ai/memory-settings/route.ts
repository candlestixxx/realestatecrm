import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// AI memory settings are stored in the Activity model (type=AI_MEMORY)
// following the established pattern for experimental features — no new
// Prisma models needed. Content is JSON.

const ACTIVITY_TYPE = 'AI_MEMORY';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activity = await prisma.activity.findFirst({
    where: {
      type: ACTIVITY_TYPE,
      userId: session.user.id,
    },
    orderBy: { createdAt: 'desc' },
  });

  const settings = activity?.content ? JSON.parse(activity.content) : {
    rememberConversations: true,
    retentionDays: 30,
    customInstructions: '',
    learningEnabled: true,
    personalizationEnabled: true,
    dataExportRequested: false,
    dataDeletionRequested: false,
  };

  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  await prisma.activity.create({
    data: {
      type: ACTIVITY_TYPE,
      content: JSON.stringify(body),
      userId: session.user.id,
    },
  });

  return NextResponse.json({ ok: true });
}
