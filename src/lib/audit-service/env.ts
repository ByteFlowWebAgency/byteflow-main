// Site Audit microservice connection. Server-only — these are read here and
// nowhere else, and no NEXT_PUBLIC_ variable ever exposes the key to the browser
// (same convention as lib/google/env.ts and the Supabase resolvers).
//
// AUDIT_SERVICE_URL is required (where the Python FastAPI audit service lives,
// e.g. http://localhost:8000 in dev). AUDIT_API_KEY is optional: the service
// skips auth when its own key is unset (dev only), so we only send X-API-Key
// when we actually have one.

export function resolveAuditServiceEnv(): { baseUrl: string; apiKey: string | null } | null {
  const raw = process.env.AUDIT_SERVICE_URL;
  if (!raw) return null;
  // Accept a bare host:port (e.g. Render's private-service `hostport`, which has no
  // scheme) by defaulting to http:// — the private network isn't TLS-terminated.
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  return {
    baseUrl: withScheme.replace(/\/+$/, ''), // also tolerate a trailing slash
    apiKey: process.env.AUDIT_API_KEY ?? null,
  };
}

export function isAuditServiceConfigured(): boolean {
  return resolveAuditServiceEnv() !== null;
}
