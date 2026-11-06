import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

const DEV_FALLBACK = 'a-very-secret-key-that-is-at-least-32-chars-long';
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || DEV_FALLBACK;

// Fail closed in production: never encrypt agent secrets (e.g. MLS tokens)
// under the public fallback key that ships in the repo.
function assertProductionSecret() {
  if (process.env.NODE_ENV === 'production' && ENCRYPTION_SECRET === DEV_FALLBACK) {
    throw new Error('ENCRYPTION_SECRET must be set in production to store encrypted secrets.');
  }
}

const getKey = (salt: Buffer) => crypto.scryptSync(ENCRYPTION_SECRET, salt, KEY_LENGTH);

export const encrypt = (text: string): string => {
  assertProductionSecret();
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey(salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
};

export const decrypt = (encryptedText: string): string => {
  assertProductionSecret();
  try {
    const buffer = Buffer.from(encryptedText, 'base64');
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const key = getKey(salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf8');
  } catch {
    throw new Error('Decryption failed');
  }
};
