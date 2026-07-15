// Env resolution for Supabase Auth (the /internal sign-in gate). Distinct from
// storage/server.ts's service-role resolution: Auth calls (signInWithPassword, signUp,
// signOut, getUser) go through the anon/publishable key, never the service-role key.
// Server-only — the anon key is read here and only here for Auth; no NEXT_PUBLIC_
// variable exposes it to the browser (see .env.example).

export function resolveSupabaseAuthEnv(): { url: string; anonKey: string } | null {
  const url = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_DB_ANON_KEY ||
    process.env.SUPABASE_DB_PUBLISHABLE_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/** The only email domain allowed to self-serve a new /internal account. */
export const ALLOWED_SIGNUP_DOMAIN = 'byteflowsolutions.com';

export function isAllowedSignupEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${ALLOWED_SIGNUP_DOMAIN}`);
}
