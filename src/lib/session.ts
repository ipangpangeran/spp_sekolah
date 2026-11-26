import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { getSessionSecret, type SignedSessionPayload } from '@/lib/auth-token';

export type SessionUser = SignedSessionPayload;

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function getSessionFromCookies(): SessionUser | null {
  try {
    const cookieStore = cookies();
    const raw = cookieStore.get('sisma_session')?.value;
    if (!raw) return null;

    const dotIdx = raw.indexOf('.');
    if (dotIdx <= 0) return null;

    const payloadB64 = raw.slice(0, dotIdx);
    const sigB64 = raw.slice(dotIdx + 1);
    if (!payloadB64 || !sigB64) return null;

    const expectedSig = crypto
      .createHmac('sha256', getSessionSecret())
      .update(payloadB64)
      .digest();
    const providedSig = Buffer.from(sigB64, 'base64url');
    if (expectedSig.length !== providedSig.length) return null;
    if (!crypto.timingSafeEqual(expectedSig, providedSig)) return null;

    const parsed = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    ) as SessionUser;
    if (!parsed || typeof parsed.id !== 'number' || !parsed.level) return null;
    if (parsed.createdAt && Date.now() - parsed.createdAt > SESSION_MAX_AGE_MS) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function isAdminSession(): boolean {
  const user = getSessionFromCookies();
  return user?.level === 'admin';
}
