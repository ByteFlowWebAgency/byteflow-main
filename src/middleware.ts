import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { resolveSupabaseAuthEnv } from '@/lib/internal-tools/auth/env';
import { externalUrl } from '@/lib/internal-tools/auth/requestOrigin';

const PUBLIC_PATHS = ['/internal/login', '/internal/signup'];

// Access gate for the internal tools namespace. Scoped strictly to /internal/* — public
// marketing routes never enter this middleware. Backed by Supabase Auth: getUser() both
// verifies the session (server-side call to Supabase, not just a cookie decode) and
// refreshes the access token when it's near expiry, writing the renewed cookies onto the
// response that continues down the chain. Fails closed — no configured Supabase env
// means no session can ever verify, so the gate denies rather than opening.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  const env = resolveSupabaseAuthEnv();
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  let authenticated = false;
  if (env) {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authenticated = !!user;
  }

  if (isPublicPath) {
    // Already signed in — skip the form and go to the internal tools hub.
    if (authenticated) {
      return NextResponse.redirect(externalUrl(request, '/internal'));
    }
    return response;
  }

  if (!authenticated) {
    return NextResponse.redirect(externalUrl(request, '/internal/login'));
  }
  return response;
}

export const config = {
  matcher: ['/internal/:path*'],
};
