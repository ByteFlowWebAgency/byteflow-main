// Read-only Google Calendar access. Server-only.
//
// This is THE calendar fetching layer — 05-MEETINGS-WIDGET.md and 06-CALENDAR-VIEW.md
// both consume it through lib/meetings/resolve.ts with a date-range parameter, rather than
// each view calling the Calendar API itself.

import { refreshAccessToken, GoogleOAuthError } from './oauth';
import { getGoogleRefreshToken } from '@/lib/internal-tools/storage/server';

if (typeof window !== 'undefined') {
  throw new Error('lib/google/calendar.ts must never be imported from client code');
}

const EVENTS_ENDPOINT =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events';

/** A calendar event, reduced to what the matcher and the views actually need. */
export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO. Timed events use dateTime; all-day events use the bare date. */
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  attendeeEmails: string[];
  /** The organiser, who for an internally-booked meeting is usually us — not the client. */
  organizerEmail: string | null;
  htmlLink: string | null;
}

/**
 * Access tokens live ~1 hour. Cache per user in module memory so a page with several
 * requests doesn't hammer Google's token endpoint, but never persist them — the refresh
 * token in the database is the durable credential, and a lost cache costs one round trip.
 * Keyed by user id; process-local by design (a serverless instance holding a stale entry
 * simply refreshes again).
 */
const accessTokenCache = new Map<string, { token: string; expiresAt: number }>();

/** 60s safety margin so a token can't expire mid-flight. */
const EXPIRY_SKEW_MS = 60_000;

export class CalendarNotConnectedError extends Error {}

async function getAccessToken(userId: string): Promise<string> {
  const cached = accessTokenCache.get(userId);
  if (cached && cached.expiresAt > Date.now() + EXPIRY_SKEW_MS) return cached.token;

  const refreshToken = await getGoogleRefreshToken(userId);
  if (!refreshToken) {
    throw new CalendarNotConnectedError('Google Calendar is not connected.');
  }
  const { accessToken, expiresInSeconds } = await refreshAccessToken(refreshToken);
  accessTokenCache.set(userId, {
    token: accessToken,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });
  return accessToken;
}

/** Drop a cached token — call when Google rejects it, so the next call re-refreshes. */
export function invalidateAccessToken(userId: string): void {
  accessTokenCache.delete(userId);
}

interface GoogleEventResource {
  id?: string;
  status?: string;
  summary?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { email?: string; self?: boolean; responseStatus?: string }[];
  organizer?: { email?: string; self?: boolean };
}

function toCalendarEvent(raw: GoogleEventResource): CalendarEvent | null {
  if (!raw.id) return null;
  const startsAt = raw.start?.dateTime ?? raw.start?.date;
  const endsAt = raw.end?.dateTime ?? raw.end?.date;
  if (!startsAt || !endsAt) return null; // Google can omit both on malformed entries.
  return {
    id: raw.id,
    title: raw.summary ?? '(no title)',
    startsAt,
    endsAt,
    isAllDay: !raw.start?.dateTime,
    attendeeEmails: (raw.attendees ?? [])
      .filter((a) => !a.self && typeof a.email === 'string')
      .map((a) => a.email as string),
    organizerEmail: raw.organizer?.email ?? null,
    htmlLink: raw.htmlLink ?? null,
  };
}

/**
 * Events on the user's primary calendar within [timeMin, timeMax).
 *
 * `singleEvents=true` expands recurring series into individual instances, each with its
 * own event id — which is what makes a per-instance CRM match meaningful (rescheduling one
 * occurrence cannot re-point the whole series). `orderBy=startTime` requires it.
 * Cancelled instances are filtered out.
 */
/** Google caps maxResults at 2500 and paginates regardless, so we must follow the token. */
const PAGE_SIZE = 250;
/** Backstop against an unbounded loop; 20 × 250 = 5000 events in one range is already absurd. */
const MAX_PAGES = 20;

async function fetchPage(userId: string, query: URLSearchParams): Promise<Response> {
  let accessToken = await getAccessToken(userId);
  let response = await fetch(`${EVENTS_ENDPOINT}?${query.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  // A cached token can be revoked server-side before its nominal expiry. One retry with a
  // forced refresh distinguishes "stale cache" from "grant actually revoked".
  if (response.status === 401) {
    invalidateAccessToken(userId);
    accessToken = await getAccessToken(userId);
    response = await fetch(`${EVENTS_ENDPOINT}?${query.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
  }
  return response;
}

export async function listCalendarEvents(
  userId: string,
  timeMin: Date,
  timeMax: Date,
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const query = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: String(PAGE_SIZE),
    });
    if (pageToken) query.set('pageToken', pageToken);

    const response = await fetchPage(userId, query);
    if (!response.ok) {
      throw new GoogleOAuthError(`Calendar request failed: ${response.status}`);
    }

    const body = await response.json();
    for (const raw of (body.items ?? []) as GoogleEventResource[]) {
      if (raw.status === 'cancelled') continue;
      const event = toCalendarEvent(raw);
      if (event) events.push(event);
    }

    // No token means that was the last page — the normal exit.
    if (!body.nextPageToken) return events;
    pageToken = body.nextPageToken as string;
  }

  // Hit the page cap with a token still outstanding: return what we have rather than
  // looping forever. Truncation is visible here rather than silent.
  return events;
}
