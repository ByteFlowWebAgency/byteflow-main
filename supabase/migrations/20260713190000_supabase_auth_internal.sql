-- supabase_auth_internal.sql — replace the shared-password /internal gate with real
-- Supabase Auth (per-user email/password accounts). Apply with the CLI migration
-- workflow (`supabase db push`), same as internal_auth.sql — never paste into the
-- dashboard SQL Editor.
--
-- This SUPERSEDES internal_auth.sql: the app no longer calls verify_internal_login() or
-- reads internal_users (see src/app/api/internal-login/route.ts,
-- src/app/api/internal-signup/route.ts). Sign-in/up now goes through Supabase Auth's own
-- auth.users table via supabase-js's signInWithPassword/signUp.

-- Drop the old shared-credential table and its verification function. Idempotent: safe
-- to re-run, and safe even if internal_auth.sql was never applied in this environment.
drop function if exists public.verify_internal_login(text, text);
drop table if exists internal_users;

-- Defense in depth: even if the app-level domain check in /api/internal-signup were ever
-- bypassed (e.g. a direct call to the Auth API with a leaked anon key), this trigger
-- refuses the signup at the database layer. SECURITY DEFINER + fixed search_path so it
-- can't be hijacked by a search_path change.
create or replace function public.enforce_internal_email_domain()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or lower(new.email) not like '%@byteflowsolutions.com' then
    raise exception 'Sign-up is restricted to @byteflowsolutions.com email addresses.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_internal_email_domain on auth.users;
create trigger enforce_internal_email_domain
  before insert on auth.users
  for each row execute function public.enforce_internal_email_domain();
