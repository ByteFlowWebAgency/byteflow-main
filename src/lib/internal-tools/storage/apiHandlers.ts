// Shared request handling for every storage API route (/api/crm/* and /api/budgets/*).
// Order of checks is deliberate and identical everywhere: session cookie first (an
// unauthenticated request learns nothing, not even whether Supabase is configured),
// then configuration, then payload validation, then the actual query.

import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/internal-tools/session';
import {
  isSupabaseConfigured,
  listEntities,
  getEntity,
  saveEntity,
  saveEntities,
  removeEntity,
  UpstreamError,
} from './server';
import { validateEntity } from './validate';
import type { EntityName, StorageErrorCode } from './types';

function fail(status: number, code: StorageErrorCode, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function ok(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

async function gate(request: NextRequest): Promise<NextResponse | null> {
  const authenticated = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (!authenticated) {
    return fail(401, 'UNAUTHENTICATED', 'Sign in to the internal tools first.');
  }
  if (!isSupabaseConfigured()) {
    return fail(
      501,
      'NOT_CONFIGURED',
      'Supabase not configured — see SUPABASE-SETUP.md.',
    );
  }
  return null;
}

function upstream(error: unknown) {
  const message =
    error instanceof UpstreamError
      ? `Database request failed: ${error.message}`
      : 'Database request failed.';
  return fail(502, 'UPSTREAM', message);
}

export async function handleList(request: NextRequest, entity: EntityName) {
  const denied = await gate(request);
  if (denied) return denied;
  try {
    return ok(await listEntities(entity));
  } catch (error) {
    return upstream(error);
  }
}

export async function handleGet(
  request: NextRequest,
  entity: EntityName,
  id: string,
) {
  const denied = await gate(request);
  if (denied) return denied;
  try {
    const record = await getEntity(entity, id);
    if (record === null) {
      return fail(404, 'NOT_FOUND', `No ${entity} record with that id.`);
    }
    return ok(record);
  } catch (error) {
    return upstream(error);
  }
}

export async function handleSave(request: NextRequest, entity: EntityName) {
  const denied = await gate(request);
  if (denied) return denied;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, 'VALIDATION', 'Request body must be JSON.');
  }
  const problem = validateEntity(entity, payload);
  if (problem) return fail(400, 'VALIDATION', `${entity}: ${problem}`);
  try {
    await saveEntity(entity, payload as Record<string, unknown>);
    return ok(null);
  } catch (error) {
    return upstream(error);
  }
}

export async function handleSaveMany(request: NextRequest, entity: EntityName) {
  const denied = await gate(request);
  if (denied) return denied;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, 'VALIDATION', 'Request body must be JSON.');
  }
  if (!Array.isArray(payload)) {
    return fail(400, 'VALIDATION', 'Request body must be an array of records.');
  }
  for (let i = 0; i < payload.length; i++) {
    const problem = validateEntity(entity, payload[i]);
    if (problem) return fail(400, 'VALIDATION', `${entity}[${i}]: ${problem}`);
  }
  try {
    await saveEntities(entity, payload as Record<string, unknown>[]);
    return ok(null);
  } catch (error) {
    return upstream(error);
  }
}

export async function handleRemove(
  request: NextRequest,
  entity: EntityName,
  id: string,
) {
  const denied = await gate(request);
  if (denied) return denied;
  try {
    await removeEntity(entity, id);
    return ok(null);
  } catch (error) {
    return upstream(error);
  }
}
