// THE shared fetch/match layer (04-CRM-LINKING.md step 2). Server-only.
//
// 05-MEETINGS-WIDGET.md (7-day list) and 06-CALENDAR-VIEW.md (month grid) both consume
// this through /api/meetings with a date range — neither calls the Calendar API itself, and
// neither re-implements matching. That is the "no duplicate event-fetching logic" gate.

import { createHash } from 'node:crypto';
import type { CrmData } from '@/lib/crm/references';
import type { Contact, Organization } from '@/lib/crm/types';
import { listCalendarEvents, type CalendarEvent } from '@/lib/google/calendar';
import {
  listEntities,
  saveEntity,
  listDocumentSummaries,
  type DocumentSummary,
} from '@/lib/internal-tools/storage/server';
import { matchEvent } from './match';
import type { LinkedDocument, Meeting, ResolvedMeeting } from './types';

if (typeof window !== 'undefined') {
  throw new Error('lib/meetings/resolve.ts must never be imported from client code');
}

/** Fixed namespace for deriving meeting ids. Arbitrary but must never change. */
const MEETING_NAMESPACE = '6f9a1f2c-3b47-4c8e-9d21-0a5b7e4c8d13';

/**
 * A deterministic RFC-4122 v5 uuid for a calendar event id.
 *
 * The `meetings` table has `event_id` UNIQUE, but saveEntity upserts on the primary key
 * `id`. Minting a random id per resolve would mean two concurrent resolvers (two tabs, two
 * instances) generate different ids for the same event, so ON CONFLICT (id) wouldn't fire
 * and the second insert would die on the event_id unique constraint. Deriving the id from
 * the event id makes the write idempotent on the natural key: same event → same row,
 * always, and concurrent writers simply update each other.
 */
