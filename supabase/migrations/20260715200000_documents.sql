-- Documents, server-side, linked to a CRM organization. Closes BLOCKER 2.
-- Apply with `supabase db push`. Idempotent.
--
-- Until now documents existed ONLY in each person's browser localStorage (`bf-docs:<uuid>`),
-- with no link to a CRM record. That made "does this client have a proposal ready?" —
-- the entire premise of the meetings feature — unanswerable: the server had no table to
-- query, and a document built on a laptop was invisible on a phone and to every teammate.
--
-- This table is the shared, queryable copy. localStorage stays the local editing store and
-- is never cleared by the sync: per 00-GUARDRAILS.md, existing document data is never
-- deleted or overwritten, only mirrored up and merged down.

create table if not exists documents (
  -- Same id as the localStorage record, so the two stores line up and re-syncing is
  -- idempotent rather than duplicating.
  id uuid primary key,
  -- THE link. Optional: a document can legitimately have no client yet (a blank draft), and
  -- `on delete set null` matches the CRM's null-references-never-cascade contract — deleting
  -- an organization must never destroy the proposal you wrote for them.
  organization_id uuid references organizations(id) on delete set null,
  name text not null,
  -- Extracted for the documents list and the "is it ready" badge, so neither has to pull the
  -- full `data` blob (documents embed images as data URLs and run to megabytes).
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  data jsonb not null
);

create index if not exists idx_documents_org on documents(organization_id);
create index if not exists idx_documents_updated_at on documents(updated_at desc);

alter table documents enable row level security;

-- Mandatory: RLS-bypass does not bypass SQL GRANTs, and without this even the service-role
-- key gets "permission denied" on a new Supabase project.
grant all on table documents to service_role;
revoke all on table documents from anon, authenticated;
