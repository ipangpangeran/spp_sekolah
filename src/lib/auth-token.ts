export interface SignedSessionPayload {
  id: number;
  username: string;
  namaLengkap: string;
  level: string;
  idTahunAjaran?: number | null;
  createdAt: number;
}

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'sisma-internal-session-secret-key-2026'
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Signs a session payload into `<base64url(payload)>.<base64url(hmac)>`.
 */
export async function signSessionToken(payload: SignedSessionPayload): Promise<string> {
  const enc = new TextEncoder();
  const payloadB64 = toBase64Url(enc.encode(JSON.stringify(payload)));
  const key = await getHmacKey(getSessionSecret());
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
  const sigB64 = toBase64Url(new Uint8Array(sigBuf));
  return `${payloadB64}.${sigB64}`;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verifies an HMAC-SHA256 signed session token (Edge & Node compatible).
 */
export async function verifySessionToken(token: string | undefined): Promise<SignedSessionPayload | null> {
  if (!token) return null;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;

  const payloadB64 = token.slice(0, dotIdx);
  const sigB64 = token.slice(dotIdx + 1);
  if (!payloadB64 || !sigB64) return null;

  try {
    const enc = new TextEncoder();
    const key = await getHmacKey(getSessionSecret());
    const expectedSigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
    const expectedSigB64 = toBase64Url(new Uint8Array(expectedSigBuf));
    if (!timingSafeEqualStr(expectedSigB64, sigB64)) return null;

    const payloadJson = new TextDecoder().decode(fromBase64Url(payloadB64));
    const parsed = JSON.parse(payloadJson) as SignedSessionPayload;
    if (!parsed || typeof parsed.id !== 'number' || !parsed.level) return null;
    if (parsed.createdAt && Date.now() - parsed.createdAt > SESSION_MAX_AGE_MS) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
