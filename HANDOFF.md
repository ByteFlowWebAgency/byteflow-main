# HANDOFF — ByteFlow internal dashboard, meetings & CRM

Structured per `08-EXECUTION-PLAN.md`'s `HANDOFF.md` spec.

---

## 1. Branch + what shipped

**Branch:** `feat/internal-dashboard-meetings` (off `dev` @ `1c9d592`). Three commits:
`20d358f` (Phase 1), `6c177c4` (Phase 2 docs), `3844433` (OAuth + Phase 3). Not pushed, not
deployed. `main`/`dev` untouched.

**Summary.** Phases 1, 2 and 3 are complete, plus a Calendar OAuth integration that wasn't in
the package. Phases 4–6 are blocked and were not started. `/internal/` is now a real
dashboard: the three non-functional "coming soon" tiles are gone and the six working tools are
grouped into Meetings / Pipeline / Client deliverables / Brand system, using only existing
theme tokens. Phase 2's recon then established — against the code, adversarially verified —
that **two of the package's stated prerequisites did not exist**: the Google Calendar OAuth
integration was never built, and documents have no link to a CRM record. Tyrone authorised
closing the first: Google Calendar access is now an **authorization** grant (sign-in stays
Supabase email/password, untouched), which unblocked Phase 3's meetings↔CRM matching layer.
The second gap still blocks Phases 4–6, because the "Ready"/"Needs prep" badge those phases
exist to show has no data to read.

**⚠️ Two manual steps before the calendar works** (details in `BLOCKERS.md`): register
`…/api/google/callback` in the Google Cloud Console, and apply
`supabase/migrations/20260715180000_google_calendar_and_meetings.sql` with `supabase db push`
— `supabase/` is gitignored so **the migration is not in the commit**.

**Honest status of the Phase 3 gate:** the matching logic is verified by 26 tests against the
real compiled matcher, and every route is verified to fail closed. But **no live calendar has
been read and no real CRM row matched**, because both need the console step and a human to
click through Google's consent screen. "A real upcoming meeting resolves to the correct CRM
record" is therefore **not** confirmed on real data.

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

**Where:** `src/lib/meetings/match.ts` (pure, no I/O — every branch is covered by tests),
with the domain blocklists in `src/lib/meetings/consumerDomains.ts` and orchestration in
`src/lib/meetings/resolve.ts`.

**What.** Tiers are tried in order; the first to produce a **unique** hit wins, and ambiguity
at any tier falls through rather than guessing:
1. **Exact attendee email → `Contact.email` → hop `organizationId`.** Highest confidence — a
   signal `03-RECON.md` didn't list. If several attendees are contacts they must agree on one
   org, otherwise it falls through.
2. **Attendee email domain → `Organization.website` domain.** Corporate domains only. Unique
   hit only.
3. **Full normalised org name appears in the event title** (word-boundary, ≥4 chars). Unique
   hit only.
4. Otherwise **unmatched**.

Own-domain attendees (`byteflowsolutions.com`) are dropped first — a colleague on the invite
says nothing about which client it is.

**Accuracy on real data: UNKNOWN, and deliberately not estimated.** No live calendar has been
read (needs the Cloud Console step + human consent) and no real CRM row inspected. What *is*
verified: **26 tests against the real compiled matcher**, covering all three tiers, tier
precedence, ambiguity-falls-through, empty CRM, internal-only meetings, and the wrong-match
regressions below.

**Two safety rules that are now enforced in code, not just advice:**
- **Consumer email domains are blocklisted on BOTH sides.** Without it, one `gmail.com`
  attendee domain-matches every org holding a Gmail contact. An org whose "website" is
  `gmail.com` is likewise never domain-matched. Shared hosts (`facebook.com`, `linktr.ee`,
  Wix/Squarespace…) are excluded too — for this client base a Facebook page is a common
  "website", and there the *path* identifies the org while we only compare hosts.
- **An email pasted into the website field yields no domain at all.** "Someone owns this
  mailbox" is not evidence "their org owns this domain", and no finite blocklist can cover
  every provider (the list has `aol.com` but not `aol.co.uk`).

**Still worth doing before trusting it:** sample real `Organization.website` /
`Contact.email` values. Both are optional, unvalidated, unnormalised free text. If websites
are mostly empty and contact emails mostly personal, only tier 3 + manual assignment will
actually fire, and the CRM should grow a normalised `domain` field (no migration needed —
jsonb).

