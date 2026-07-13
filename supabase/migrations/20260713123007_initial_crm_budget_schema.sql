-- schema.sql — BYTEFLOW internal tools (CRM + Budgets)
-- DO NOT paste this into the dashboard SQL Editor. The overnight agent copies this into the
-- project's FIRST migration file (supabase migration new initial_crm_budget_schema) and
-- applies it with `supabase db push` — see 06-SUPABASE-CLI-WORKFLOW.md. Written idempotent
-- as a safety net, but under the migration workflow it applies exactly once.
--
-- Design: one table per entity. Full entity JSON lives in `data` (jsonb) so the
-- TypeScript types can evolve without migrations; a few columns are extracted for
-- indexing/sorting. All access is server-side via the service-role key; RLS is
-- enabled with NO policies, so the anon/authenticated roles can read nothing.

create table if not exists organizations (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null
);

create table if not exists contacts (
  id uuid primary key,
  name text not null,
  organization_id uuid references organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null
);

create table if not exists deals (
  id uuid primary key,
  title text not null,
  stage text not null,
  organization_id uuid references organizations(id) on delete set null,
  primary_contact_id uuid references contacts(id) on delete set null,
  next_step_due date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null
);

create table if not exists activities (
  id uuid primary key,
  deal_id uuid references deals(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  at timestamptz not null,
  created_at timestamptz not null default now(),
  data jsonb not null
);

create table if not exists budgets (
  id uuid primary key,
  name text not null,
  kind text not null,
  period text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null
);

-- Helpful indexes for the screens' main queries
create index if not exists idx_contacts_org on contacts(organization_id);
create index if not exists idx_deals_stage on deals(stage);
create index if not exists idx_deals_org on deals(organization_id);
create index if not exists idx_activities_deal on activities(deal_id);
create index if not exists idx_activities_contact on activities(contact_id);
create index if not exists idx_activities_at on activities(at desc);
create index if not exists idx_budgets_kind_period on budgets(kind, period);

-- Lock everything down: RLS on, zero policies. Only the service-role key
-- (server-side) can touch these tables.
alter table organizations enable row level security;
alter table contacts enable row level security;
alter table deals enable row level security;
alter table activities enable row level security;
alter table budgets enable row level security;

-- Note for the agent: deletion semantics in the app spec (02-CRM-DATA-MODEL.md) call for
-- confirm-then-null-references, which the FKs above mirror with `on delete set null` as a
-- database-level backstop. The app should still perform its own reference-count confirmation
-- flow before deleting.

-- Added during phase 5 (deviation logged in docs/phase5/): projects on the new Supabase
-- default no longer auto-grant table privileges to the Data API roles, and RLS-bypass does
-- not bypass SQL GRANTs — without this block even the service-role key gets "permission
-- denied". Grant the server-side role everything; explicitly revoke the public-facing roles
-- as belt-and-braces on top of RLS-with-no-policies.
grant all on table organizations, contacts, deals, activities, budgets to service_role;
revoke all on table organizations, contacts, deals, activities, budgets
  from anon, authenticated;
