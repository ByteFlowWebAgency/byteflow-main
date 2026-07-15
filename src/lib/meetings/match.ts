// Pure matching: calendar event → CRM organization. No I/O, no framework — every branch
// here is exercised by match.test.ts.
//
// Strategy and its justification live in RECON.md § Step 5. The short version, in
// descending reliability, stopping at the first signal that produces a UNIQUE hit:
//
//   1. exact attendee email → Contact.email → hop organizationId
//   2. attendee email domain → Organization.website domain   (corporate domains only)
//   3. normalised org name appears in the event title        (word-boundary, length floor)
//
// Two rules from 00-GUARDRAILS.md are load-bearing and deliberately never relaxed:
//   - "a wrong match is worse than no match" — every tier requires a UNIQUE hit. Two
//     plausible organizations means unmatched, not a coin flip.
//   - matching is "good enough, with an easy manual override" — no title naming convention
//     is required or enforced.

import type { CrmData } from '@/lib/crm/references';
import type { CalendarEvent } from '@/lib/google/calendar';
import type { MatchOutcome } from './types';
import { isConsumerDomain, isSharedHost } from './consumerDomains';

/** Our own domain — a colleague on the invite says nothing about which client it's for. */
export const OWN_DOMAIN = 'byteflowsolutions.com';

/** Below this, a name is too generic to match on ("Co", "AI", "The"). */
const MIN_NAME_LENGTH = 4;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** The domain part of an email, or null if it isn't one. */
export function emailDomain(value: string): string | null {
  const at = normalizeEmail(value).lastIndexOf('@');
  if (at <= 0) return null;
  const domain = normalizeEmail(value).slice(at + 1);
  return domain.length > 0 ? domain : null;
}

/**
 * Reduce a free-text website to a bare host. `Organization.website` is unvalidated,
 * unnormalised free text (RECON.md § Step 5), so this has to cope with `example.org`,
 * `https://www.example.org/`, `www.example.org/path?q=1`, and junk alike.
 *
 * Returns null for anything that looks like an EMAIL rather than a URL. An earlier draft
 * tolerated a pasted address by taking the part after the "@" — but "someone owns this
 * mailbox" is not evidence that "their organization owns this domain". For a client base
 * that routinely pastes a personal address into the website box, `jane@aol.co.uk` would
 * have made every aol.co.uk attendee match Jane's Barbershop, and no finite consumer
 * blocklist can cover every such provider. An email in the website field is bad data, and
 * the honest response is no signal at all.
 */
