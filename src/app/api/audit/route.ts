// Proxy from the internal frontend to the Python site-audit microservice.
// Middleware does NOT cover /api/*, so this route gates itself (session → config
// → validation), matching the meetings/crm/budgets route conventions, and never
// forwards the AUDIT_API_KEY to the browser.

import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentInternalUser } from '@/lib/internal-tools/auth/server';
import { isAuditServiceConfigured } from '@/lib/audit-service/env';
import { AuditServiceError, exportReportFromAudit, runAudit } from '@/lib/audit-service/client';
import type { AuditRequestInput, AuditResponse } from '@/lib/audit-service/types';

export const runtime = 'nodejs';
// A full WCAG crawl renders every page in a browser; allow the handler to run
// long on platforms that honour this (self-hosted Node has no hard limit; note
// serverless platforms like Vercel cap this regardless of the value here).
export const maxDuration = 600;

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function stringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((v) => typeof v === 'string') ? (value as string[]) : undefined;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentInternalUser();
  if (!user) return fail(401, 'UNAUTHENTICATED', 'Sign in to the internal tools first.');
  if (!isAuditServiceConfigured()) {
    return fail(501, 'NOT_CONFIGURED', 'Site Audit service is not configured — set AUDIT_SERVICE_URL (and AUDIT_API_KEY).');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'VALIDATION', 'Request body must be JSON.');
  }
  const payload = asRecord(body);
  if (!payload) return fail(400, 'VALIDATION', 'Request body must be a JSON object.');

  try {
    if (payload.action === 'run') {
      const input = asRecord(payload.request);
      if (!input || typeof input.url !== 'string' || !input.url.trim()) {
        return fail(400, 'VALIDATION', 'A url is required to run an audit.');
      }
      // Defense-in-depth: the crawler must only ever fetch http(s), and the crawl
      // size must stay bounded, regardless of what a direct API caller sends (the
      // UI clamps these, but this endpoint is reachable on its own). We rebuild a
      // clean request rather than forwarding an arbitrary record.
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(input.url);
      } catch {
        return fail(400, 'VALIDATION', 'That is not a valid URL.');
      }
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return fail(400, 'VALIDATION', 'Only http:// and https:// URLs can be audited.');
      }
      const safeInput: AuditRequestInput = {
        url: input.url,
        max_pages: clampInt(input.max_pages, 1, 300, 40),
        check_broken_links: input.check_broken_links === true,
        check_wcag: input.check_wcag === true,
        timeout: clampInt(input.timeout, 5, 60, 20),
      };
      const tags = stringArray(input.wcag_tags);
      if (tags) safeInput.wcag_tags = tags;
      const data = await runAudit(safeInput);
      return NextResponse.json({ data });
    }

    if (payload.action === 'export') {
      const audit = asRecord(payload.audit);
      if (!audit) return fail(400, 'VALIDATION', 'An audit result is required to build a report.');
      const clientName = typeof payload.clientName === 'string' ? payload.clientName : '';
      const data = await exportReportFromAudit(audit as unknown as AuditResponse, clientName);
      return NextResponse.json({ data });
    }

    return fail(400, 'VALIDATION', "Unknown action — expected 'run' or 'export'.");
  } catch (error) {
    if (error instanceof AuditServiceError) {
      if (error.status === 501) return fail(501, 'NOT_CONFIGURED', error.message);
      // A genuine bad-input rejection from the audit service is the caller's
      // problem (400), not a server-side upstream failure (502).
      if (error.status === 400 || error.status === 422) return fail(400, 'VALIDATION', error.message);
      return fail(502, 'UPSTREAM', error.message);
    }
    return fail(502, 'UPSTREAM', 'The audit request failed.');
  }
}
