// MLS connection - the ONE connection point for the calculator.
// Why: every realtor has approved MLS credentials (Realcomp, connected to
// BS&A / Realist tax data + the MLS listing itself). When the realtor logs
// into the calculator, that login activates this connection and every
// layer (records, listings, buyer matches) reads through the agent's own
// licensed access. Secrets stay encrypted server-side (mls-crypto).
import prisma from './prisma';
import { encryptSecret, decryptSecret, maskSecret } from './mls-crypto';

export type MlsStatus = {
  connected: boolean;
  provider: string;
  mlsUsername: string | null;
  maskedSecret: string | null;
  status: string;
  lastTestedAt: Date | null;
};

export async function getMlsStatus(userId: string): Promise<MlsStatus> {
  const row = await prisma.mlsCredential.findUnique({ where: { userId_provider: { userId, provider: 'realcomp' } } });
  if (!row) return { connected: false, provider: 'realcomp', mlsUsername: null, maskedSecret: null, status: 'not_connected', lastTestedAt: null };
  let masked: string | null = null;
  try { masked = maskSecret(decryptSecret(row.secretEnc)); } catch { masked = '****'; }
  return { connected: row.status === 'connected', provider: row.provider, mlsUsername: row.mlsUsername, maskedSecret: masked, status: row.status, lastTestedAt: row.lastTestedAt };
}

export async function saveMlsCredential(userId: string, workspaceId: string, mlsUsername: string, secret: string) {
  const secretEnc = encryptSecret(secret);
  return prisma.mlsCredential.upsert({
    where: { userId_provider: { userId, provider: 'realcomp' } },
    create: { userId, workspaceId, provider: 'realcomp', mlsUsername, secretEnc, status: 'saved_unverified' },
    update: { workspaceId, mlsUsername, secretEnc, status: 'saved_unverified' },
  });
}

export async function disconnectMls(userId: string) {
  await prisma.mlsCredential.deleteMany({ where: { userId, provider: 'realcomp' } });
}

// Live token for outbound MLS calls. Server-side only.
export async function getMlsToken(userId: string): Promise<{ username: string; token: string } | null> {
  const row = await prisma.mlsCredential.findUnique({ where: { userId_provider: { userId, provider: 'realcomp' } } });
  if (!row) return null;
  try { return { username: row.mlsUsername, token: decryptSecret(row.secretEnc) }; } catch { return null; }
}

// Test the agent's credentials against Realcomp (RESO-style endpoint).
// Honest outcomes: connected / failed (provider said no) / unconfigured
// (no provider URL reachable). A failed test never fakes a connection.
export async function testMlsConnection(userId: string): Promise<{ ok: boolean; message: string }> {
  const cred = await getMlsToken(userId);
  if (!cred) return { ok: false, message: 'No MLS credentials saved for this agent.' };
  const base = process.env.REALCOMP_API_URL || 'https://api.realcomp.com/v1';
  try {
    const resp = await fetch(base + '/properties?$top=1', {
      headers: { Authorization: 'Bearer ' + cred.token, 'X-MLS-Username': cred.username },
      signal: AbortSignal.timeout(15000),
    });
    const ok = resp.ok;
    await prisma.mlsCredential.updateMany({ where: { userId, provider: 'realcomp' }, data: { status: ok ? 'connected' : 'failed', lastTestedAt: new Date() } });
    return { ok, message: ok ? 'MLS live - Realcomp accepted these credentials.' : 'Realcomp rejected these credentials (HTTP ' + resp.status + '). Check MLS ID / token.' };
  } catch {
    await prisma.mlsCredential.updateMany({ where: { userId, provider: 'realcomp' }, data: { status: 'saved_unverified', lastTestedAt: new Date() } });
    return { ok: false, message: 'Could not reach Realcomp from this server. Credentials saved - test again when the provider is reachable.' };
  }
}