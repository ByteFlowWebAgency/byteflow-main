import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/proposal-tool/session';

// Access gate for the internal tools namespace (07-INTEGRATION-AND-QA.md). Scoped
// strictly to /internal/* — public marketing routes never enter this middleware.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (pathname.startsWith('/internal/login')) {
    // Already signed in — skip the form and go straight to the tool.
    if (authenticated) {
      return NextResponse.redirect(new URL('/internal/proposal-tool', request.url));
    }
    return NextResponse.next();
  }

  if (!authenticated) {
    return NextResponse.redirect(new URL('/internal/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/internal/:path*'],
};
