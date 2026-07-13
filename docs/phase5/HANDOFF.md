# Phase 5 — Morning Handoff (run stopped at Discovery)

**TL;DR: Nothing was built tonight.** The Supabase *runtime* prep you did is verified good,
but the **CLI access token on this machine belongs to an account that cannot see the
internal-tools project**, so `supabase link` fails — and every guardrail doc says to stop
right there rather than work around it. The fix is ~5 minutes on your side; the checklist is
below. The repo builds exactly as you left it; the remote database was never touched; the
marketing site and both existing tools are unchanged.

## What was verified GOOD (don't redo this)

- The Supabase project in `.env.local` is **live and correctly keyed**: its REST endpoint
  returns 200 with your service-role key and 401 without. Not paused, not misconfigured.
- `SUPABASE_DB_PASSWORD` is present in `.env.local`.
- Your secrets were never printed, logged, or committed (only name/length/format checks).

## What was BROKEN (the fix checklist)

Work through these in order, then re-launch the phase 5 run:

1. **Create a fresh personal access token from the account that owns the internal-tools
   project** → https://supabase.com/dashboard/account/tokens
   Why: the only token on this machine (`~/.supabase/access-token`, dated Jan 17) belongs to
   an account whose visible orgs are `nelsonbaguma`, `BYTEFLOW SOLUTIONS`, and
   `bookcoachjojo@gmail.com's Org` — and *none of their projects* is the one your
   `.env.local` points at. If you created the project under a different login, make the token
   there. (If it *is* one of those orgs and you expected access, your member role there is
   too low to link — check org access control.)
2. **Export the three CLI vars in the terminal you start the run from** (per
   `SUPABASE-SETUP.md` §2 — `.env.local` alone doesn't reach the `supabase` binary):
   ```bash
   export SUPABASE_ACCESS_TOKEN=<the new sbp_… token>
   export SUPABASE_PROJECT_ID=<project ref — the 20-char id inside your SUPABASE_PROJECT_URL>
   export SUPABASE_DB_PASSWORD=<the db password already in .env.local>
   ```
3. **Add the two spec-named runtime vars to `.env.local`** (the values you already have,
   under the names the app + `SUPABASE-SETUP.md` expect — keep your existing lines too):
   ```
   SUPABASE_URL=<same value as SUPABASE_PROJECT_URL>
   SUPABASE_SERVICE_ROLE_KEY=<same value as SUPABASE_DB_SERVICE_ROLE_KEY>
   ```
4. **Make `supabase --version` work in that shell.** It wasn't installed tonight; I used a
   session-temporary binary that's gone now. Easiest durable options:
   ```bash
   npm i -g supabase        # per SUPABASE-SETUP.md §3 (WSL)
   # or, if npm refuses a global install of that package:
   npx supabase --version   # runs it via npx each time — also fine
   ```
5. **Sanity-check before re-launching** (should take ~30 seconds; all four must pass):
   ```bash
   cd ~/Git/byteflow-main
   supabase --version                          # prints a version
   supabase link --project-ref "$SUPABASE_PROJECT_ID"   # succeeds, no privileges error
   supabase migration list                     # shows remote state (expected: empty)
   git branch --show-current                   # feat/internal-tools-phase5 (retry continues here)
   ```

## What's already on this branch for the retry

- `supabase/` is already initialized (`config.toml` committed) — the retry run goes straight
  to `link` → first migration → `db push`.
- `docs/phase5/DISCOVERY.md` — full repo + prep findings, including one important premise
  correction: **phases 3–4 (Theme Editor, Document Builder) do not exist in this repo** — the
  master prompt's "all four existing tools" is actually two (Proposals, Site Audits). If
  those were built somewhere, they never landed here; if not, the phase 5 prompt's regression
  scope and its references to phase-3/4 storage should be corrected before the retry so the
  agent doesn't chase ghosts.

## Decisions I made without asking

- Installed the Supabase CLI (v2.109.1, official release binary) into the session scratchpad
  to complete the prep check — `SUPABASE-SETUP.md` §3 prescribes installing it, and this left
  no trace in the repo or globally.
- Committed `supabase init` output (`supabase/config.toml` + its `.gitignore`) so the retry
  doesn't repeat the step. No secrets in those files.
- Ran two read-only probes against the project's REST root (with/without the service key) to
  distinguish "project paused/misconfigured" from "token/account mismatch" — this is what
  proves your runtime prep is fine and pins the failure on the CLI token alone.
- Did **not** commit the spec files sitting untracked at the repo root
  (`00-GUARDRAILS (4).md`, `schema (1).sql`, etc.) — they look like fresh downloads with
  collision-suffixed names; committing them is your call. The retry run will read them
  wherever they are.

## Standing items (unchanged from phase 1/2 handoffs)

- `sendgrid.env` with a real-looking key is still committed; rotation + removal still urgent.
- `.gitignore` line for it is still mangled; stale `lint.json` still present.
- `INTERNAL_TOOLS_*` in `.env.local` are still throwaway QA strings; set real ones in
  deployment before first production use.

## The one thing to check first in the morning

Run the four sanity-check commands in step 5. If `supabase link` succeeds, everything else
tonight's run needed is in place — re-launch the phase 5 master prompt on
`feat/internal-tools-phase5` and it can go the distance.
