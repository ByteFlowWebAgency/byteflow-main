// Step 1 of the Google Calendar authorization flow: send a signed-in internal user to
// Google's consent screen. This does NOT sign anyone in — the Supabase Auth session is a
// prerequisite for reaching this route at all, and is left untouched.

import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getCurrentInternalUser } from '@/lib/internal-tools/auth/server';
import { externalUrl } from '@/lib/internal-tools/auth/requestOrigin';
import { buildConsentUrl } from '@/lib/google/oauth';
import { isGoogleOAuthConfigured, CALLBACK_PATH } from '@/lib/google/env';
import { STATE_COOKIE, stateCookieOptions } from '../state';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Session first: an unauthenticated request learns nothing, not even whether Google is
  // configured (same ordering as apiHandlers.gate()).
  const user = await getCurrentInternalUser();
  if (!user) {
    return NextResponse.redirect(externalUrl(request, '/internal/login'));
  }
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(externalUrl(request, '/internal?calendar=not-configured'));
  }

  // CSRF: an unguessable nonce goes out in `state` and into an httpOnly cookie. The
  // callback only proceeds if the two match (double-submit), so an attacker cannot feed a
  // victim a crafted callback URL that binds the attacker's Google account to the
  // victim's session. The cookie is also bound to the user id it was issued for.
  const nonce = randomUUID();
  const state = `${user.id}:${nonce}`;

  const redirectUri = externalUrl(request, CALLBACK_PATH).toString();
  const response = NextResponse.redirect(buildConsentUrl(redirectUri, state));
  response.cookies.set(STATE_COOKIE, state, stateCookieOptions(request));
  return response;
}
