// Supabase Auth client for Server Components and Route Handlers (Node runtime), backed
// by the Next.js cookie store. This is the ONLY module allowed to construct an Auth
// client from next/headers — mirrors the storage/server.ts convention for the
// service-role client. Route Handlers can set/clear the session cookies (sign-in/out);
// Server Components can only read them, so the set/remove callbacks there are no-ops
// (Next.js forbids mutating cookies outside a Route Handler or Server Action).

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseAuthEnv } from './env';

export function isSupabaseAuthConfigured(): boolean {
  return resolveSupabaseAuthEnv() !== null;
}

/** Null when Supabase Auth env vars are unset — callers must fail closed (deny). */
export async function createSupabaseAuthServerClient(): Promise<SupabaseClient | null> {
  const env = resolveSupabaseAuthEnv();
  if (!env) return null;
  const cookieStore = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render — cookies are read-only there.
          // The middleware refresh on the next request keeps sessions in sync.
        }
      },
    },
  });
}

/** The signed-in user for the current request, or null if unauthenticated/unconfigured. */
export async function getCurrentInternalUser() {
  const supabase = await createSupabaseAuthServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
