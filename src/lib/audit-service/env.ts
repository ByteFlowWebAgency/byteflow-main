// Site Audit microservice connection. Server-only — these are read here and
// nowhere else, and no NEXT_PUBLIC_ variable ever exposes the key to the browser
// (same convention as lib/google/env.ts and the Supabase resolvers).
//
// AUDIT_SERVICE_URL is required (where the Python FastAPI audit service lives,
// e.g. http://localhost:8000 in dev). AUDIT_API_KEY is optional: the service
// skips auth when its own key is unset (dev only), so we only send X-API-Key
// when we actually have one.

export function resolveAuditServiceEnv(): { baseUrl: string; apiKey: string | null } | null {
  const baseUrl = process.env.AUDIT_SERVICE_URL;
  if (!baseUrl) return null;
  return {
    baseUrl: baseUrl.replace(/\/+$/, ''), // tolerate a trailing slash in the env value
    apiKey: process.env.AUDIT_API_KEY ?? null,
  };
}

export function isAuditServiceConfigured(): boolean {
  return resolveAuditServiceEnv() !== null;
}
