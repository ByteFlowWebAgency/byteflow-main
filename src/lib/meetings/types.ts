// Types for the meetings↔CRM linking layer (04-CRM-LINKING.md).

import type { CalendarEvent } from '@/lib/google/calendar';

/** How a meeting got attached to a CRM record. */
export type MatchSource = 'auto' | 'manual';

/** Which signal produced an automatic match — surfaced so a human can judge it. */
export type MatchSignal =
  | 'contact-email' // exact attendee email → Contact.email
  | 'org-domain' // attendee email domain → Organization.website
  | 'org-name-in-title'; // normalised org name appears in the event title

/**
 * The persisted resolution of one calendar event to a CRM record — a CRM entity, stored in
 * the `meetings` table and served by /api/crm/meetings like any other.
 *
 * A row with no organizationId and source 'manual' is a deliberate "leave this unmatched",
 * which the automatic matcher must then never override.
 */
export interface Meeting {
  id: string;
  /** Google Calendar event id (per-instance for recurring series). */
  eventId: string;
  organizationId?: string;
  contactId?: string;
  dealId?: string;
  /** Denormalised from the event so lists can sort/filter without re-fetching Google. */
  startsAt: string;
  matchSource: MatchSource;
  /** Which signal fired, for 'auto' rows. Absent on manual ones. */
  matchSignal?: MatchSignal;
  createdAt: string;
  updatedAt: string;
}

/** What an automatic match attempt concluded. */
export interface MatchOutcome {
  organizationId: string;
  contactId?: string;
  signal: MatchSignal;
}

/** An event plus its resolution — what both the list and the grid render from. */
export interface ResolvedMeeting {
  event: CalendarEvent;
  /** Null when nothing matched, or when a human deliberately unmatched it. */
  match: {
    organizationId: string;
    organizationName: string;
    contactId?: string;
    contactName?: string;
    source: MatchSource;
    signal?: MatchSignal;
  } | null;
  /** True when a human set (or cleared) this — the matcher must not touch it again. */
  isManual: boolean;
}
