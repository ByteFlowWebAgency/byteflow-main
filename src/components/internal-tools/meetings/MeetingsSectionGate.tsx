import { getCurrentInternalUser } from '@/lib/internal-tools/auth/server';
import {
  isSupabaseConfigured,
  getGoogleConnection,
} from '@/lib/internal-tools/storage/server';
import { isGoogleOAuthConfigured } from '@/lib/google/env';
import MeetingsSection from './MeetingsSection';

/**
 * Server-side gate: only mount the meetings client component when there's actually a
 * calendar connected. Without this the section would render, fire /api/meetings, and get a
 * 409 back on every hub load for anyone who hasn't connected — noise instead of nothing.
 */
export default async function MeetingsSectionGate() {
  const user = await getCurrentInternalUser();
  if (!user) return null;
  if (!isGoogleOAuthConfigured() || !isSupabaseConfigured()) return null;

  const connection = await getGoogleConnection(user.id).catch(() => null);
  if (!connection) return null;

  return <MeetingsSection connected />;
}
