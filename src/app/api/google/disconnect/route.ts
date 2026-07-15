// Drop the Google Calendar authorization grant. POST (not GET) so it can't be triggered
// by a link or an <img> tag.

import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentInternalUser } from '@/lib/internal-tools/auth/server';
import {
  isSupabaseConfigured,
  getGoogleRefreshToken,
  deleteGoogleRefreshToken,
} from '@/lib/internal-tools/storage/server';
import { revokeToken } from '@/lib/google/oauth';
import { invalidateAccessToken } from '@/lib/google/calendar';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const user = await getCurrentInternalUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHENTICATED', message: 'Sign in first.' } },
      { status: 401 },
    );
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: { code: 'NOT_CONFIGURED', message: 'Supabase not configured.' } },
      { status: 501 },
    );
  }
  try {
    // Revoke at Google before forgetting our copy — otherwise the grant lives on in the
    // user's Google account with nothing in our UI to remove it. Best-effort by design.
    const refreshToken = await getGoogleRefreshToken(user.id);
    if (refreshToken) await revokeToken(refreshToken);
    await deleteGoogleRefreshToken(user.id);
    // Drop the live access token too, independently of whether the revoke call landed.
    // Otherwise "disconnected" in the UI would still be able to read the calendar until
    // the cached token expired (up to an hour).
    invalidateAccessToken(user.id);
    return NextResponse.json({ data: null });
  } catch {
    return NextResponse.json(
      { error: { code: 'UPSTREAM', message: 'Could not disconnect.' } },
      { status: 502 },
    );
  }
}
