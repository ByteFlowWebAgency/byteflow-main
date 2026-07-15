// The manual override (04-CRM-LINKING.md step 4). The UI for triggering it lives in the
// widget/grid specs, but the mechanism is here so both call one implementation and a
// reassignment made in either view is immediately visible in the other.

import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentInternalUser } from '@/lib/internal-tools/auth/server';
import { isSupabaseConfigured } from '@/lib/internal-tools/storage/server';
import { assignMeeting } from '@/lib/meetings/resolve';

export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function bad(message: string) {
  return NextResponse.json({ error: { code: 'VALIDATION', message } }, { status: 400 });
}

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

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return bad('Request body must be JSON.');
  }
  if (typeof payload !== 'object' || payload === null) return bad('Body must be an object.');

  const { eventId, startsAt, organizationId, contactId } = payload as Record<string, unknown>;

  if (typeof eventId !== 'string' || eventId.length === 0) return bad('eventId is required.');
  if (typeof startsAt !== 'string' || Number.isNaN(Date.parse(startsAt))) {
    return bad('startsAt must be an ISO timestamp.');
  }
  // null is meaningful here: "leave this unmatched", deliberately, forever.
  if (organizationId !== null && (typeof organizationId !== 'string' || !UUID_RE.test(organizationId))) {
    return bad('organizationId must be a uuid or null.');
  }
  if (
    contactId !== undefined &&
    contactId !== null &&
    (typeof contactId !== 'string' || !UUID_RE.test(contactId))
  ) {
    return bad('contactId must be a uuid, null, or omitted.');
  }

  try {
    const meeting = await assignMeeting({
      eventId,
      startsAt,
      organizationId,
      contactId: (contactId as string | null | undefined) ?? null,
    });
    return NextResponse.json({ data: meeting });
  } catch {
    return NextResponse.json(
      { error: { code: 'UPSTREAM', message: 'Could not save the assignment.' } },
      { status: 502 },
    );
  }
}
