import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getWorkspaceScope } from '@/lib/workspace-context';
import { transcribeSpeech } from '@/lib/voice';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = await getWorkspaceScope(session);
    if (!workspaceId) {
      return NextResponse.json({ error: 'No workspace context' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'audio/webm';

    // In a real application, you would lookup the internal workspace ID corresponding to the slug.
    // Assuming workspaceSlug matches the internal representation here, or using it as the ID proxy:
    // (Ensure voice configuration correctly resolves by the provided ID/slug string).
    const transcription = await transcribeSpeech(workspaceId, buffer, mimeType);

    return NextResponse.json({ text: transcription });
  } catch (error) {
    console.error('Voice API Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
