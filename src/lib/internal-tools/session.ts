// Session-token helpers for the /internal access gate. Written against WebCrypto
// (globalThis.crypto.subtle) so the same code runs in the Edge middleware, route
// handlers, and server components.
//
// Design (per 07-INTEGRATION-AND-QA.md): the token is stateless —
// `${expiresMs}.${base64url(HMAC(secret, expiresMs))}` — so the Edge middleware can verify
// it without a database round-trip. Login credentials themselves now live in Supabase
// (internal_users), so the HMAC signing key comes from INTERNAL_TOOLS_SESSION_SECRET.
// For backward compatibility it falls back to deriving from the legacy credential env
// vars when that secret is unset. If neither is present, no token can validate — the gate
// fails safe (denies) rather than crashing or falling open.

export const SESSION_COOKIE = 'bf_internal_session';
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h — re-login daily

function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * The material the HMAC signing key is derived from. Prefers a dedicated session secret;
 * falls back to the legacy credential env vars so existing deployments and cookies keep
 * working after credentials moved to Supabase. Rotating either invalidates all sessions.
 */
function secretMaterial(): string | null {
  const explicit = process.env.INTERNAL_TOOLS_SESSION_SECRET;
  if (explicit) return `bf-internal-session-v2|${explicit}`;
  const username = process.env.INTERNAL_TOOLS_USERNAME;
  const password = process.env.INTERNAL_TOOLS_PASSWORD;
  if (username && password) return `bf-proposal-tool-v1|${username}|${password}`;
  return null;
}

async function signingKey(): Promise<CryptoKey | null> {
  const material = secretMaterial();
  if (!material) return null;
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(material),
  );
  return crypto.subtle.importKey(
    'raw',
    digest,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

async function hmac(key: CryptoKey, payload: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload),
  );
  return base64url(new Uint8Array(signature));
}

/** Constant-time string comparison (no early exit on first mismatching char). */
function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = new TextEncoder().encode(a);
  const bufB = new TextEncoder().encode(b);
  let diff = bufA.length ^ bufB.length;
  const length = Math.max(bufA.length, bufB.length);
  for (let i = 0; i < length; i++) {
    diff |= (bufA[i % bufA.length] ?? 0) ^ (bufB[i % bufB.length] ?? 0);
  }
  return diff === 0;
}

/** Mint a session token valid for SESSION_TTL_MS. Null when env vars are unset. */
export async function createSessionToken(): Promise<string | null> {
  const key = await signingKey();
  if (!key) return null;
  const expires = String(Date.now() + SESSION_TTL_MS);
  return `${expires}.${await hmac(key, `session|${expires}`)}`;
}

/** True only for an unexpired token whose signature verifies. Fails closed. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const separator = token.indexOf('.');
  if (separator <= 0) return false;
  const expires = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!/^\d{10,16}$/.test(expires) || Number(expires) < Date.now()) return false;
  const key = await signingKey();
  if (!key) return false;
  const expected = await hmac(key, `session|${expires}`);
  return timingSafeStringEqual(signature, expected);
}
