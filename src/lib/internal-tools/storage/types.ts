// Storage adapter contract for the stateful internal tools (CRM + budgets), per
// 01-CONTEXT-AND-STORAGE.md. Components only ever see EntityStore<T> — the client
// implementation talks to session-gated API routes, and only the server-side module
// touches Supabase. No other code path to the database exists.

export type EntityName =
  | 'organizations'
  | 'contacts'
  | 'deals'
  | 'activities'
  | 'budgets';

export const CRM_ENTITIES = [
  'organizations',
  'contacts',
  'deals',
  'activities',
] as const satisfies readonly EntityName[];

export type CrmEntityName = (typeof CRM_ENTITIES)[number];

export function isCrmEntity(value: string): value is CrmEntityName {
  return (CRM_ENTITIES as readonly string[]).includes(value);
}

export interface EntityStore<T extends { id: string }> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  /** Create or update (upsert on id). */
  save(entity: T): Promise<void>;
  remove(id: string): Promise<void>;
  /** Bulk upsert — used by restore-from-backup. */
  saveMany(entities: T[]): Promise<void>;
}

/** Error codes every API route can return in its `error.code` field. */
export type StorageErrorCode =
  | 'UNAUTHENTICATED' // no/invalid session cookie — 401
  | 'NOT_CONFIGURED' // Supabase env vars missing — 501
  | 'VALIDATION' // payload failed validation — 400
  | 'NOT_FOUND' // get() on a missing id — 404
  | 'UPSTREAM' // Supabase query failed — 502
  | 'NETWORK'; // client-side only: fetch itself failed

/** Uniform response body for all storage API routes. */
export interface ApiEnvelope<T> {
  data?: T;
  error?: { code: StorageErrorCode; message: string };
}
