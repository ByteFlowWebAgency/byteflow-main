// Client-side implementation of EntityStore<T>: plain fetch against the session-gated
// API routes. This module is the ONLY place internal-tools client code is allowed to
// call fetch('/api/...') — components import createStore()/backup helpers and know
// nothing about routes or Supabase (01-CONTEXT-AND-STORAGE.md).

import type { ApiEnvelope, EntityName, EntityStore, StorageErrorCode } from './types';

/**
 * Every adapter failure surfaces as a StorageError so screens can branch on `code`
 * (e.g. show "database unreachable" for UPSTREAM/NETWORK, a config hint for
 * NOT_CONFIGURED) and always offer a retry — a failed save must never look like a save.
 */
export class StorageError extends Error {
  readonly code: StorageErrorCode;
  readonly status: number;

  constructor(code: StorageErrorCode, status: number, message: string) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.status = status;
  }
}

function baseUrl(entity: EntityName): string {
  return entity === 'budgets' ? '/api/budgets' : `/api/crm/${entity}`;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new StorageError(
      'NETWORK',
      0,
      'Could not reach the server — check your connection and retry.',
    );
  }

  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new StorageError(
      'UPSTREAM',
      response.status,
      `Unexpected response from the server (HTTP ${response.status}).`,
    );
  }

  if (!response.ok || envelope.error) {
    throw new StorageError(
      envelope.error?.code ?? 'UPSTREAM',
      response.status,
      envelope.error?.message ?? `Request failed (HTTP ${response.status}).`,
    );
  }
  return envelope.data as T;
}

export function createStore<T extends { id: string }>(
  entity: EntityName,
): EntityStore<T> {
  const base = baseUrl(entity);
  return {
    list: () => request<T[]>(base),

    async get(id: string): Promise<T | null> {
      try {
        return await request<T>(`${base}/${encodeURIComponent(id)}`);
      } catch (error) {
        if (error instanceof StorageError && error.code === 'NOT_FOUND') {
          return null;
        }
        throw error;
      }
    },

    save: (entityValue: T) =>
      request<null>(base, {
        method: 'PUT',
        body: JSON.stringify(entityValue),
      }).then(() => undefined),

    remove: (id: string) =>
      request<null>(`${base}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).then(() => undefined),

    saveMany: (entities: T[]) =>
      request<null>(base, {
        method: 'POST',
        body: JSON.stringify(entities),
      }).then(() => undefined),
  };
}