export function normalizeDomain(value: string | undefined): string | null {
  if (!value) return null;
  const raw = value.trim().toLowerCase();
  if (raw.length === 0) return null;

  let host = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//, ''); // strip scheme
  // An "@" in the authority means userinfo (or a pasted email) — not a domain we can
  // attribute to the organization. Checked after the scheme strip so "https://a@b.com"
  // is rejected too.
  if (host.split(/[/?#]/)[0].includes('@')) return null;

  host = host.replace(/^www\./, '');
  host = host.split(/[/?#]/)[0]; // strip path/query/fragment
  host = host.split(':')[0]; // strip port
  host = host.replace(/\.+$/, ''); // tolerate a trailing root dot
  if (!host.includes('.') || host.startsWith('.')) return null;
  if (!/^[a-z0-9.-]+$/.test(host)) return null;
  return host;
}

/** Lowercase, punctuation → spaces, collapse runs. "Acme, Corp." → "acme corp". */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Word-boundary containment. Padding both sides with spaces is what stops "ace" matching
 * "spacex" — a substring check alone would happily do that and silently mis-assign.
 */
function containsAsWords(haystack: string, needle: string): boolean {
  if (needle.length < MIN_NAME_LENGTH) return false;
  return ` ${haystack} `.includes(` ${needle} `);
}

/** Attendee emails worth matching on: external, non-consumer, well-formed. */
export function candidateAttendeeEmails(event: CalendarEvent): string[] {
  const seen = new Set<string>();
  for (const raw of event.attendeeEmails) {
    const email = normalizeEmail(raw);
    const domain = emailDomain(email);
    if (!domain) continue;
    if (domain === OWN_DOMAIN) continue; // a colleague, not the client
    seen.add(email);
  }
  return [...seen];
}

/** Tier 1 — exact attendee email → Contact.email → organizationId. */
function matchByContactEmail(event: CalendarEvent, data: CrmData): MatchOutcome | null {
  const emails = new Set(candidateAttendeeEmails(event));
  if (emails.size === 0) return null;

  const hits = data.contacts.filter((contact) => {
    if (!contact.email || !contact.organizationId) return false;
    return emails.has(normalizeEmail(contact.email));
  });
  if (hits.length === 0) return null;

  // Several attendees may be contacts — fine, so long as they agree on the organization.
  // If they point at different orgs, we genuinely don't know which one the meeting is for.
  const orgIds = new Set(hits.map((c) => c.organizationId as string));
  if (orgIds.size !== 1) return null;

  return {
    organizationId: hits[0].organizationId as string,
    contactId: hits.length === 1 ? hits[0].id : undefined,
    signal: 'contact-email',
  };
}

/** Tier 2 — attendee email domain → Organization.website domain. Corporate domains only. */
function matchByOrgDomain(event: CalendarEvent, data: CrmData): MatchOutcome | null {
  const domains = new Set(
    candidateAttendeeEmails(event)
      .map(emailDomain)
      .filter((d): d is string => d !== null)
      // THE critical filter. Without it one gmail.com attendee matches every organization
      // that happens to have a Gmail contact — silently assigning the meeting to the wrong
      // client, which 00-GUARDRAILS.md calls out as worse than no match at all.
      .filter((d) => !isConsumerDomain(d)),
  );
  if (domains.size === 0) return null;

  const hits = data.organizations.filter((org) => {
    const host = matchableOrgDomain(org.website);
    return host !== null && domains.has(host);
  });
  if (hits.length !== 1) return null; // 0 = no signal, 2+ = ambiguous → unmatched

  return { organizationId: hits[0].id, signal: 'org-domain' };
}

/**
 * The org's website reduced to a domain we can legitimately attribute to it, or null.
 *
 * The blocklist is applied to BOTH sides, not just the attendee's: an org whose "website"
 * is `gmail.com` or `facebook.com/janes-barbershop` does not own that host, and matching on
 * it would attach every visitor from that host to this one org. Shared hosts are excluded
 * for the same reason — there the *path* identifies the org, and we only compare hosts.
 */
function matchableOrgDomain(website: string | undefined): string | null {
  const host = normalizeDomain(website);
  if (host === null) return null;
  if (isConsumerDomain(host) || isSharedHost(host)) return null;
  if (host === OWN_DOMAIN) return null; // our own domain identifies no client
  return host;
}

/**
 * Tier 3 — the org's FULL normalised name appears in the event title.
 *
 * Deliberately only the full name, exactly as RECON.md § Step 5 specified. An earlier
 * draft also retried with legal suffixes stripped ("Acme Corp" → "acme") so it would catch
 * "Acme sync". That was removed: stripping turns a high-specificity needle into a
 * low-specificity one, and for names like "Vision Foundation" or "Impact Co" the remainder
 * is a common English word that matches unrelated titles ("Q3 vision planning") and then
 * silently persists the wrong client. 00-GUARDRAILS.md is explicit that a wrong match is
 * worse than no match, and tier 3 is the weakest signal we have — so it stays strict and
 * the manual override covers the rest.
 */
function matchByOrgNameInTitle(event: CalendarEvent, data: CrmData): MatchOutcome | null {
  const title = normalizeText(event.title);
  if (title.length === 0) return null;

  const hits = data.organizations.filter((org) =>
    containsAsWords(title, normalizeText(org.name)),
  );
  if (hits.length !== 1) return null;

  return { organizationId: hits[0].id, signal: 'org-name-in-title' };
}

/**
 * Resolve one event, or return null to leave it unmatched.
 *
 * Tiers are tried in order and the FIRST one to produce a unique hit wins — a weaker
 * signal never overrides a stronger one, and ambiguity at any tier falls through rather
 * than guessing.
 */
export function matchEvent(event: CalendarEvent, data: CrmData): MatchOutcome | null {
  return (
    matchByContactEmail(event, data) ??
    matchByOrgDomain(event, data) ??
    matchByOrgNameInTitle(event, data)
  );
}
