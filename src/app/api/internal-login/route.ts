import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_TTL_MS,
} from '@/lib/proposal-tool/session';

export const runtime = 'nodejs';

/**
 * Timing-safe credential comparison. Hashing both sides first gives equal-length
 * buffers (the padding step 07-INTEGRATION-AND-QA.md calls for) so timingSafeEqual
 * never throws and response timing reveals nothing about match length.
 */
function safeEqual(submitted: string, expected: string): boolean {
  const a = createHash('sha256').update(submitted, 'utf8').digest();
  const b = createHash('sha256').update(expected, 'utf8').digest();
  return timingSafeEqual(a, b);
}

// Native <form> POST from /internal/login. Success sets the httpOnly session cookie and
// redirects to the tool; any failure redirects back with one generic error flag — never
// which field was wrong, never a crash when env vars are unset (fail safe = deny).
export async function POST(request: NextRequest) {
  const loginUrl = new URL('/internal/login?error=1', request.url);

  let username = '';
  let password = '';
  try {
    const form = await request.formData();
    username = String(form.get('username') ?? '');
    password = String(form.get('password') ?? '');
  } catch {
    return NextResponse.redirect(loginUrl, 303);
  }

  const expectedUsername = process.env.INTERNAL_TOOLS_USERNAME;
  const expectedPassword = process.env.INTERNAL_TOOLS_PASSWORD;
  if (!expectedUsername || !expectedPassword) {
    return NextResponse.redirect(loginUrl, 303);
  }

  // Evaluate both comparisons unconditionally — no early exit on a bad username.
  const usernameOk = safeEqual(username, expectedUsername);
  const passwordOk = safeEqual(password, expectedPassword);
  if (!(usernameOk && passwordOk)) {
    return NextResponse.redirect(loginUrl, 303);
  }

  const token = await createSessionToken();
  if (!token) {
    return NextResponse.redirect(loginUrl, 303);
  }

  // Land on the internal-tools hub — the shared entry point to the gated area.
  const response = NextResponse.redirect(new URL('/internal', request.url), 303);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return response;
}
