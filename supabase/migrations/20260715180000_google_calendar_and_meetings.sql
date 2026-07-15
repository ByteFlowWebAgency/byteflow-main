-- Google Calendar connection + meeting↔CRM match records.
-- DO NOT paste this into the dashboard SQL Editor — apply it with `supabase db push`
-- (same workflow as the three migrations before it). Written idempotent as a safety net.
--
-- Two unrelated concerns, one migration because they ship together:
--
-- 1. google_calendar_tokens — the Google Calendar *authorization* grant. This is NOT
--    authentication: sign-in remains Supabase Auth email/password and is untouched. A
--    signed-in internal user separately grants read-only access to their calendar, and we
--    keep the resulting refresh token so the server can mint access tokens later without
--    re-prompting. Scope is calendar.events.readonly only — this integration never writes
--    to anyone's calendar.
--
-- 2. meetings — the persisted resolution of a Google Calendar event to a CRM record, so
--    the matcher doesn't re-guess on every page load and so a human's manual correction is
--    never silently overwritten by the automatic matcher.

create table if not exists google_calendar_tokens (
  -- One grant per internal user. `on delete cascade` is deliberate here and differs from
  -- the CRM tables' `on delete set null`: a refresh token that outlives its user is a
  -- credential with no owner, which is a security problem, not a dangling reference.
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  -- Which Google account was connected, for display ("Connected as x@y.com") and so a
  -- user can tell they authorised the wrong account.
  google_email text,
  scope text not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists meetings (
  id uuid primary key,
  -- The Google Calendar event id. Unique: one match record per event, upserted.
  -- For recurring events this is the *instance* id (the fetch layer requests
  -- singleEvents=true), so rescheduling one occurrence cannot re-point the series.
  event_id text not null unique,
  -- All three optional: an event may resolve to an org with no specific contact/deal, and
  -- a deliberate "leave this unmatched" is a row with all three null + match_source
  -- 'manual'. `on delete set null` mirrors the CRM tables — deleting an org must not
  -- delete history of the meeting.
  organization_id uuid references organizations(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  starts_at timestamptz not null,
  -- 'auto' | 'manual'. A 'manual' row is never re-evaluated by the automatic matcher.
  match_source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null
);

create index if not exists idx_meetings_event on meetings(event_id);
create index if not exists idx_meetings_org on meetings(organization_id);
create index if not exists idx_meetings_starts_at on meetings(starts_at desc);

-- Lock everything down: RLS on, zero policies. Only the service-role key (server-side)
-- can touch these tables.
alter table google_calendar_tokens enable row level security;
alter table meetings enable row level security;

-- Projects on the new Supabase default no longer auto-grant table privileges to the Data
-- API roles, and RLS-bypass does NOT bypass SQL GRANTs — without this block even the
-- service-role key gets "permission denied". (Same footgun as the phase-5 migration.)
-- anon/authenticated are revoked explicitly as belt-and-braces on top of RLS.
grant all on table google_calendar_tokens, meetings to service_role;
revoke all on table google_calendar_tokens, meetings from anon, authenticated;
