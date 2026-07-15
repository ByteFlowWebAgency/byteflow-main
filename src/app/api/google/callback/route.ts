// Step 2 of the Google Calendar authorization flow: Google redirects the user back here
// with a one-time code. Exchange it, keep the refresh token, and send the user home.
//
// Every failure path lands on /internal?calendar=<reason> with a short, non-sensitive
// reason code. Google's raw error bodies are never echoed to the browser or the log —
// they can contain the authorization code.

import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentInternalUser } from '@/lib/internal-tools/auth/server';
import { externalUrl } from '@/lib/internal-tools/auth/requestOrigin';
import {
  exchangeCodeForTokens,
  fetchGoogleEmail,
  GoogleOAuthError,
} from '@/lib/google/oauth';
import { CALENDAR_SCOPE, CALLBACK_PATH, unexpectedScope } from '@/lib/google/env';
import {
  isSupabaseConfigured,
  saveGoogleRefreshToken,
} from '@/lib/internal-tools/storage/server';
import { invalidateAccessToken } from '@/lib/google/calendar';
import { STATE_COOKIE, STATE_COOKIE_PATH } from '../state';

export const runtime = 'nodejs';

function back(request: NextRequest, reason: string) {
  const response = NextResponse.redirect(
    externalUrl(request, `/internal?calendar=${reason}`),
  );
  // The state nonce is single-use whatever the outcome. The path MUST match the one the
  // cookie was issued with (/api/google) — a bare delete() emits Path=/ and targets a
  // different (name, path) tuple, silently leaving the real cookie replayable for its
  // full Max-Age.
  response.cookies.delete({ name: STATE_COOKIE, path: STATE_COOKIE_PATH });
  return response;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentInternalUser();
  if (!user) {
    return NextResponse.redirect(externalUrl(request, '/internal/login'));
  }

  const params = request.nextUrl.searchParams;

  // The user declined at Google's consent screen, or Google refused outright.
  if (params.get('error')) {
    return back(request, 'denied');
  }

  // CSRF: the state echoed back by Google must match the cookie we issued, AND must be
  // bound to the user whose session is making this request. Without the second check, a
  // valid state from one user could be replayed in another user's session.
  const state = params.get('state');
  const cookieState = request.cookies.get(STATE_COOKIE)?.value;
  if (!state || !cookieState || state !== cookieState) {
    return back(request, 'state-mismatch');
  }
  if (state.split(':')[0] !== user.id) {
    return back(request, 'state-mismatch');
  }

  const code = params.get('code');
  if (!code) return back(request, 'no-code');

  if (!isSupabaseConfigured()) return back(request, 'not-configured');

  try {
    const redirectUri = externalUrl(request, CALLBACK_PATH).toString();
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Refuse the grant unless the calendar scope actually came back. A user can untick
    // scopes on Google's consent screen; storing a token that cannot read the calendar
    // would present as "connected" and then fail confusingly at fetch time.
    if (!tokens.scope.includes(CALENDAR_SCOPE)) {
      return back(request, 'scope-declined');
    }

    // ...and refuse it if it carries MORE authority than we asked for. Checking only that
    // read-only is present would happily accept a token that also holds `.../auth/calendar`
    // (edit/delete every calendar) — which the project's consent screen still offers. This
    // integration is read-only by guardrail, so a token that can write is a defect, not a
    // bonus: drop it on the floor rather than store it.
    const extra = unexpectedScope(tokens.scope);
    if (extra) {
      return back(request, 'scope-too-broad');
    }

    // No refresh token means the connection dies at the first access-token expiry. Treat
    // it as a failure rather than storing something that silently rots.
    if (!tokens.refreshToken) {
      return back(request, 'no-refresh-token');
    }

    const googleEmail = await fetchGoogleEmail(tokens.accessToken);

    await saveGoogleRefreshToken({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      googleEmail,
      scope: tokens.scope,
    });

    // Drop any token cached against the PREVIOUS grant. Without this, reconnecting a
    // different Google account would keep reading the old account's calendar for up to an
    // hour while the UI reported the new one.
    invalidateAccessToken(user.id);

    return back(request, 'connected');
  } catch (error) {
    // Deliberately coarse: GoogleOAuthError messages are already scrubbed of the code, and
    // anything else is unexpected. Neither reaches the browser beyond a reason slug.
    const reason = error instanceof GoogleOAuthError ? 'exchange-failed' : 'error';
    return back(request, reason);
  }
}
