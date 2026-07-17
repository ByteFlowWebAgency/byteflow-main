import Link from 'next/link';
import { getCurrentInternalUser } from '@/lib/internal-tools/auth/server';
import {
  isSupabaseConfigured,
  getGoogleConnection,
  type GoogleConnection,
} from '@/lib/internal-tools/storage/server';
import { isGoogleOAuthConfigured } from '@/lib/google/env';
import MeetingsSection from './MeetingsSection';
import styles from './meetings.module.css';

/**
 * Server-side gate: only mount the meetings client component when there's actually a
 * calendar connected. Without this the section would render, fire /api/meetings, and get a
 * 409 back on every hub load for anyone who hasn't connected — noise instead of nothing.
 *
 * Because the gate settles this before the client ever mounts, MeetingsSection can assume
 * a connection rather than carrying a prop for a state it will never be rendered in.
 */
export default async function MeetingsSectionGate() {
  const user = await getCurrentInternalUser();
  if (!user) return null;
  if (!isGoogleOAuthConfigured() || !isSupabaseConfigured()) return null;

  // A read failure and a genuine "no grant" must not collapse into the same branch. The
  // not-connected copy below is an assertion — it tells you your integration is gone and
  // sends you off to redo the OAuth flow — so a transient Supabase blip must never be
  // allowed to say it. Report not-knowing instead, which is the truth.
  let connection: GoogleConnection | null;
  try {
    connection = await getGoogleConnection(user.id);
  } catch {
    return (
      <div className={styles.card}>
        <p className={styles.empty}>
          Couldn’t check your calendar connection just now. Reload to try again.
        </p>
      </div>
    );
  }

  if (!connection) {
    // Genuinely no grant: say so, and point at the one place that can fix it. Rendering
    // nothing here would leave the Meetings column silently blank now that the Connect
    // button has moved off the hub and onto /internal/settings.
    return (
      <div className={styles.card}>
        <p className={styles.empty}>
          Google Calendar isn’t connected.{' '}
          <Link className={styles.emptyLink} href="/internal/settings">
            Connect it in Settings
          </Link>{' '}
          to see your meetings here.
        </p>
      </div>
    );
  }

  return <MeetingsSection />;
}
