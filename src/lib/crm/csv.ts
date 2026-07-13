// CSV row builders for the CRM exports (03-CRM-SCREENS.md): current fields, one row
// per record, resolved names for references. Escaping/injection safety lives in the
// shared CSV utility — this module only shapes data.

import { toCsv } from '@/lib/internal-tools/csv';
import { lookupName, type CrmData } from './references';
import { SOURCE_LABELS, STAGE_LABELS } from './labels';

export function contactsCsv(data: CrmData): string {
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Role',
    'Organization',
    'Source',
    'Referred by',
    'Notes',
    'Created',
    'Id',
  ];
  const rows = data.contacts.map((c) => [
    c.name,
    c.email,
    c.phone,
    c.role,
    lookupName(data.organizations, c.organizationId, '[deleted organization]'),
    SOURCE_LABELS[c.source] ?? c.source,
    lookupName(data.contacts, c.referredByContactId, '[deleted contact]'),
    c.notes,
    c.createdAt,
    c.id,
  ]);
  return toCsv(headers, rows);
}

export function dealsCsv(data: CrmData): string {
  const headers = [
    'Title',
    'Stage',
    'Organization',
    'Primary contact',
    'Estimated value (USD)',
    'Services',
    'Next step',
    'Next step due',
    'Lost reason',
    'Created',
    'Updated',
    'Id',
  ];
  const rows = data.deals.map((d) => [
    d.title,
    STAGE_LABELS[d.stage] ?? d.stage,
    lookupName(data.organizations, d.organizationId, '[deleted organization]'),
    lookupName(data.contacts, d.primaryContactId, '[deleted contact]'),
    d.estimatedValue,
    (d.services ?? []).join('; '),
    d.nextStep,
    d.nextStepDue,
    d.lostReason,
    d.createdAt,
    d.updatedAt,
    d.id,
  ]);
  return toCsv(headers, rows);
}
