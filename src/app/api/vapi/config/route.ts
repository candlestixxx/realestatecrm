import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/vapi/config — Vapi client-side call configuration.
 *
 * Returns PUBLIC values only (public key is designed for browser exposure).
 * The browser SDK needs these to start AI outbound calls; the private key
 * never leaves the server. Served dynamically so deploys don't require a
 * rebuild to change keys (NEXT_PUBLIC_* would be inlined at build time).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const publicKey = process.env.VAPI_PUBLIC_KEY;
  const assistantId = process.env.VAPI_ASSISTANT_ID;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

  return NextResponse.json({
    publicKey: publicKey || null,
    assistantId: assistantId || null,
    phoneNumberId: phoneNumberId || null,
    // Hint for the UI: AI calling is available only when the full set exists.
    configured: Boolean(publicKey && assistantId && phoneNumberId),
  });
}
