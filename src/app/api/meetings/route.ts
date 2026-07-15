// The single entry point both the meetings list (05-MEETINGS-WIDGET.md, 7 days) and the
// calendar grid (06-CALENDAR-VIEW.md, a month) read from. The date range is a parameter
// precisely so neither view needs its own Calendar API call.

import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentInternalUser } from '@/lib/internal-tools/auth/server';
import { isSupabaseConfigured } from '@/lib/internal-tools/storage/server';
import { isGoogleOAuthConfigured } from '@/lib/google/env';
import { CalendarNotConnectedError } from '@/lib/google/calendar';
import { resolveMeetings } from '@/lib/meetings/resolve';

export const runtime = 'nodejs';

/** Guard rail on the range: a year of events is a mistake, not a query. */
const MAX_RANGE_DAYS = 120;

export async function GET(request: NextRequest) {
  const user = await getCurrentInternalUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHENTICATED', message: 'Sign in first.' } },
      { status: 401 },
    );
  }
  if (!isSupabaseConfigured() || !isGoogleOAuthConfigured()) {
    return NextResponse.json(
      { error: { code: 'NOT_CONFIGURED', message: 'Calendar integration not configured.' } },
      { status: 501 },
    );
  }

  const fromRaw = request.nextUrl.searchParams.get('from');
  const toRaw = request.nextUrl.searchParams.get('to');
  if (!fromRaw || !toRaw) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'from and to are required (ISO).' } },
      { status: 400 },
    );
  }
  const from = new Date(fromRaw);
  const to = new Date(toRaw);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'from/to must be ISO dates with to > from.' } },
      { status: 400 },
    );
  }
  if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * 86_400_000) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: `Range must be ${MAX_RANGE_DAYS} days or less.` } },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json({ data: await resolveMeetings(user.id, from, to) });
  } catch (error) {
    if (error instanceof CalendarNotConnectedError) {
      return NextResponse.json(
        { error: { code: 'NOT_CONNECTED', message: 'Google Calendar is not connected.' } },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: { code: 'UPSTREAM', message: 'Could not load meetings.' } },
      { status: 502 },
    );
  }
}
