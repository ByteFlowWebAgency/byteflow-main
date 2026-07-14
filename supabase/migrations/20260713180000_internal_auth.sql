-- internal_auth.sql — BYTEFLOW internal tools sign-in credentials.
-- Apply with the CLI migration workflow (`supabase db push`), same as the CRM/budget
-- schema — never paste into the dashboard SQL Editor. Idempotent as a safety net.
--
-- Design: the /internal login form posts a username + password. Those credentials now
-- live here instead of in env vars. Passwords are stored bcrypt-hashed (pgcrypto), and
-- verification happens IN the database via verify_internal_login() so the hash never
-- leaves Postgres and never reaches the app. Access is server-side only via the
-- service-role key; RLS is enabled with no policies, matching the other internal tables.

-- pgcrypto gives us crypt()/gen_salt() for bcrypt. Supabase keeps extensions in the
-- `extensions` schema (see config.toml extra_search_path); install there if absent.
create extension if not exists pgcrypto with schema extensions;

-- Resolve crypt()/gen_salt() whether pgcrypto lives in `extensions` (Supabase default)
-- or `public` (some older projects) without schema-qualifying every call below.
set search_path = public, extensions;

create table if not exists internal_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lock the table down: RLS on, zero policies. Only the service-role key can touch it,
-- and even that only through the SECURITY DEFINER function below.
alter table internal_users enable row level security;
grant all on table internal_users to service_role;
revoke all on table internal_users from anon, authenticated;

-- Credential check, run entirely server-side in the database. Returns the user's id on a
-- correct username+password, else null. SECURITY DEFINER so it can read the locked table;
-- the fixed search_path prevents search_path hijacking. A dummy bcrypt runs when the
-- username is unknown so response time can't be used to enumerate valid usernames.
create or replace function public.verify_internal_login(p_username text, p_password text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id   uuid;
  v_hash text;
begin
  select id, password_hash into v_id, v_hash
    from internal_users
   where username = p_username;

  if v_hash is null then
    perform crypt(p_password, gen_salt('bf', 10));  -- constant-time-ish; no early return
    return null;
  end if;

  if crypt(p_password, v_hash) = v_hash then
    return v_id;
  end if;
  return null;
end;
$$;

-- create function grants EXECUTE to PUBLIC by default — revoke, then allow service_role only.
revoke all on function public.verify_internal_login(text, text) from public;
revoke all on function public.verify_internal_login(text, text) from anon, authenticated;
grant execute on function public.verify_internal_login(text, text) to service_role;

-- Seeded credentials --------------------------------------------------------------------
-- Default sign-in:  username = admin   password = ByteFlow!2026
-- CHANGE THIS after first login. Idempotent: re-running the migration won't clobber a
-- password you've already rotated.
insert into internal_users (username, password_hash)
values ('admin', crypt('ByteFlow!2026', gen_salt('bf', 10)))
on conflict (username) do nothing;

-- Rotate the password later (in a new migration, or a one-off against the service role):
--   update internal_users
--      set password_hash = crypt('NEW_PASSWORD', gen_salt('bf', 10)), updated_at = now()
--    where username = 'admin';
-- Add another user:
--   insert into internal_users (username, password_hash)
--   values ('teammate', crypt('their-password', gen_salt('bf', 10)));
