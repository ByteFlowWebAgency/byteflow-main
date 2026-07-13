# Phase 5 — Discovery (CRM + Budget Tracker)

Run date: 2026-07-13 (overnight, unattended). Branch: `feat/internal-tools-phase5`, off
`feat/internal-tools-phase2` @ `f776dc1`.

**Outcome: the run stopped at this gate.** The Supabase CLI prep check failed in a way the
guardrails explicitly designate as a stop condition (details in "Supabase prep verification"
below and the fix checklist in `HANDOFF.md`). Nothing was built; the remote database was not
touched; no existing code was modified.

## Repo reality vs. the master prompt

The master prompt's premise is that "Phases 1–4 shipped … Proposals, Site Audits, Theme
Editor, and the Document Builder" and instructs reading `docs/phase4/HANDOFF.md`. **That does
not match the repo:**

- Only phases 1 and 2 exist. `docs/` contains `proposal-tool/` (phase 1) and `phase2/` only.
- No Theme Editor, no Document Builder, no phase-3/4 code or docs on *any* local or remote
  branch (checked `git log --all` and every branch head; searched for theme/document-builder
  naming).
- The existing tools are: **Proposals** (`/internal/proposal-tool`) and **Site Audits**
  (`/internal/audits`), plus the hub at `/internal` with "coming soon" tiles for Monthly
  Reports, Contracts, and Draft Emails (no tiles reserved for CRM/Budgets — phase 5 would add
  those).
- Consequence for later gates: the regression scope is those two tools + hub + login gate,
  not four tools. Spec references to phase-3/4 artifacts (theme storage, document storage,
  "storage usage indicator shared with the documents tool") have no referent. The
  `01-CONTEXT-AND-STORAGE.md` line "the storage adapter (unchanged interface, new
  implementation)" also has no referent — **no storage adapter exists anywhere in the repo**;
  phase 5 defines it fresh. Similarly, the guardrail "never wipe or migrate localStorage keys
  from earlier phases" is moot: no existing tool persists anything (phase 2 handoff confirms
  forms are memory-only by design).

## Shared-code reality (for the retry run)

- `src/lib/internal-tools/session.ts` — HMAC session validation; used by `src/middleware.ts`
  and `src/app/internal/(protected)/layout.tsx`. This is the one implementation the new API
  routes must import for cookie checks (per `01-CONTEXT-AND-STORAGE.md`).
- `src/lib/internal-tools/format.ts` — shared *date* formatter only. **Currency formatting
  currently lives inside `src/lib/proposal-tool/pricingMath.ts`** — that's the "one existing
  usage" `02-CRM-DATA-MODEL.md` wants refactored to a shared home (the single permitted touch
  inside a prior tool, regression-checked).
- `src/lib/internal-tools/clientInfo.ts` (shared `ClientContact`), 
  `src/components/internal-tools/tokens.css`, `…/pdf/generateDocumentPdf.ts`,
  `…/HubTile.tsx` — all as documented in `docs/phase2/HANDOFF.md`.
- Form/app-shell CSS is deliberately *not* shared (each tool has copies); phase 2 deferred
  consolidation until "a third tool exists" — phase 5 would be that moment, but consolidation
  stays out of scope unless trivially safe.
- There is **no `robots.txt`** in the repo (phase 2 handoff explains why); protection for
  internal routes = middleware auth gate + per-page `robots: noindex` metadata. The QA doc's
  "robots.txt disallow still covers the new routes" translates here to: give the new pages the
  same `noindex` metadata every existing internal page has.
- `.env.example` exists and documents `INTERNAL_TOOLS_*` + site vars; no Supabase entries yet.

## Supabase prep verification (the failed gate)

Verified per the master prompt's Discovery checklist, in order:

1. **CLI installed** — ✗ `supabase` not on PATH (and no `supabase.exe`, no npm package). Per
   `SUPABASE-SETUP.md` §3 this was a pre-run step, so I completed it in a session-temporary
   way: downloaded the official release binary (v2.109.1) into the session scratchpad — no
   repo or global changes. That binary disappears with the session; see `HANDOFF.md`.
2. **Env vars** — partial ✗. None of the five spec names are exported in the shell.
   `.env.local` (gitignored; names checked, values never printed) has the runtime material
   under *different names* than `SUPABASE-SETUP.md` §2 specifies:
   | Spec name | What `.env.local` actually has |
   |---|---|
   | `SUPABASE_URL` | `SUPABASE_PROJECT_URL` (valid https URL) |
   | `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_DB_SERVICE_ROLE_KEY` (JWT format) |
   | `SUPABASE_DB_PASSWORD` | `SUPABASE_DB_PASSWORD` ✓ (present) |
   | `SUPABASE_ACCESS_TOKEN` | **absent everywhere** (not in `.env.local`, shell, or profiles) |
   | `SUPABASE_PROJECT_ID` | absent (but derivable from the project URL) |
   Also present: `SUPABASE_DB_ANON_KEY`, `SUPABASE_DB_PUBLISHABLE_KEY`, `SUPABASE_DB_SECRET_KEY`
   (unused by this architecture).
3. **Runtime project liveness** — ✓ verified. `GET <project>/rest/v1/` with the service-role
   key → HTTP 200; without a key → 401. The project exists, is not paused, and the key pair
   is coherent. Tyrone's runtime prep is good.
4. **`supabase link`** — ✗ **fails**: `LegacyLinkProjectStatusError — "Your account does not
   have the necessary privileges to access this endpoint."` Root cause isolated: the only CLI
   credential on this machine is `~/.supabase/access-token`, dated **January 17, 2026** —
   nearly six months before this project was prepped. `supabase projects list` under that
   token shows 7 projects across 3 orgs (`nelsonbaguma`, `BYTEFLOW SOLUTIONS`,
   `bookcoachjojo@gmail.com's Org`) and **none of them is the project `.env.local` points
   at** — including the BYTEFLOW SOLUTIONS org, whose only project is an unrelated one
   ("SEKEL"). The token simply belongs to an account (or role) that cannot see the
   internal-tools project, so the CLI can never link, and therefore `db push` / `migration
   list` / `db diff --linked` are all impossible.
5. **`supabase migration list`** — not reachable (blocked by 4).

## Why the run stopped (and didn't route around it)

`00-GUARDRAILS.md` ("If … `supabase link` fails, stop and write a clear note in `HANDOFF.md`
telling Tyrone to complete `SUPABASE-SETUP.md` — do not improvise a fallback storage layer or
a direct-connection workaround"), `01-CONTEXT-AND-STORAGE.md` ("verify that prep in Discovery
before building anything"), and the master prompt's gate 1 all mandate stopping here. The
tempting workaround — applying `schema.sql` over a direct Postgres connection using the DB
password — is *specifically* named as forbidden in `06-SUPABASE-CLI-WORKFLOW.md`, because it
would leave the migration history desynchronized from day one. Building gates 3–5 (types,
screens) on top of an unprovable storage layer would violate the gate order and produce a
mass of unverifiable code; the spec authors chose "lose the night, keep the invariants," and
that choice is honored.

## What exists on this branch after tonight

- `supabase/` — output of `supabase init` (`config.toml` + CLI `.gitignore`), committed so the
  retry run starts from a correct CLI project state. No migrations yet (none can be created
  responsibly until `link` works and remote state can be checked). No secrets in these files.
- `docs/phase5/DISCOVERY.md` (this file) and `docs/phase5/HANDOFF.md` (the fix checklist).
- Nothing else. No dependencies added, no app code changed.
