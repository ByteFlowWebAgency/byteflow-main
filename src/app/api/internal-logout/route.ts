import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseAuthServerClient } from '@/lib/internal-tools/auth/server';

export const runtime = 'nodejs';

// Native <form> POST from the tool's toolbar. Ends the Supabase Auth session (clearing
// its cookies) and returns to the login page.
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseAuthServerClient();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/internal/login', request.url), 303);
}
