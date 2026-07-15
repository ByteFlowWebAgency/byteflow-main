import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseAuthServerClient } from '@/lib/internal-tools/auth/server';

export const runtime = 'nodejs';

// Native <form> POST from /internal/login. Credentials are verified by Supabase Auth
// itself (signInWithPassword) — this route never sees a password hash, just a
// success/failure result. Success sets the Supabase session cookies (via the client's
// cookie adapter) and redirects to the tool; any failure redirects back with one generic
// error flag — never which field was wrong, never a crash when Supabase env is unset
// (fail safe = deny).
export async function POST(request: NextRequest) {
  const loginUrl = new URL('/internal/login?error=1', request.url);

  let email = '';
  let password = '';
  try {
    const form = await request.formData();
    email = String(form.get('email') ?? '');
    password = String(form.get('password') ?? '');
  } catch {
    return NextResponse.redirect(loginUrl, 303);
  }

  if (!email || !password) {
    return NextResponse.redirect(loginUrl, 303);
  }

  const supabase = await createSupabaseAuthServerClient();
  if (!supabase) {
    return NextResponse.redirect(loginUrl, 303);
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.redirect(loginUrl, 303);
  }

  // Land on the internal-tools hub — the shared entry point to the gated area.
  return NextResponse.redirect(new URL('/internal', request.url), 303);
}
