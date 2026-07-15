# HANDOFF — ByteFlow internal dashboard, meetings & CRM

Structured per `08-EXECUTION-PLAN.md`'s `HANDOFF.md` spec.

---

## 1. Branch + what shipped

**Branch:** `feat/internal-dashboard-meetings` (off `dev` @ `1c9d592`). One commit, `20d358f`.
Not pushed, not deployed. `main`/`dev` untouched.

**Summary.** Phases 1 and 2 of the six-phase package are complete; Phases 3–6 are blocked and
were not started. `/internal/` is now a real dashboard: the three non-functional "coming soon"
tiles are gone, and the six working tools are grouped into Pipeline / Client deliverables /
Brand system using only the existing ByteFlow theme tokens. Phase 2's recon then established —
against the code, and adversarially verified — that **two of this package's stated
prerequisites do not exist**: the Google Calendar OAuth integration was never built, and
documents have no link to a CRM record of any kind. Since Phases 3–6 rest entirely on those
two foundations, they were stopped rather than built on assumption, per `03-RECON.md` Step 1
and the master prompt. The recon itself is the other deliverable: `RECON.md` maps the real CRM,
document, and theme schemas and proposes a matching strategy grounded in what's actually there.

---

## 2. What was removed from `/internal/` in Phase 1

Three tiles — **Monthly Reports**, **Contracts**, **Draft Emails** (`page.tsx:75-92` pre-change).

**Confirmation each was a true non-functional placeholder** (not misjudged): all three passed
`status="coming-soon"` and **no `href` prop at all**, so `HubTile.tsx:34`'s
`status === 'live' && href` gate sent them to the fallback branch, rendering an inert `<div>`
with `.tileDisabled` (opacity 0.45) and a literal "Coming soon" badge. **No route, component,
or logic existed behind any of them** — the only directories under `src/app/internal` are
`backgrounds`, `budgets`, `crm`, `documents`, `documents/[id]`, `slides`, `slides/[id]`,
`theme-editor`, `login`, `signup`. There was nothing to delete alongside the tiles.

Each verdict was independently re-checked by an agent instructed to *refute* it and to default
to "real feature" on any doubt. All three refutations failed — the verdicts held.

**Nothing was removed that turned out to be real.** One tile came close to a wrong call:
**Backgrounds** describes itself as "preview only / Purely a preview surface" in its own header
comment, which reads like a stub. It isn't — it renders the real `BACKGROUND_DESIGNS` registry
through a live `ThemePicker`. Preview-only *by design* ≠ unfinished. **Kept.**

Also removed as now-dead code: `HubTile`'s `status` prop and disabled branch, and the
`.tileDisabled` / `.badge` CSS rules. `href` is now required. Recoverable at `20d358f^`.

---

## 3. The real CRM / document / theme schema found in Phase 2

**Documentation lives in [`RECON.md`](./RECON.md)** (full detail, every claim cited to
`file:line`). Summary:

- **CRM** — Supabase, one table per entity, **full entity JSON in a `data jsonb` column** with a
  few columns extracted only for indexing (`supabase/migrations/20260713123007_initial_crm_budget_schema.sql:7-10`).
  Entities: `organizations`, `contacts`, `deals`, `activities` (+ non-CRM `budgets`).
  `Organization` (`src/lib/crm/types.ts:12-19`) is exactly `id`, `name`, `website?`, `orgType?`,
  `notes?`, `createdAt` — **no domain, no email, no primary contact, no status**. Stage lives on
  `Deal`; a key contact is only nameable via `Deal.primaryContactId`. RLS on with zero policies;
  service-role only, and the explicit `GRANT` is mandatory.
  **Consequence:** adding a *field* to an existing entity needs **no migration** (jsonb);
  only a new table does.
- **Documents** — **not in the database at all.** localStorage only (`bf-docs:<uuid>`,
  `src/lib/document-builder/storage.ts:23`), no CRM foreign key, and extra fields are silently
  dropped on save (`:256-266`). Only client association is free-text `clientName` on a cover
  page, defaulting to `'[Client name]'`. No `type` discriminator distinguishes a proposal from
  an audit.
