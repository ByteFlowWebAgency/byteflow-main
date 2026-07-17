// Google OAuth client credentials. Server-only — these are read here and nowhere else,
// and no NEXT_PUBLIC_ variable ever exposes them to the browser.
//
// GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET were provisioned in the Google Cloud project
// long before any code used them (see BLOCKERS.md). This is the first consumer.

export function resolveGoogleOAuthEnv(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isGoogleOAuthConfigured(): boolean {
  return resolveGoogleOAuthEnv() !== null;
}

/**
 * The ONLY scope this integration ever requests. Read-only by design and by guardrail —
 * adding a write/edit/delete calendar scope is a separate, deliberate decision, not a
 * drive-by change here.
 */
export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly';

/**
 * Requested alongside the calendar scope purely so the callback can record WHICH Google
 * account was connected (shown back to the user). Not used for identity — sign-in is
 * Supabase Auth and is untouched by this flow.
 */
export const EMAIL_SCOPE = 'https://www.googleapis.com/auth/userinfo.email';

export const OAUTH_SCOPES = [CALENDAR_SCOPE, EMAIL_SCOPE].join(' ');

/**
 * Every scope a returned token is allowed to carry — an ALLOWLIST, not a denylist.
 *
 * The two we request, plus the identity scopes Google attaches on its own ("openid",
 * "email", and sometimes "profile"). Anything else means the token has authority we never
 * asked for and must be rejected.
 *
 * This is not theoretical: the Google Cloud project's Data Access page is configured with
 * 13 scopes including `.../auth/calendar` ("See, edit, share, and permanently delete all
 * the calendars you can access") and `.../auth/calendar.acls`, despite 01-CONTEXT.md
 * claiming it had been trimmed to three. A token carrying any of those would let a
 * deliberately read-only integration destroy calendars — so we refuse it rather than
 * trusting the console config to stay narrow.
 */
const ALLOWED_GRANTED_SCOPES = new Set([
  CALENDAR_SCOPE,
  EMAIL_SCOPE,
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid',
  'email',
  'profile',
]);

/**
 * The first scope in a granted set that we never asked for, or null if all are expected.
 * Callers must refuse the grant when this returns non-null.
 */
export function unexpectedScope(grantedScope: string): string | null {
  for (const scope of grantedScope.split(/\s+/).filter(Boolean)) {
    if (!ALLOWED_GRANTED_SCOPES.has(scope)) return scope;
  }
  return null;
}

/** The redirect URI must match an Authorized redirect URI on the OAuth client exactly. */
export const CALLBACK_PATH = '/api/google/callback';
