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

interface EventsCacheEntry {
  /** Shared by every caller that arrives while the fetch is still in flight. */
  events: Promise<CalendarEvent[]>;
  /**
   * Epoch ms, re-stamped from when the fetch *landed* rather than when it started, so a
   * slow fetch doesn't spend its own latency as cache lifetime.
   *
   * Until it lands the entry carries a provisional start+TTL, which doubles as a backstop:
   * a fetch pathological enough to outlive a whole TTL stops being shared, so later callers
   * start their own rather than queueing behind one wedged request forever.
   */
  expiresAt: number;
}

/**
 * Fetched events, cached per (user, range).
 *
 * Without this, every hub load — and every month the grid navigates to and back — is a
 * fresh round trip to Google for events that almost certainly didn't change in between.
 * The ranges the views ask for are midnight-aligned and stable for a whole day
 * (MeetingsSection derives them from today and the displayed month, not from the clock),
 * so the same key genuinely gets hit again rather than being unique per request.
 *
 * The entry holds the in-flight promise rather than only the settled array, so concurrent
 * callers for one range share ONE Google call instead of racing. Two tabs on the hub is
 * the ordinary case here, not a rare one.
 *
 * Process-local and non-authoritative, exactly like accessTokenCache above: a cold
 * instance simply fetches. The TTL stays short because a calendar is edited elsewhere and
 * expected to show up here; forceRefresh covers the rest.
 */
const eventsCache = new Map<string, EventsCacheEntry>();

const EVENTS_TTL_MS = 60_000;

/**
 * Enough to hold today's list plus a year of paged-through months, but bounded so a
 * long-lived instance can't accumulate ranges forever.
 */
const MAX_EVENTS_CACHE_ENTRIES = 64;

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

/**
 * Forget everything cached about one user's calendar — the access token AND their events.
 *
 * Both halves matter on connect and disconnect. Dropping only the token would leave a
 * just-disconnected user's events readable from cache for a full TTL, and would let a
 * reconnect to a *different* Google account keep serving the old account's meetings while
 * the UI reported the new one.
 */
export function invalidateCalendarCaches(userId: string): void {
  accessTokenCache.delete(userId);
  const prefix = `${userId}|`;
  for (const key of eventsCache.keys()) {
    if (key.startsWith(prefix)) eventsCache.delete(key);
  }
}

function eventsCacheKey(userId: string, timeMin: Date, timeMax: Date): string {
  return `${userId}|${timeMin.toISOString()}|${timeMax.toISOString()}`;
}

/**
 * Keep the cache bounded: expired entries first, then oldest-inserted (Map iterates in
 * insertion order). Evicting an entry whose fetch is still in flight is safe — the caller
 * awaiting it still gets its result; it just stops being served to anyone new.
 */
function pruneEventsCache(): void {
  if (eventsCache.size <= MAX_EVENTS_CACHE_ENTRIES) return;
  const now = Date.now();
  for (const [key, entry] of eventsCache) {
    if (entry.expiresAt <= now) eventsCache.delete(key);
  }
  for (const key of eventsCache.keys()) {
    if (eventsCache.size <= MAX_EVENTS_CACHE_ENTRIES) break;
    eventsCache.delete(key);
  }
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
  // forced refresh distinguishes "stale cache" from "grant actually revoked". Only the
  // token is dropped, not the events cache — the other ranges are still perfectly good,
  // and this is a credential problem, not a data one.
  if (response.status === 401) {
    accessTokenCache.delete(userId);
    accessToken = await getAccessToken(userId);
    response = await fetch(`${EVENTS_ENDPOINT}?${query.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
  }
  return response;
}

async function fetchAllEvents(
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

/**
 * Events on the user's primary calendar within [timeMin, timeMax).
 *
 * Served from the module cache when a fetch for the same range landed within EVENTS_TTL_MS.
 * `forceRefresh` goes to Google regardless — that's the Refresh control, and nothing else:
 * the ordinary hub load, and the refetch after a reassignment, both want the cache (an
 * assignment changes the CRM link, not the calendar).
 *
 * The returned array is SHARED with every other caller for the same range — treat it as
 * read-only. Nothing downstream mutates it today, and nothing should start.
 */
export function listCalendarEvents(
  userId: string,
  timeMin: Date,
  timeMax: Date,
  options: { forceRefresh?: boolean } = {},
): Promise<CalendarEvent[]> {
  const key = eventsCacheKey(userId, timeMin, timeMax);

  if (!options.forceRefresh) {
    const hit = eventsCache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.events;
  }

  const entry: EventsCacheEntry = {
    events: fetchAllEvents(userId, timeMin, timeMax),
    expiresAt: Date.now() + EVENTS_TTL_MS,
  };
  eventsCache.set(key, entry);
  pruneEventsCache();

  entry.events.then(
    // Re-stamp from arrival, so a slow fetch doesn't spend its own latency as lifetime.
    () => {
      entry.expiresAt = Date.now() + EVENTS_TTL_MS;
    },
    // Never cache a failure: drop the entry so the next caller retries against Google
    // instead of re-awaiting a rejected promise for a whole TTL. Guarded on identity so a
    // late failure can't evict a newer entry that already replaced this one.
    () => {
      if (eventsCache.get(key) === entry) eventsCache.delete(key);
    },
  );

  return entry.events;
}
