// Server-only Supabase access for the internal tools. This is the ONLY module in the
// codebase allowed to import @supabase/supabase-js or read the service-role key; it is
// imported exclusively from API route handlers (which check the session cookie first).
// RLS is enabled with zero policies on every table — the service-role key is the only
// key that can touch them, and it must never reach a client bundle. The hard throw
// below makes any accidental client import fail loudly at load time.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { EntityName } from './types';

if (typeof window !== 'undefined') {
  throw new Error('storage/server.ts must never be imported from client code');
}

/**
 * Resolve the runtime env. Canonical names first (SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY, per SUPABASE-SETUP.md / .env.example); falls back to the
 * names actually present in the prepared .env.local (SUPABASE_PROJECT_URL,
 * SUPABASE_DB_SERVICE_ROLE_KEY) so local dev works without renaming secrets.
 */
function resolveEnv(): { url: string; serviceKey: string } | null {
  const url = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_DB_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

export function isSupabaseConfigured(): boolean {
  return resolveEnv() !== null;
}

let cachedClient: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const env = resolveEnv();
  if (!env) {
    throw new Error('Supabase not configured — see SUPABASE-SETUP.md');
  }
  cachedClient = createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

/** Thrown for failed Supabase queries; the route layer maps it to a 502 envelope. */
export class UpstreamError extends Error {}

type Row = Record<string, unknown>;

function uuidOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function timestampOr(value: unknown, fallback: string): string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
    ? value
    : fallback;
}

// The indexed/sortable columns extracted from each entity's JSON (see schema.sql).
// The `data` jsonb column stays the source of truth; these exist for queries only.
const extractColumns: Record<EntityName, (e: Row) => Row> = {
  organizations: (e) => ({ name: e.name }),
  contacts: (e) => ({
    name: e.name,
    organization_id: uuidOrNull(e.organizationId),
  }),
  deals: (e) => ({
    title: e.title,
    stage: e.stage,
    organization_id: uuidOrNull(e.organizationId),
    primary_contact_id: uuidOrNull(e.primaryContactId),
    next_step_due: stringOrNull(e.nextStepDue),
  }),
  activities: (e) => ({
    deal_id: uuidOrNull(e.dealId),
    contact_id: uuidOrNull(e.contactId),
    at: e.at,
  }),
  budgets: (e) => ({
    name: e.name,
    kind: e.kind,
    period: stringOrNull(e.period),
  }),
};

function toRow(entity: EntityName, payload: Row): Row {
  const now = new Date().toISOString();
  const row: Row = {
    id: payload.id,
    ...extractColumns[entity](payload),
    data: payload,
    updated_at: now,
  };
  // activities have no updated_at column; their created_at mirrors the record's own.
  if (entity === 'activities') delete row.updated_at;
  row.created_at = timestampOr(payload.createdAt, now);
  return row;
}

export async function listEntities(entity: EntityName): Promise<Row[]> {
  const { data, error } = await getClient()
    .from(entity)
    .select('data')
    .order('created_at', { ascending: true });
  if (error) throw new UpstreamError(error.message);
  return (data ?? []).map((row) => row.data as Row);
}

export async function getEntity(
  entity: EntityName,
  id: string,
): Promise<Row | null> {
  const { data, error } = await getClient()
    .from(entity)
    .select('data')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new UpstreamError(error.message);
  return (data?.data as Row) ?? null;
}

export async function saveEntity(entity: EntityName, payload: Row): Promise<void> {
  const { error } = await getClient().from(entity).upsert(toRow(entity, payload));
  if (error) throw new UpstreamError(error.message);
}

const BULK_CHUNK = 200;

export async function saveEntities(
  entity: EntityName,
  payloads: Row[],
): Promise<void> {
  for (let i = 0; i < payloads.length; i += BULK_CHUNK) {
    const chunk = payloads.slice(i, i + BULK_CHUNK).map((p) => toRow(entity, p));
    const { error } = await getClient().from(entity).upsert(chunk);
    if (error) throw new UpstreamError(error.message);
  }
}

export async function removeEntity(entity: EntityName, id: string): Promise<void> {
  const { error } = await getClient().from(entity).delete().eq('id', id);
  if (error) throw new UpstreamError(error.message);
}
