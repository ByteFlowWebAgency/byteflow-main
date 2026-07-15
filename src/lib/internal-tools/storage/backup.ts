// One-click full backup and validated all-or-nothing restore for every stateful tool
// (CRM + budgets together — one file covers everything). Reads and writes go through
// the same adapter as the screens; nothing here talks to routes or Supabase directly.
//
// Restore semantics: upsert-by-id ("merge"), written in FK dependency order so records
// that reference other records land after their targets. It never deletes records that
// aren't in the file — restoring is additive, so a stale backup can't silently destroy
// newer work.

import { createStore } from './client';
import { validateEntity } from './validate';
import type { EntityName } from './types';

export const BACKUP_FORMAT = 'byteflow-internal-tools-backup' as const;
export const BACKUP_VERSION = 1 as const;

/** FK dependency order: orgs before contacts before deals before activities/meetings. */
const ENTITY_ORDER: EntityName[] = [
  'organizations',
  'contacts',
  'deals',
  'activities',
  'meetings',
  'budgets',
];

/**
 * Entities added after BACKUP_VERSION 1 shipped. A backup written before they existed
 * simply has no key for them, and must still restore — so a missing section is read as
 * empty rather than rejected as malformed. (A present-but-wrong section is still an error.)
 */
const ADDED_AFTER_V1: ReadonlySet<EntityName> = new Set(['meetings']);

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  data: Record<EntityName, { id: string }[]>;
}

export async function backupAll(): Promise<BackupFile> {
  const lists = await Promise.all(
    ENTITY_ORDER.map((entity) => createStore(entity).list()),
  );
  const data = {} as BackupFile['data'];
  ENTITY_ORDER.forEach((entity, index) => {
    data[entity] = lists[index];
  });
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export interface RestoreCounts {
  organizations: number;
  contacts: number;
  deals: number;
  activities: number;
  meetings: number;
  budgets: number;
}

/**
 * Validate a parsed backup file completely — every record of every entity — BEFORE any
 * write. Throws with a precise message on the first problem; if it returns, the file is
 * structurally sound and restore can proceed.
 */
export function validateBackup(parsed: unknown): asserts parsed is BackupFile {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Not a backup file: expected a JSON object.');
  }
  const file = parsed as Record<string, unknown>;
  if (file.format !== BACKUP_FORMAT) {
    throw new Error(
      `Not a ByteFlow internal-tools backup (format is ${JSON.stringify(file.format)}).`,
    );
  }
  if (file.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version ${JSON.stringify(file.version)}.`);
  }
  if (typeof file.data !== 'object' || file.data === null) {
    throw new Error('Backup is missing its data section.');
  }
  const data = file.data as Record<string, unknown>;
  for (const entity of ENTITY_ORDER) {
    // Backfill sections that a pre-existing backup couldn't have contained, so older
    // files keep restoring cleanly instead of failing validation on a key they predate.
    if (data[entity] === undefined && ADDED_AFTER_V1.has(entity)) {
      data[entity] = [];
    }
    const records = data[entity];
    if (!Array.isArray(records)) {
      throw new Error(`Backup data.${entity} must be an array.`);
    }
    records.forEach((record, index) => {
      const problem = validateEntity(entity, record);
      if (problem) {
        throw new Error(`Invalid backup — ${entity}[${index}]: ${problem}. Nothing was restored.`);
      }
    });
  }
}

/**
 * Validated, all-or-nothing-validation restore. The entire file is checked before the
 * first write; a corrupt file is rejected with nothing written.
 */
export async function restoreAll(parsed: unknown): Promise<RestoreCounts> {
  validateBackup(parsed);
  for (const entity of ENTITY_ORDER) {
    const records = parsed.data[entity];
    if (records.length > 0) {
      await createStore(entity).saveMany(records);
    }
  }
  return {
    organizations: parsed.data.organizations.length,
    contacts: parsed.data.contacts.length,
    deals: parsed.data.deals.length,
    activities: parsed.data.activities.length,
    meetings: parsed.data.meetings.length,
    budgets: parsed.data.budgets.length,
  };
}
