// Server-only client for the Python site-audit microservice. Reads the secret
// via resolveAuditServiceEnv() and never logs it, mirroring lib/google/calendar.ts
// and lib/google/oauth.ts. The browser must never import this module.

import { resolveAuditServiceEnv } from './env';
import type { AuditRequestInput, AuditResponse } from './types';
import type { BuiltDocument } from '@/lib/document-builder/types';

if (typeof window !== 'undefined') {
  throw new Error('lib/audit-service/client is server-only and must not be imported in the browser.');
}

/** Audit crawls (esp. with WCAG's per-page browser render) can run long; cap the
 * wait so a hung upstream doesn't hold the route handler open forever. A large
 * WCAG crawl of a 40+ page site can take a few minutes even after the speedups,
 * so this is generous by default and overridable via AUDIT_REQUEST_TIMEOUT_MS. */
const REQUEST_TIMEOUT_MS = Number(process.env.AUDIT_REQUEST_TIMEOUT_MS) || 600_000;

export class AuditServiceError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AuditServiceError';
  }
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const env = resolveAuditServiceEnv();
  if (!env) {
    throw new AuditServiceError(501, 'Audit service is not configured (set AUDIT_SERVICE_URL).');
  }

  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (env.apiKey) headers['X-API-Key'] = env.apiKey;

  let response: Response;
  try {
    response = await fetch(`${env.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
    throw new AuditServiceError(
      502,
      timedOut ? 'The audit service timed out.' : 'Could not reach the audit service.',
    );
  }

  if (!response.ok) {
    // Surface the upstream status and its `detail` if present, but never the key.
    let detail = '';
    try {
      const parsed: unknown = await response.json();
      if (parsed && typeof parsed === 'object' && 'detail' in parsed) {
        const d = (parsed as { detail: unknown }).detail;
        if (typeof d === 'string') detail = d;
      }
    } catch {
      /* non-JSON error body — ignore */
    }
    // Preserve the upstream status so the route can distinguish a bad-input
    // rejection (4xx) from a genuine upstream failure. Never include the key.
    throw new AuditServiceError(response.status, `Audit service returned HTTP ${response.status}${detail ? `: ${detail}` : ''}.`);
  }

  return (await response.json()) as T;
}

export function runAudit(input: AuditRequestInput): Promise<AuditResponse> {
  return call<AuditResponse>('/audit', input);
}

/** Turn an already-computed audit into Document Builder JSON without re-crawling. */
export function exportReportFromAudit(audit: AuditResponse, clientName: string): Promise<BuiltDocument> {
  return call<BuiltDocument>('/export/from-audit', { audit, client_name: clientName });
}
