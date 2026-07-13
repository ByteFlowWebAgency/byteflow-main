import { NextResponse, type NextRequest } from 'next/server';
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_TTL_MS,
} from '@/lib/internal-tools/session';
import {
  isSupabaseConfigured,
  verifyInternalCredentials,
} from '@/lib/internal-tools/storage/server';

export const runtime = 'nodejs';

// Native <form> POST from /internal/login. Credentials are checked against Supabase
// (the internal_users table, bcrypt-verified in-database). Success sets the httpOnly
// session cookie and redirects to the tool; any failure redirects back with one generic
// error flag — never which field was wrong, never a crash when Supabase or the signing
// secret is unset (fail safe = deny).
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

  if (!username || !password || !isSupabaseConfigured()) {
    return NextResponse.redirect(loginUrl, 303);
  }

  let valid = false;
  try {
    valid = await verifyInternalCredentials(username, password);
  } catch {
    // Database/upstream failure — deny, and reveal nothing about why.
    return NextResponse.redirect(loginUrl, 303);
  }
  if (!valid) {
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
