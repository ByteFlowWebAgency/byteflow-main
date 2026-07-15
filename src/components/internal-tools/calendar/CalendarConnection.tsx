import { getCurrentInternalUser } from '@/lib/internal-tools/auth/server';
import {
  isSupabaseConfigured,
  getGoogleConnection,
} from '@/lib/internal-tools/storage/server';
import { isGoogleOAuthConfigured } from '@/lib/google/env';
import CalendarConnectionView, { type ConnectionNotice } from './CalendarConnectionView';

/**
 * The Google Calendar connection card on the hub — data access only; presentation lives in
 * CalendarConnectionView.
 *
 * This is an *authorization* grant, not a sign-in: the user is already signed in with
 * Supabase Auth, and connecting only lets the server read their calendar. Read-only, and
 * revocable from here.
 */

/** Outcome slugs set by /api/google/callback. Kept in sync with that route. */
const STATUS_COPY: Record<string, ConnectionNotice> = {
  connected: { message: 'Google Calendar connected.', tone: 'ok' },
  denied: { message: 'Connection cancelled — no access was granted.', tone: 'bad' },
  'scope-declined': {
    message: 'Calendar access wasn’t granted. The calendar permission is required.',
    tone: 'bad',
  },
  'no-refresh-token': {
    message: 'Google didn’t return a refresh token. Try connecting again.',
    tone: 'bad',
  },
  'state-mismatch': {
    message: 'Security check failed. Start the connection again from this page.',
    tone: 'bad',
  },
  'no-code': { message: 'Google didn’t return an authorization code.', tone: 'bad' },
  'exchange-failed': { message: 'Google rejected the connection. Try again.', tone: 'bad' },
  'not-configured': { message: 'The Google integration isn’t configured yet.', tone: 'bad' },
  error: { message: 'Something went wrong connecting. Try again.', tone: 'bad' },
};

export default async function CalendarConnection({ status }: { status?: string }) {
  const user = await getCurrentInternalUser();
  if (!user) return null;

  const configured = isGoogleOAuthConfigured() && isSupabaseConfigured();
  // A read failure must not take the whole hub down — degrade to "not connected".
  const connection = configured ? await getGoogleConnection(user.id).catch(() => null) : null;

  return (
    <CalendarConnectionView
      configured={configured}
      connected={connection !== null}
      googleEmail={connection?.googleEmail}
      notice={status ? STATUS_COPY[status] : undefined}
    />
  );
}
