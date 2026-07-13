// Pure reference queries over in-memory CRM data — who points at a record — used by
// the graceful-deletion flow (02-CRM-DATA-MODEL.md: confirm with reference counts,
// null references rather than cascade) and the referral-web rendering.

import type { Activity, Contact, Deal, Organization } from './types';

export interface CrmData {
  organizations: Organization[];
  contacts: Contact[];
  deals: Deal[];
  activities: Activity[];
}

export interface ContactReferences {
  deals: Deal[];
  activities: Activity[];
  /** Contacts this person referred (their referredByContactId points here). */
  referrals: Contact[];
}

export function contactReferences(data: CrmData, id: string): ContactReferences {
  return {
    deals: data.deals.filter((d) => d.primaryContactId === id),
    activities: data.activities.filter((a) => a.contactId === id),
    referrals: data.contacts.filter((c) => c.referredByContactId === id),
  };
}

export interface OrganizationReferences {
  contacts: Contact[];
  deals: Deal[];
}

export function organizationReferences(
  data: CrmData,
  id: string,
): OrganizationReferences {
  return {
    contacts: data.contacts.filter((c) => c.organizationId === id),
    deals: data.deals.filter((d) => d.organizationId === id),
  };
}

export function dealReferences(data: CrmData, id: string): { activities: Activity[] } {
  return { activities: data.activities.filter((a) => a.dealId === id) };
}

/** "2 deals, 5 activities and 1 referral" — for the deletion confirmation copy. */
export function describeCounts(
  parts: { count: number; noun: string; plural?: string }[],
): string {
  const present = parts
    .filter((p) => p.count > 0)
    .map((p) => `${p.count} ${p.count === 1 ? p.noun : (p.plural ?? `${p.noun}s`)}`);
  if (present.length === 0) return '';
  if (present.length === 1) return present[0];
  return `${present.slice(0, -1).join(', ')} and ${present[present.length - 1]}`;
}

/** Resolve a possibly-dangling reference to a display name, per the deletion rules. */
export function lookupName<T extends { id: string; name: string }>(
  records: T[],
  id: string | undefined,
  deletedLabel: string,
): string | null {
  if (!id) return null;
  return records.find((r) => r.id === id)?.name ?? deletedLabel;
}