export function meetingIdForEvent(eventId: string): string {
  const namespaceBytes = Buffer.from(MEETING_NAMESPACE.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1')
    .update(namespaceBytes)
    .update(Buffer.from(eventId, 'utf8'))
    .digest();
  hash[6] = (hash[6] & 0x0f) | 0x50; // version 5
  hash[8] = (hash[8] & 0x3f) | 0x80; // RFC-4122 variant
  const hex = hash.subarray(0, 16).toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

async function loadCrmData(): Promise<CrmData> {
  const [organizations, contacts] = await Promise.all([
    listEntities('organizations'),
    listEntities('contacts'),
  ]);
  // deals/activities aren't consulted by the matcher; the CrmData shape wants them.
  return {
    organizations: organizations as unknown as Organization[],
    contacts: contacts as unknown as Contact[],
    deals: [],
    activities: [],
  };
}

async function loadMeetingsByEventId(): Promise<Map<string, Meeting>> {
  const rows = (await listEntities('meetings')) as unknown as Meeting[];
  const byEventId = new Map<string, Meeting>();
  for (const meeting of rows) byEventId.set(meeting.eventId, meeting);
  return byEventId;
}

function describeMatch(
  data: CrmData,
  organizationId: string,
  contactId: string | undefined,
): { organizationName: string; contactName?: string } | null {
  const org = data.organizations.find((o) => o.id === organizationId);
  if (!org) return null; // org deleted since the match was stored → treat as unmatched
  const contact = contactId ? data.contacts.find((c) => c.id === contactId) : undefined;
  return { organizationName: org.name, contactName: contact?.name };
}

/**
 * Resolve every event in [from, to) to a CRM record.
 *
 * Precedence, per 04-CRM-LINKING.md step 3:
 *   1. A stored MANUAL row always wins and is never re-evaluated — including a manual row
 *      with no organizationId, which is a human saying "this one isn't a client meeting".
 *   2. A stored AUTO row is reused rather than re-matched, so the same event isn't
 *      re-resolved on every page load — but only while the organization it points at still
 *      exists. Deleting an org nulls the FK column and leaves data.organizationId dangling
 *      (the CRM deletes by nulling references, never cascading), and reusing that row would
 *      freeze the event as unmatched forever. A dangling row falls through and re-matches.
 *   3. Anything else is matched now. Hits are persisted; misses deliberately are NOT —
 *      storing "auto + unmatched" would freeze the miss forever, so an event stays
 *      re-matchable once the missing organization is finally added to the CRM.
 */
export async function resolveMeetings(
  userId: string,
  from: Date,
  to: Date,
): Promise<ResolvedMeeting[]> {
  const [events, data, stored, docs] = await Promise.all([
    listCalendarEvents(userId, from, to),
    loadCrmData(),
    loadMeetingsByEventId(),
    // Summaries only — never the full documents. Pulling megabytes of embedded images to
    // answer "does this client have one?" would be absurd.
    listDocumentSummaries().catch(() => [] as DocumentSummary[]),
  ]);

  // Index documents by the org they're for, so each meeting is an O(1) lookup.
  const docsByOrg = new Map<string, LinkedDocument[]>();
  for (const doc of docs) {
    if (!doc.organizationId) continue;
    const list = docsByOrg.get(doc.organizationId) ?? [];
    list.push({ id: doc.id, name: doc.name, updatedAt: doc.updatedAt });
    docsByOrg.set(doc.organizationId, list);
  }

  const orgExists = (id: string | undefined) =>
    id !== undefined && data.organizations.some((o) => o.id === id);

  const resolved: ResolvedMeeting[] = [];
  const toPersist: Meeting[] = [];

  for (const event of events) {
    const existing = stored.get(event.id);

    if (existing && existing.matchSource === 'manual') {
      resolved.push(toResolved(event, data, existing, docsByOrg));
      continue;
    }
    if (existing && orgExists(existing.organizationId)) {
      resolved.push(toResolved(event, data, existing, docsByOrg));
      continue;
    }

    const outcome = matchEvent(event, data);
    if (!outcome) {
      resolved.push({
        event,
        match: null,
        isManual: false,
        docStatus: 'unknown',
        documents: [],
      });
      continue;
    }

    const now = new Date().toISOString();
    const meeting: Meeting = {
      id: meetingIdForEvent(event.id),
      eventId: event.id,
      organizationId: outcome.organizationId,
      contactId: outcome.contactId,
      startsAt: event.startsAt,
      matchSource: 'auto',
      matchSignal: outcome.signal,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    toPersist.push(meeting);
    resolved.push(toResolved(event, data, meeting, docsByOrg));
  }

  // Persist after resolving so a write failure degrades to "re-match next load" rather
  // than failing the whole request — the user still sees correct matches either way.
  await Promise.allSettled(
    toPersist.map((meeting) =>
      saveEntity('meetings', meeting as unknown as Record<string, unknown>),
    ),
  );

  return resolved;
}

function toResolved(
  event: CalendarEvent,
  data: CrmData,
  meeting: Meeting,
  docsByOrg: Map<string, LinkedDocument[]>,
): ResolvedMeeting {
  const isManual = meeting.matchSource === 'manual';
  const unmatched: ResolvedMeeting = {
    event,
    match: null,
    isManual,
    docStatus: 'unknown',
    documents: [],
  };
  if (!meeting.organizationId) return unmatched;

  const described = describeMatch(data, meeting.organizationId, meeting.contactId);
  if (!described) return unmatched; // org deleted since the match was stored

  const documents = docsByOrg.get(meeting.organizationId) ?? [];

  return {
    event,
    match: {
      organizationId: meeting.organizationId,
      organizationName: described.organizationName,
      contactId: meeting.contactId,
      contactName: described.contactName,
      source: meeting.matchSource,
      signal: meeting.matchSignal,
    },
    isManual,
    // Matched to a client, so the question now applies: do they have paperwork or not?
    docStatus: documents.length > 0 ? 'ready' : 'needs-prep',
    documents,
  };
}

/**
 * The manual override mechanism (04-CRM-LINKING.md step 4) — one function, called by both
 * the list and the grid via /api/meetings/assign. Passing organizationId: null is the
 * deliberate "leave unmatched", which the automatic matcher will then never revisit.
 */
export async function assignMeeting(params: {
  eventId: string;
  startsAt: string;
  organizationId: string | null;
  contactId?: string | null;
}): Promise<Meeting> {
  const stored = await loadMeetingsByEventId();
  const existing = stored.get(params.eventId);
  const now = new Date().toISOString();

  const meeting: Meeting = {
    id: meetingIdForEvent(params.eventId),
    eventId: params.eventId,
    organizationId: params.organizationId ?? undefined,
    contactId: params.contactId ?? undefined,
    startsAt: params.startsAt,
    matchSource: 'manual',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await saveEntity('meetings', meeting as unknown as Record<string, unknown>);
  return meeting;
}
