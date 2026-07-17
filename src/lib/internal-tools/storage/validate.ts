// Per-entity structural validation, shared by the API routes (defense in depth on every
// write) and the client-side restore flow (all-or-nothing rejection of corrupt backup
// files before anything is sent). Deliberately checks shape and required fields, not
// business rules — screens own those.

import type { EntityName } from './types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

function isOptionalUuid(value: unknown): boolean {
  return value === undefined || value === null || isUuid(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'string';
}

function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 10 &&
    !Number.isNaN(Date.parse(value))
  );
}

function isOptionalDateOnly(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' &&
      DATE_ONLY_RE.test(value) &&
      !Number.isNaN(Date.parse(value)))
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

type Validator = (entity: Record<string, unknown>) => string | null;

const validators: Record<EntityName, Validator> = {
  organizations(e) {
    if (!isNonEmptyString(e.name)) return 'name is required';
    if (!isIsoTimestamp(e.createdAt)) return 'createdAt must be an ISO timestamp';
    return null;
  },
  contacts(e) {
    if (!isNonEmptyString(e.name)) return 'name is required';
    if (!isOptionalUuid(e.organizationId)) return 'organizationId must be a uuid';
    if (!isOptionalUuid(e.referredByContactId)) {
      return 'referredByContactId must be a uuid';
    }
    if (!isNonEmptyString(e.source)) return 'source is required';
    if (!isIsoTimestamp(e.createdAt)) return 'createdAt must be an ISO timestamp';
    return null;
  },
  deals(e) {
    if (!isNonEmptyString(e.title)) return 'title is required';
    if (!isNonEmptyString(e.stage)) return 'stage is required';
    if (!isOptionalUuid(e.organizationId)) return 'organizationId must be a uuid';
    if (!isOptionalUuid(e.primaryContactId)) {
      return 'primaryContactId must be a uuid';
    }
    if (e.estimatedValue !== undefined && e.estimatedValue !== null) {
      if (!isFiniteNumber(e.estimatedValue) || e.estimatedValue < 0) {
        return 'estimatedValue must be a non-negative number';
      }
    }
    if (!isOptionalDateOnly(e.nextStepDue)) {
      return 'nextStepDue must be a YYYY-MM-DD date';
    }
    if (!Array.isArray(e.stageHistory)) return 'stageHistory must be an array';
    for (const step of e.stageHistory) {
      if (
        !isRecord(step) ||
        !isNonEmptyString(step.stage) ||
        !isIsoTimestamp(step.at)
      ) {
        return 'stageHistory entries need a stage and an ISO timestamp';
      }
    }
    if (!isIsoTimestamp(e.createdAt)) return 'createdAt must be an ISO timestamp';
    if (!isIsoTimestamp(e.updatedAt)) return 'updatedAt must be an ISO timestamp';
    return null;
  },
  activities(e) {
    if (!isOptionalUuid(e.dealId)) return 'dealId must be a uuid';
    if (!isOptionalUuid(e.contactId)) return 'contactId must be a uuid';
    if (!isUuid(e.dealId) && !isUuid(e.contactId)) {
      return 'an activity needs a dealId or a contactId';
    }
    if (!isNonEmptyString(e.kind)) return 'kind is required';
    if (!isNonEmptyString(e.summary)) return 'summary is required';
    if (!isOptionalString(e.detail)) return 'detail must be a string';
    if (!isIsoTimestamp(e.at)) return 'at must be an ISO timestamp';
    if (!isIsoTimestamp(e.createdAt)) return 'createdAt must be an ISO timestamp';
    return null;
  },
  meetings(e) {
    if (!isNonEmptyString(e.eventId)) return 'eventId is required';
    if (!isOptionalUuid(e.organizationId)) return 'organizationId must be a uuid';
    if (!isOptionalUuid(e.contactId)) return 'contactId must be a uuid';
    if (!isOptionalUuid(e.dealId)) return 'dealId must be a uuid';
    if (!isIsoTimestamp(e.startsAt)) return 'startsAt must be an ISO timestamp';
    if (e.matchSource !== 'auto' && e.matchSource !== 'manual') {
      return 'matchSource must be "auto" or "manual"';
    }
    // Deliberately NOT requiring an organizationId: a manual row with none is a human
    // saying "this isn't a client meeting", which the auto matcher must then leave alone.
    if (!isIsoTimestamp(e.createdAt)) return 'createdAt must be an ISO timestamp';
    if (!isIsoTimestamp(e.updatedAt)) return 'updatedAt must be an ISO timestamp';
    return null;
  },
  documents(e) {
    if (!isNonEmptyString(e.name)) return 'name is required';
    if (!isOptionalUuid(e.organizationId)) return 'organizationId must be a uuid';
    if (!Array.isArray(e.pages)) return 'pages must be an array';
    if (!isNonEmptyString(e.themeId)) return 'themeId is required';
    if (!isIsoTimestamp(e.createdAt)) return 'createdAt must be an ISO timestamp';
    if (!isIsoTimestamp(e.updatedAt)) return 'updatedAt must be an ISO timestamp';
    // Page/block shape is validated by the document-builder's own validateDocument(), which
    // sanitizes rich text; re-implementing it here would fork the rules. This is the
    // structural gate only, matching this module's stated contract.
    return null;
  },
  budgets(e) {
    if (!isNonEmptyString(e.name)) return 'name is required';
    if (e.kind !== 'project' && e.kind !== 'recurring') {
      return 'kind must be "project" or "recurring"';
    }
    if (!isOptionalString(e.period)) return 'period must be a string';
    if (!Array.isArray(e.items)) return 'items must be an array';
    for (const item of e.items) {
      if (!isRecord(item)) return 'items must be objects';
      if (!isUuid(item.id)) return 'every item needs a uuid id';
      if (typeof item.category !== 'string') return 'item category must be a string';
      if (typeof item.description !== 'string') {
        return 'item description must be a string';
      }
      if (!isFiniteNumber(item.planned) || item.planned < 0) {
        return 'item planned must be a non-negative number';
      }
      if (!isFiniteNumber(item.actual) || item.actual < 0) {
        return 'item actual must be a non-negative number';
      }
    }
    if (!isIsoTimestamp(e.createdAt)) return 'createdAt must be an ISO timestamp';
    if (!isIsoTimestamp(e.updatedAt)) return 'updatedAt must be an ISO timestamp';
    return null;
  },
};

/**
 * Validate one entity payload. Returns null when valid, otherwise a human-readable
 * reason ("contacts[3]: name is required" style prefixing is the caller's job).
 */
export function validateEntity(
  entity: EntityName,
  payload: unknown,
): string | null {
  if (!isRecord(payload)) return 'record must be an object';
  if (!isUuid(payload.id)) return 'id must be a uuid';
  return validators[entity](payload);
}