### Findings from the adversarial review (12 confirmed, 3 refuted — all fixed)
The two that mattered were both in code added *beyond* what `RECON.md` specified:
- **Legal-suffix stripping** reduced "Vision Foundation" → `vision`, silently matching "Q3
  vision planning"; "Impact Co" → `impact` matched "Impact review with team". Removed — only
  full names match now, exactly as `RECON.md` § Step 5 said. The cost is that "Acme Corp" no
  longer catches "Acme sync"; that's the right trade, since tier 3 is the weakest signal and
  the guardrails prefer unmatched over wrong.
- **`normalizeDomain` derived a domain from a pasted email** (see above).

Also fixed: deterministic `uuidv5` meeting ids (the `event_id` UNIQUE constraint raced against
upsert-on-primary-key); a stored auto-match whose org was later deleted froze the event
forever; calendar reads now follow `nextPageToken` instead of dropping events past 250; the
OAuth state cookie is cleared with its issuing path; access tokens invalidated on disconnect
and reconnect; `meetings` added to the backup entity order.

---

## 5. What the `meetings` field/relation looks like, and any migration involved

**Built as a new CRM entity**, following the existing pattern exactly (per `RECON.md § Step 2`)
rather than extending `Activity`'s `kind: 'meeting'` — `activities` has no `organization_id`,
and meetings must attach to an org directly.

`Meeting` (`src/lib/meetings/types.ts`): `id`, `eventId`, `organizationId?`, `contactId?`,
`dealId?`, `startsAt`, `matchSource: 'auto' | 'manual'`, `matchSignal?`, `createdAt`,
`updatedAt`. Stores the event id, the start time, and auto-vs-manual — the three fields
`04-CRM-LINKING.md` Step 1 requires.

Wired the standard way, which is all that was needed to get the endpoints:
`EntityName`/`CRM_ENTITIES` (`storage/types.ts`) → `extractColumns` (`storage/server.ts`) →
validator (`storage/validate.ts`) → `/api/crm/meetings` served with **no new route code**.
Also added to `backup.ts`'s `ENTITY_ORDER` (after `deals`, since it FKs all three), with older
backups lacking the section still restoring.

**Design notes worth keeping:**
- `id` is a **deterministic uuidv5 of the event id** (`meetingIdForEvent`), not random.
  `event_id` is UNIQUE but `saveEntity` upserts on the primary key, so random ids made
  concurrent resolvers race to a `23505` unique violation. Same event → same row, always.
- A row with **no `organizationId` and `matchSource: 'manual'`** is a deliberate "this isn't a
  client meeting". The validator therefore does *not* require an org.
- Auto **misses are not persisted** — storing them would freeze the miss forever, so an event
  stays re-matchable once the org is finally added to the CRM.

**Migration:** `supabase/migrations/20260715180000_google_calendar_and_meetings.sql` — creates
`meetings` and `google_calendar_tokens`, both idempotent, RLS on with zero policies, plus the
mandatory `grant all … to service_role` / `revoke … from anon, authenticated` (without which
even the service-role key gets "permission denied"). `google_calendar_tokens.user_id` uses
`on delete cascade` — deliberately unlike the CRM's `on delete set null`, because a refresh
token outliving its user is a credential with no owner.

🚩 **The migration is NOT in the commit.** `supabase/` is gitignored (`.gitignore:43-44`), so it
exists on this machine only and will not survive a fresh clone — and the branch's code does not
work without it. Apply with `supabase db push`. This was flagged rather than overridden, because
un-ignoring `supabase/` would also sweep in three previously-excluded migrations. See
`BLOCKERS.md` for the recommended `.gitignore` change.

---

## 6. Confirmation the list and grid share one data-fetching/matching layer

**The shared layer exists and is the only path.** Neither view is built yet (both blocked on
BLOCKER 2), but the layer they must consume is in place and there is exactly one of it:

- **One** Calendar API call path: `listCalendarEvents()` in `src/lib/google/calendar.ts`.
  Nothing else fetches from Google.
