import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>;

const KEY_LENGTH = 64;

/** Salted scrypt hash — never store or log the plaintext password (CLAUDE.md non-negotiable). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  const stored_ = Buffer.from(hashHex, 'hex');
  if (derived.length !== stored_.length) return false;
  return timingSafeEqual(derived, stored_);
}

/** SPEC.md: 8+ characters with a number and a symbol. */
export function isPasswordStrongEnough(password: string): boolean {
  return /^(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}
