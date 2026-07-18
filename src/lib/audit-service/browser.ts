'use client';

// Browser-side wrapper for the /api/audit proxy. Unwraps the { data } / { error }
// envelope and throws a typed AuditApiError, mirroring lib/internal-tools/storage/client.ts.

import type { AuditRequestInput, AuditResponse } from './types';
import type { BuiltDocument } from '@/lib/document-builder/types';

export class AuditApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AuditApiError';
  }
}

async function post<T>(body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuditApiError(0, 'NETWORK', 'Could not reach the server — check your connection and retry.');
  }

  let envelope: { data?: T; error?: { code: string; message: string } };
  try {
    envelope = (await response.json()) as { data?: T; error?: { code: string; message: string } };
  } catch {
    throw new AuditApiError(response.status, 'UPSTREAM', `Request failed (HTTP ${response.status}).`);
  }

  if (!response.ok || envelope.error) {
    throw new AuditApiError(
      response.status,
      envelope.error?.code ?? 'UPSTREAM',
      envelope.error?.message ?? `Request failed (HTTP ${response.status}).`,
    );
  }
  return envelope.data as T;
}

export function runAuditRequest(input: AuditRequestInput): Promise<AuditResponse> {
  return post<AuditResponse>({ action: 'run', request: input });
}

export function exportReport(audit: AuditResponse, clientName: string): Promise<BuiltDocument> {
  return post<BuiltDocument>({ action: 'export', audit, clientName });
}
