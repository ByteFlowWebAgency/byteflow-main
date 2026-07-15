// Shared CSRF state-cookie contract between /api/google/connect and /api/google/callback.

import type { NextRequest } from 'next/server';

export const STATE_COOKIE = 'bf_google_oauth_state';

/**
 * Scoped to the OAuth routes. Exported because deleting a cookie only works when the
 * Set-Cookie targets the same (name, domain, path) tuple it was issued with — the callback
 * must pass this explicitly rather than relying on the default Path=/.
 */
export const STATE_COOKIE_PATH = '/api/google';

/**
 * httpOnly + SameSite=Lax is the important pair here. Lax (not Strict) because the
 * callback arrives as a top-level cross-site navigation back from accounts.google.com and
 * a Strict cookie would not be sent — which would break the flow rather than secure it.
 *
 * `secure` is derived from the request's real, public-facing scheme rather than
 * NODE_ENV: behind the production proxy the Next server itself speaks plain http, so
 * keying off request.url would drop the Secure flag in production. Local http dev must
 * not set Secure or the browser discards the cookie.
 */
export function stateCookieOptions(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const proto = forwardedProto || new URL(request.url).protocol.replace(':', '');
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: proto === 'https',
    path: STATE_COOKIE_PATH,
    maxAge: 600, // 10 minutes — a consent round trip, not a session.
  };
}
