// MLS credential crypto - pure helpers, no DB imports (unit-testable).
// Why: a realtor's MLS password/token is the keys to licensed data. It is
// encrypted at rest with AES-256-GCM and only ever decrypted server-side
// for the outbound MLS call. Never returned to the browser, never logged.
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

function key(): Buffer {
  const raw = process.env.MLS_ENC_KEY || '';
  if (raw) {
    const b = Buffer.from(raw, 'base64');
    if (b.length === 32) return b;
    return createHash('sha256').update(raw).digest();
  }
  const fallback = process.env.NEXTAUTH_SECRET || '';
  if (fallback) return createHash('sha256').update('mls:' + fallback).digest();
  throw new Error('MLS_ENC_KEY (or NEXTAUTH_SECRET) must be set to store MLS credentials.');
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':');
}

export function decryptSecret(payload: string): string {
  const parts = payload.split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') throw new Error('Bad credential payload.');
  const [, ivB, tagB, encB] = parts;
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivB, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(encB, 'base64')), decipher.final()]).toString('utf8');
}

export function maskSecret(secret: string): string {
  if (!secret) return '';
  if (secret.length <= 4) return '****';
  return '****' + secret.slice(-4);
}