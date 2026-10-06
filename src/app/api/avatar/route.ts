import { NextRequest, NextResponse } from 'next/server';

/**
 * DeepFake Avatar Video Sync
 * Integrates HeyGen/D-ID for live video avatars during calls.
 * Creates a talking avatar synchronized with the voice agent.
 */
export async function POST(request: NextRequest) {
  let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  const { action, avatarId, text, voiceId, callSid, provider } = body;

  const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
  const DID_API_KEY = process.env.DID_API_KEY;

  if (action === 'create-session') {
    // Create a live avatar session
    if (provider === 'heygen' && HEYGEN_API_KEY) {
      try {
        const resp = await fetch('https://api.heygen.com/v1/streaming.create', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + HEYGEN_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            avatar_id: avatarId || 'default',
            voice_id: voiceId,
            quality: 'high',
          }),
          signal: AbortSignal.timeout(15000),
        });
        const data = await resp.json();
        return NextResponse.json({
          provider: 'heygen',
          sessionId: data.data?.session_id,
          streamUrl: data.data?.url,
          sdp: data.data?.sdp,
          iceServers: data.data?.ice_servers,
          status: 'created',
        });
      } catch (e: any) {
        return NextResponse.json({ error: 'HeyGen session failed: ' + e.message }, { status: 500 });
      }
    }

    if (provider === 'd-id' && DID_API_KEY) {
      try {
        const resp = await fetch('https://api.d-id.com/talks', {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + DID_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_url: avatarId || 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg',
            script: { type: 'text', input: text || 'Hello!', provider: { type: 'elevenlabs', voice_id: voiceId } },
          }),
          signal: AbortSignal.timeout(15000),
        });
        const data = await resp.json();
        return NextResponse.json({
          provider: 'd-id',
          talkId: data.id,
          status: data.status || 'created',
          resultUrl: data.result_url,
        });
      } catch (e: any) {
        return NextResponse.json({ error: 'D-ID talk failed: ' + e.message }, { status: 500 });
      }
    }

    // Mock response for development
    return NextResponse.json({
      provider: 'mock',
      sessionId: 'mock-session-' + Date.now(),
      streamUrl: 'wss://mock-avatar-stream.example.com/live',
      status: 'created',
      message: 'Configure HEYGEN_API_KEY or DID_API_KEY for live avatars',
    });
  }

  if (action === 'speak') {
    // Validate text before using .length — undefined text crashes with 500
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required for speak action' }, { status: 400 });
    }
    // Send text to avatar for lip-sync
    return NextResponse.json({
      status: 'speaking',
      text,
      duration: Math.max(text.length * 60, 1000),
    });
  }

  if (action === 'end-session') {
    return NextResponse.json({ status: 'ended', callSid });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

/**
 * GET: List available avatars.
 */
export async function GET() {
  return NextResponse.json({
    avatars: [
      { id: 'default', name: 'Professional Agent', provider: 'heygen', gender: 'female' },
      { id: 'male-agent', name: 'Business Agent', provider: 'heygen', gender: 'male' },
      { id: 'friendly-female', name: 'Friendly Agent', provider: 'd-id', gender: 'female' },
    ],
    providers: {
      heygen: { configured: !!process.env.HEYGEN_API_KEY },
      did: { configured: !!process.env.DID_API_KEY },
    },
  });
}
