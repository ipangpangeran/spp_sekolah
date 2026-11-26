import crypto from 'node:crypto';

/**
 * Hashes a plaintext password using salted scrypt (`scrypt$<saltHex>$<hashHex>`).
 */
export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

/**
 * Verifies input password against stored scrypt, legacy 32-hex MD5, or plaintext.
 */
export function verifyPassword(input: string, stored: string): boolean {
  if (!stored) return false;

  if (stored.startsWith('scrypt$')) {
    const parts = stored.split('$');
    if (parts.length !== 3) return false;
    const [, salt, hashHex] = parts;
    try {
      const derived = crypto.scryptSync(input, salt, 64);
      const expected = Buffer.from(hashHex, 'hex');
      if (derived.length !== expected.length) return false;
      return crypto.timingSafeEqual(derived, expected);
    } catch {
      return false;
    }
  }

  if (/^[a-f0-9]{32}$/i.test(stored)) {
    const md5 = crypto.createHash('md5').update(input).digest('hex');
    return md5 === stored.toLowerCase();
  }

  return stored === input;
}