- **Theme** — `src/components/internal-tools/tokens.css`, scoped to `.bfScope`, consumed via CSS
  Modules and `var(--bf-*)`. **Two separate sets:** app-chrome tokens vs `--bf-paper-*` document
  tokens (the dashboard must use the former). Light chrome flips via
  `html[data-bf-chrome='light']`. **Only one semantic colour token exists (`--bf-color-error`)** —
  no success/warning/info. There is no shared Badge component.

---

## 4. The exact matching strategy implemented, where the logic lives, its accuracy on real data

**Not implemented — Phase 3 is blocked (BLOCKER 1).** No matching logic exists on this branch,
so there is no accuracy figure to report. Reporting one would be fabrication.

A **proposed** strategy, justified against the real schema, is in `RECON.md § Step 5`. In brief:
exact `Contact.email` match → hop `organizationId` (highest confidence, and a signal the spec
didn't list); then normalized attendee domain vs normalized `Organization.website`, unique hit
only; then normalized org name ⊂ event title, unique hit + length floor; else **unmatched**.
Matching should run in memory over the already-loaded `CrmData` — no SQL, no new index.

**Two things whoever implements it must not skip:**
- **Blocklist consumer email domains** (`gmail.com`, `outlook.com`, …) before any domain match.
  Without it, a single `gmail.com` attendee domain-matches every org that has a Gmail contact —
  silently assigning meetings to the wrong client, the exact failure `00-GUARDRAILS.md` calls
  "worse than no match."
- **Sample the real data first.** Both email- and domain-based signals depend on data quality
  nobody has measured: `Organization.website` is optional, unvalidated, unnormalized free text,
  and `Contact.email` is optional and unvalidated. If website is mostly empty and contact emails
  are mostly personal, only title-matching + manual assignment are viable, and the CRM should
  grow a normalized `domain` field first (no migration needed — jsonb).

---

## 5. What the `meetings` field/relation looks like, and any migration involved

**Not built — no migration was written and no schema was changed.** Phase 3 is blocked.

`RECON.md § Step 2` documents the exact 7-step recipe to add one when unblocked, and flags the
open design question: a **new `meetings` entity** vs **extending the existing `Activity` kind
`'meeting'`** (`src/lib/crm/types.ts:64`, which already exists and already has an indexed
`at timestamptz` plus dual optional FKs to deal/contact — but **no `organization_id`**). Both fit
the schema; it's a product decision, not a code one.

⚠️ **`supabase/` is gitignored** (`.gitignore:43-44`). The three existing migrations are on disk
but untracked, so a new one would not travel with the branch by default. Decide this deliberately
before Phase 3 writes one.

---

## 6. Confirmation the list and grid share one data-fetching/matching layer

**Not applicable — neither view was built.** There is consequently no duplicated fetch layer,
and no shared one either. Both `05-MEETINGS-WIDGET.md` and `06-CALENDAR-VIEW.md` are explicit
that they must consume Phase 3's layer with a date-range parameter rather than each calling the
Calendar API; that constraint carries forward intact to whoever builds them.

---

## 7. Known edge cases and gaps

Carried forward for whoever picks this up. The first four are the ones the spec asked about
directly:

- **Recurring events** — unaddressed. Google returns recurring events either as a series or as
  expanded instances depending on `singleEvents`. Each instance needs its own match record keyed
  by instance ID, or one reschedule silently re-points every occurrence.
- **Meetings with no attendees** — signals 1 and 2 both evaporate; only title-matching or manual
  assignment remain. Internal-only holds and focus blocks will land here and should stay
  unmatched, not be force-matched.
- **Multiple plausible CRM matches** — the proposed strategy auto-matches **only on a unique
  hit** at every tier and otherwise leaves the event unmatched, per `00-GUARDRAILS.md`.
- **Week view** (`06-CALENDAR-VIEW.md` stretch item) — **not built**, along with the rest of the
  grid. Noted here rather than skipped silently, as that spec requires.

Additional gaps found during recon that the specs didn't anticipate:

- **CRM records are not deep-linkable.** `07-MISSING-DOCUMENT-FLOW.md` Step 2 needs to link to a
  record's edit view; no such URL exists. `/internal/crm` is the only CRM route and the detail
  view is component state that never touches the URL. Small contained fix (query-param sync in
  `CrmApp`), but net-new work the spec assumes is already there.
- **No success/warning theme token** for the Ready/Needs-prep badge. "Ready" can use
  `--bf-color-cyan-soft`; **"Needs prep" has no suitable token**, and the only amber precedent is
  a hardcoded `#fbbf24` that doesn't flip and fails contrast on light chrome. Needs a decision —
  adding a token pair touches the brand palette, which the guardrails forbid unilaterally.
- **No document `type` discriminator** — a proposal and an audit are the same runtime type,
  distinguished only by an "informational" `templateId`. So "the *right* document for this
  meeting" has no field to key off.
- **No pre-fill seam into document creation** — no `/internal/documents/new` route, and neither
  documents route reads `searchParams`. `createCoverPage(fields?: Partial<CoverFields>)`
  (`defaults.ts:81-94`) already accepts and spreads a partial, so `clientName` pre-fill has a
  natural home; no caller passes anything today.
- **Pre-existing dev-only hydration warning** in light chrome from the layout's pre-paint script
  (`layout.tsx:35-40`). Predates this branch; noted so it isn't misread as Phase 1 fallout.

---

## 8. Blockers, summarized, with recommended next steps

Both are in [`BLOCKERS.md`](./BLOCKERS.md) with full evidence.

**BLOCKER 1 — Google Calendar OAuth does not exist.** Blocks Phases 3–6.
`01-CONTEXT.md` lists NextAuth + Google provider + `calendar.events.readonly` + refresh-token
persistence + session `accessToken` as already built. Four independent searches — three of them
adversarial agents told to assume it existed and find it — turned up nothing across 40 branches
and ~400 commits. `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` exist in `.env.local` exactly as
`00-GUARDRAILS.md:34` says, but **no code reads them**; that is the likely source of the
misunderstanding. The referenced `GOOGLE-CALENDAR-OAUTH-PROMPT.md` isn't in the repo either.
→ **Next step:** run that separate OAuth task (locating or rewriting the prompt first). Note the
design decision waiting there: internal auth is *already* Supabase Auth, so adding NextAuth means
two session systems on the same routes. Supabase's own `signInWithOAuth` + `provider_token` is
likely cheaper — but it's a different architecture from what `01-CONTEXT.md` describes, so it
should be chosen deliberately, not defaulted into.

**BLOCKER 2 — documents have no CRM linkage and are localStorage-only.** Blocks the
document-status core of Phases 4–6, **independently of BLOCKER 1**. There is no client-tagging
convention to discover; "does this client have a document?" is unanswerable server-side (no
table) and unreliable client-side (free-text `clientName` vs `organizations.name`). Documents are
per-browser and per-device.
→ **Next step:** scope "persist documents server-side and link them to a CRM record" as its own
task, sequenced **before** Phases 4–6 — a `documents` table, an `organization_id` FK, an API
route, a validator, a creation-flow seam, **and** a migration path for documents already sitting
in team members' localStorage. That migration is the risky part: per `00-GUARDRAILS.md` ("never
delete or overwrite existing document data") it needs a deliberate plan, not a best-effort import.

**Recommended sequencing when unblocked:** OAuth task → document-persistence task → then Phases
3–6 as written. Phase 3's matching layer only needs BLOCKER 1; Phases 4–6 need both.

**Flagged for a human call, not blocking:** the missing success/warning theme token; `supabase/`
being gitignored; CRM deep-linking. All three in `BLOCKERS.md § Not blockers, but flagged`.