- **One** matcher: `matchEvent()` in `src/lib/meetings/match.ts`.
- **One** resolve layer: `resolveMeetings(userId, from, to)` in `src/lib/meetings/resolve.ts`,
  exposed as **`GET /api/meetings?from=&to=`**. The date range is a **parameter** precisely so
  the 7-day list and the month grid differ only in what they pass — exactly what
  `06-CALENDAR-VIEW.md` asks for ("the shared layer should accept a date-range parameter
  rather than each view fetching independently").
- **One** manual override: `assignMeeting()`, exposed as **`POST /api/meetings/assign`**. Both
  views call it, and because both read the same persisted `meetings` rows, a reassignment in
  one is visible in the other on next render.

Whoever builds Phases 4–5: consume `/api/meetings`. Do not add a second Calendar call.

---

## 7. Known edge cases and gaps

Carried forward for whoever picks this up. The first four are the ones the spec asked about
directly:

- **Recurring events** — **handled.** `listCalendarEvents` requests `singleEvents=true`, so
  Google expands a series into instances each with its own event id, and the match is per
  instance. Rescheduling one occurrence cannot re-point the series. (`orderBy=startTime`
  requires `singleEvents` anyway.)
- **Meetings with no attendees** — signals 1 and 2 evaporate; only title-matching or manual
  assignment remain. Internal-only holds and focus blocks land here and **stay unmatched**,
  which is correct — verified by test.
- **Multiple plausible CRM matches** — auto-matches **only on a unique hit** at every tier,
  otherwise unmatched, per `00-GUARDRAILS.md`. Verified by test at each tier.
- **Week view** (`06-CALENDAR-VIEW.md` stretch item) — **not built**, along with the rest of the
  grid. Noted here rather than skipped silently, as that spec requires.
- **All-day events** — pass through; `startsAt` is a bare `YYYY-MM-DD`, which `isIsoTimestamp`
  accepts and `timestamptz` parses. Checked explicitly. They are flagged `isAllDay` so a view
  can render them differently.
- **Calendar scope** — only the user's **primary** calendar is read. Secondary/shared calendars
  are not, which may matter if client meetings live on a team calendar.
- **Access-token cache is process-local.** Disconnect clears it on the instance serving the
  request; on a multi-instance deploy another instance could hold a cached token until it
  expires (≤1h). The Google-side revoke is the real backstop, and it is best-effort.
- **Page cap** — `listCalendarEvents` follows `nextPageToken` up to 20 pages (5000 events per
  range). Beyond that it returns what it has rather than looping forever.
- **`/api/crm/meetings` is writable by any signed-in user**, like every other CRM entity — the
  generic route's validator is the only gate. Consistent with the existing CRM (this is a
  shared team tool, not per-user data), but worth knowing it bypasses `/api/meetings/assign`'s
  narrower checks.

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

**BLOCKER 1 — Google Calendar OAuth did not exist. ✅ RESOLVED on this branch.**
`01-CONTEXT.md` listed NextAuth + Google provider + `calendar.events.readonly` +
refresh-token persistence + session `accessToken` as already built. Four independent searches —
three of them adversarial agents told to assume it existed and find it — turned up nothing
across 40 branches and ~400 commits. `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` exist in
`.env.local` exactly as `00-GUARDRAILS.md:34` says, but **no code read them** — provisioned,
never wired. That is almost certainly why the spec's author believed it was done.
→ Tyrone authorised building it here and chose **authorization-not-authentication**: sign-in
stays Supabase email/password; Google is a separate, revocable, read-only grant. Supabase's
`signInWithOAuth` was rejected because it doesn't persist or refresh provider tokens anyway,
and it would couple calendar access to sign-in.
→ **Remaining:** the Cloud Console redirect URI, the `db push`, and one human consent
round trip. Until those, the flow is unexercised against live Google.

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

**Recommended sequencing from here:**
1. **Console + `db push` + one consent round trip** — confirms the calendar actually reads, and
   completes Phase 3's gate on real data.
2. **Document-persistence task** — closes BLOCKER 2.
3. **Phases 4–6** as written, consuming `/api/meetings`.

**Flagged for a human call, not blocking:**
- **`supabase/` gitignored** — now urgent rather than theoretical: Phase 3's migration lives
  only on this machine. Recommended `.gitignore` fix in `BLOCKERS.md`.
- **No success/warning theme token** — dodged for now (the connection card needed only the
  established `--bf-color-cyan-soft` success tone and a neutral pill), but Phase 4's
  "Needs prep" badge still has no suitable token.
- **CRM records aren't deep-linkable** — Phase 6 needs it.
