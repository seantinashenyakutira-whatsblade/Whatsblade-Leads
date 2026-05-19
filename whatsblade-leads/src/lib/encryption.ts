import crypto from 'crypto';
import { env } from '@/lib/env';

const ALGORITHM = 'aes-256-gcm';

let _key: Buffer | null = null;

function getKey(): Buffer {
  if (!_key) {
    _key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  }
  return _key;
}

export function encrypt(plaintext: string): {
  encrypted: Buffer;
  iv: Buffer;
  tag: Buffer;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return { encrypted, iv, tag };
}

export function decrypt(
  encrypted: Buffer,
  iv: Buffer,
  tag: Buffer
): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString('utf8');
}
