import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/proposal-tool/session';

export const runtime = 'nodejs';

// Native <form> POST from the tool's toolbar. Clears the session cookie and returns to
// the login page.
export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/internal/login', request.url), 303);
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
