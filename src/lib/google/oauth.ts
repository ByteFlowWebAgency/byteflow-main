// Google OAuth 2.0 authorization-code flow — server-only, dependency-free (plain fetch
// against Google's documented endpoints; no googleapis/google-auth-library needed for a
// single read-only scope).
//
// This grants *authorization* to read a calendar. It is NOT a sign-in path: the internal
// session stays Supabase Auth email/password, and nothing here touches it.

import { resolveGoogleOAuthEnv, OAUTH_SCOPES } from './env';

if (typeof window !== 'undefined') {
  throw new Error('lib/google/oauth.ts must never be imported from client code');
}

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';

/** Thrown when Google rejects a token request; callers map it to a user-facing failure. */
export class GoogleOAuthError extends Error {}

function credentials() {
  const env = resolveGoogleOAuthEnv();
  if (!env) {
    throw new GoogleOAuthError('Google OAuth is not configured (GOOGLE_CLIENT_ID/SECRET).');
  }
  return env;
}

/**
 * The Google consent URL to send the user to.
 *
 * `access_type=offline` + `prompt=consent` is what makes Google return a refresh_token.
 * Without BOTH, a user who has already granted consent gets an access token only, and the
 * connection silently fails to survive its first hour — so `prompt=consent` stays even
 * though it re-prompts on reconnect.
 *
 * Deliberately NO `include_granted_scopes`. That flag turns on incremental authorization,
 * where the minted token inherits every scope the user has ever granted this OAuth client —
 * so its authority is bounded by the client's consent-screen config rather than by what we
 * ask for here. The project's Data Access page still offers `.../auth/calendar` (full
 * delete), so a user who had previously granted it would hand this read-only integration a
 * calendar-destroying token. We only ever want the two scopes below, and incremental
 * authorization buys us nothing.
 */
export function buildConsentUrl(redirectUri: string, state: string): string {
  const { clientId } = credentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: OAUTH_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export interface TokenExchangeResult {
  accessToken: string;
  /** Absent if Google withheld one (see buildConsentUrl) — callers must treat as failure. */
  refreshToken?: string;
  expiresInSeconds: number;
  scope: string;
}

/** Exchange the one-time authorization code for tokens. */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<TokenExchangeResult> {
  const { clientId, clientSecret } = credentials();
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    // body.error is Google's short code ("invalid_grant"); never log the raw body, it can
    // echo the code/secret back.
    throw new GoogleOAuthError(`Token exchange failed: ${body.error ?? response.status}`);
  }
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresInSeconds: body.expires_in ?? 3600,
    scope: body.scope ?? '',
  };
}

/** Mint a fresh access token from a stored refresh token. */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string; expiresInSeconds: number }> {
  const { clientId, clientSecret } = credentials();
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new GoogleOAuthError(`Token refresh failed: ${body.error ?? response.status}`);
  }
  return { accessToken: body.access_token, expiresInSeconds: body.expires_in ?? 3600 };
}

/** Which Google account this grant belongs to. Best-effort — never fails the connect. */
export async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    const body = await response.json();
    return typeof body.email === 'string' ? body.email : null;
  } catch {
    return null;
  }
}

/**
 * Revoke the grant at Google, so disconnecting in the app actually drops Google's side of
 * the relationship rather than just forgetting our copy of the token. Best-effort: the row
 * is deleted either way.
 */
export async function revokeToken(refreshToken: string): Promise<void> {
  try {
    await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: refreshToken }),
    });
  } catch {
    // Network failure revoking is not worth failing the disconnect over.
  }
}
