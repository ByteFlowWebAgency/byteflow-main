import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseAuthServerClient } from '@/lib/internal-tools/auth/server';
import { isAllowedSignupEmail } from '@/lib/internal-tools/auth/env';
import { adminCreateConfirmedUser } from '@/lib/internal-tools/storage/server';

export const runtime = 'nodejs';

function fail(request: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/internal/signup?error=${code}`, request.url), 303);
}

// Native <form> POST from /internal/signup. Only @byteflowsolutions.com emails may
// register — enforced here AND again in a Postgres trigger on auth.users (defense in
// depth: the trigger still blocks account creation even if this route were ever
// bypassed). The account is created via the admin API, pre-confirmed
// (adminCreateConfirmedUser — see storage/server.ts), then signed in immediately in the
// same request: no confirmation-email step, no window where a signed-up user can't yet
// sign in. Using the public signUp() call here would depend on the project's "Confirm
// email" Auth setting, which isn't something this app controls or should trust.
export async function POST(request: NextRequest) {
  let email = '';
  let password = '';
  let confirmPassword = '';
  try {
    const form = await request.formData();
    email = String(form.get('email') ?? '').trim();
    password = String(form.get('password') ?? '');
    confirmPassword = String(form.get('confirmPassword') ?? '');
  } catch {
    return fail(request, 'signup-failed');
  }

  if (!email || !password) return fail(request, 'signup-failed');
  if (password.length < 8) return fail(request, 'weak');
  if (password !== confirmPassword) return fail(request, 'mismatch');
  if (!isAllowedSignupEmail(email)) return fail(request, 'domain');

  const created = await adminCreateConfirmedUser(email, password);
  if (!created.ok) {
    const message = created.error.toLowerCase();
    if (message.includes('already registered') || message.includes('already exists')) {
      return fail(request, 'exists');
    }
    if (!isAllowedSignupEmail(email)) {
      return fail(request, 'domain');
    }
    return fail(request, 'signup-failed');
  }

  const supabase = await createSupabaseAuthServerClient();
  if (!supabase) return fail(request, 'signup-failed');

  // Sign the freshly created account in right away — cookies are set via the client's
  // cookie adapter, same as /api/internal-login.
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return fail(request, 'signup-failed');

  return NextResponse.redirect(new URL('/internal', request.url), 303);
}
