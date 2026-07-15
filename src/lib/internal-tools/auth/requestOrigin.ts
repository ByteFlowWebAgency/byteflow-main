import type { NextRequest } from 'next/server';

/**
 * Builds an absolute URL for `path` on the request's REAL, public-facing origin.
 *
 * Behind the production reverse proxy, `request.url` reflects the address the Next.js
 * server itself listens on (e.g. http://localhost:10000/...), not the domain the visitor
 * typed — so `NextResponse.redirect(new URL(path, request.url))` sends the browser to
 * localhost. Proxies pass the original host/scheme in the standard X-Forwarded-Host /
 * X-Forwarded-Proto headers; prefer those (first entry, when a multi-proxy chain appends
 * a comma-separated list) and fall back to `request.url` for local dev, where no proxy
 * is in front and the two are the same.
 */
export function externalUrl(request: NextRequest, path: string): URL {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  if (forwardedHost) {
    const forwardedProto =
      request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
    return new URL(path, `${forwardedProto}://${forwardedHost}`);
  }
  return new URL(path, request.url);
}
