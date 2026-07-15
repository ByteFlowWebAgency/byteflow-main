# Blockers

Three prerequisite gaps. **Every one is a case where `01-CONTEXT.md` describes something as
already done and the reality says otherwise** — worth remembering before trusting any other
claim in that document.

| | Status |
|---|---|
| **BLOCKER 1** — Google Calendar OAuth was never built | ✅ **RESOLVED** — built on this branch (`3844433`) after Tyrone authorised it. Migration applied; consent round trip confirmed working. |
| **BLOCKER 2** — documents have no CRM linkage | ⛔ **OPEN** — still blocks Phases 4–6. |
| **BLOCKER 3** — the OAuth scope cleanup never happened | ⚠️ **OPEN** (console task) — 13 scopes incl. full delete are still configured. Code now refuses over-broad tokens, so this is not blocking. |

Phases 1, 2 and 3 are complete. Phases 4–6 remain blocked on BLOCKER 2.

---

## Status of the manual steps

- ✅ **Redirect URI registered** — confirmed working: a real consent round trip on
  2026-07-15 returned to `/api/google/callback` with a code and
  `scope=email calendar.events.readonly userinfo.email openid`.
- ✅ **Migration applied** — `20260715180000_google_calendar_and_meetings.sql` pushed to the
  live project over the `aws-1-us-east-2` session pooler (the direct `db.<ref>` host is
  IPv6-only and unreachable from WSL). Verified: `service_role` reads both new tables;
  `anon` gets `42501 insufficient_privilege` on both, so RLS + REVOKE are doing their job.
- ⚠️ **Trim the OAuth consent screen's scopes** — see BLOCKER 3 below. Not required for the
  connection to work (the code now refuses over-broad tokens), but it should be done.

---

## BLOCKER 3 — the OAuth scope cleanup never happened either ⚠️ OPEN (console task)

`01-CONTEXT.md` claims:

> **OAuth scope cleanup** — the Google Cloud Console project's Data Access page has been
> trimmed to only the scopes actually needed (`openid`, `userinfo.email`,
> `calendar.events.readonly`). This was a manual console task, not code.

**It has not been.** A screenshot of the Data Access page (2026-07-15) shows **13 scopes**,
including:

| Scope | Google's own description |
|---|---|
| `.../auth/calendar` | "See, **edit**, share, and **permanently delete** all the calendars you can access" |
| `.../auth/calendar.acls` | "See and **change the sharing permissions** of Google calendars you own" |
| `.../auth/calendar.events` | "**View and edit** events on all your calendars" |
| `.../auth/calendar.events.owned` | "See, **create, change, and delete** events on Google calendars you own" |
| `.../auth/calendar.calendars` | "See and change the properties of Google calendars… and **create** secondary calendars" |
| `.../auth/service.management` | "**Manage** your Google API service configuration" |

…plus `calendar.readonly`, `calendar.calendarlist`, and four `.readonly` variants.

This is the **third** premise in the package to turn out false, after the OAuth integration
itself (BLOCKER 1) and the document↔CRM linkage (BLOCKER 2).

**Why it mattered to the code, not just the console.** The grant observed in the real round
trip was clean (read-only), but the config made two of this branch's original choices unsafe,
both now fixed in `c2eff6c`:
1. `buildConsentUrl` set `include_granted_scopes=true` — incremental authorization, where the
   minted token inherits **every scope the user previously granted this client**. That bounds
   the token's authority by the *consent screen's config* rather than by what we request. With
   `.../auth/calendar` available there, a user who had once granted it would have handed this
   read-only integration a calendar-destroying token. Removed; it bought nothing.
2. The callback verified `calendar.events.readonly` was **present**, not that nothing else
   was — so a token holding read-only *and* full-delete passed. It now checks the granted set
   against an **allowlist** and refuses the grant outright (`?calendar=scope-too-broad`)
   rather than storing a write-capable credential. An allowlist, not a denylist: the console
   config can change without warning, and the failure mode of guessing wrong must be "refuse".

**Recommended (console, ~2 min):** on the Data Access page, delete every scope except
`openid`, `.../auth/userinfo.email`, and `.../auth/calendar.events.readonly` — i.e. actually
do the cleanup `01-CONTEXT.md` describes.

⚠️ **Check first** whether anything else in that Google Cloud project uses the same consent
screen. Scopes there are per-project, so removing them affects every OAuth client in it, not
just this one. If the project is dedicated to byteflow.us, trimming is safe.

Two further reasons to do it: `.../auth/calendar` is a Google **restricted scope**, which
drags in verification requirements for external users; and a consent screen that *asks* for
"permanently delete all your calendars" is a bad look for a tool whose entire pitch is that it
only reads.

---

## BLOCKER 1 — Google Calendar OAuth did not exist ✅ RESOLVED

> **Resolution (2026-07-15).** Tyrone authorised building it, and chose the
> connect-as-authorization design over the spec's NextAuth. Built in `3844433`; the
> original finding is preserved below because it explains *why the spec was wrong* and what
> the credentials in `.env.local` actually were. See § "How BLOCKER 1 was resolved" at the
> end of this section.

**`01-CONTEXT.md` claims** (under "What's already done (prerequisites)"):

> **Google Calendar OAuth** — NextAuth wired up with a Google provider,
> `calendar.events.readonly` scope, refresh-token persistence, session exposes
> `accessToken`. Built via `GOOGLE-CALENDAR-OAUTH-PROMPT.md`.

**Reality: none of this exists.** Not in the working tree, not on any branch, not in
history.

Verified absent by four independent searches (one primary + three adversarial agents
tasked specifically with *finding* the implementation and assuming it existed):

| Claimed | Actual |
|---|---|
| NextAuth wired up | `next-auth` is not a dependency — `package.json:12-24` lists only `@sendgrid/mail`, `@supabase/ssr`, `@supabase/supabase-js`, `contentful`, `html2canvas`, `jspdf`, `next`, `pptxgenjs`, `react`, `react-dom`. Zero hits in `package-lock.json`. No `/api/auth/**`, no `[...nextauth]`. |
| Google provider | No `googleapis`, no `google-auth-library`, on **any** of the 40 local+remote branches (checked `git show "$b:package.json"` per branch). No `[auth.external.google]` block in `supabase/config.toml` either — `:319-321` only lists `google` in a stock commented-out enumeration. |
| `calendar.events.readonly` scope | No scope string anywhere. Searching all commits reachable from every ref (`git grep -il … $(git rev-list --all)`) produced exactly **one** hit across ~400 commits: `58e0784f:src/app/globals.css:6` — a false positive matching `googleapis` inside `@import url('https://fonts.googleapis.com/css2?…')`, i.e. a webfont import. |
| Refresh-token persistence | No oauth/token/provider/session table in any of the three migrations. |
| Session exposes `accessToken` | `getCurrentInternalUser()` (`src/lib/internal-tools/auth/server.ts:40-47`) returns the Supabase `user` object, not a session. No access token is read, stored, or surfaced to any caller. |
| Built via `GOOGLE-CALENDAR-OAUTH-PROMPT.md` | That file does not exist on disk anywhere under `~/Git`, and appears in no commit in `git log --all --name-only`. Same for `GOOGLE-CALENDAR-SCOPES-CLEANUP.md`. |

**What internal auth actually is:** Supabase Auth with per-user email/password. No OAuth of
any kind, no identity provider, no third-party token.
- Gate: `src/middleware.ts:59-61` matches `/internal/:path*`; `:25-42` builds a
  `createServerClient` from `@supabase/ssr` and calls `supabase.auth.getUser()`, which
  verifies server-side and refreshes near expiry. Fails closed (`:18-24`, `:42`) → redirect
  to `/internal/login` (`:53-55`).
- Sign-in: `src/app/api/internal-login/route.ts:35` → `supabase.auth.signInWithPassword()`.
- Sign-up is domain-restricted to `@byteflowsolutions.com` at the app layer
  (`src/lib/internal-tools/auth/env.ts:18-22`) **and** at the DB layer via a SECURITY DEFINER
  trigger on `auth.users` (`supabase/migrations/20260713190000_supabase_auth_internal.sql:1-40`).

**Why the prerequisite probably looked done:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
and `GOOGLE_PROJECT_ID` **do** exist as names in `.env.local` — exactly as
`00-GUARDRAILS.md:34` asserts. But they are **dead**: no source file reads them. A repo-wide
grep for `GOOGLE_` outside `.env*` returns only `src/app/api/contact/route.ts:31`
(`GOOGLE_SHEET_WEBHOOK_URL` — the marketing contact form's Sheets webhook, unrelated),
its docs in `README.md:50` / `.env.example:22`, and `00-GUARDRAILS.md:34` itself.
Credentials were provisioned in a Google Cloud project; **no code was ever written against
them.**

### How BLOCKER 1 was resolved

The original recommendation was to run the separate OAuth task. Tyrone instead authorised
building it here, and picked the design after being shown the trade-off.

**Chosen: Google Calendar access is an *authorization* grant, not a sign-in.** The spec's
NextAuth design was written believing the integration already existed, and by an author who
didn't know the repo had moved to Supabase Auth — adding NextAuth would have put two session
systems on the same `/internal` routes. Nobody needs to sign in with Google; they already
sign in with email/password and separately grant read access to a calendar.

What that means concretely:
- **Sign-in is completely untouched.** Supabase Auth email/password, as before.
- A signed-in user hits `/api/google/connect` → Google consent → `/api/google/callback`.
- The refresh token is stored in `google_calendar_tokens` (RLS on, zero policies,
  `service_role` GRANT only). It is **deliberately not an `EntityStore` entity**, so the
  generic `/api/crm/<entity>` route cannot reach it — verified: it 404s.
- Access tokens are minted on demand from the refresh token and cached in process memory.
- Scope is **`calendar.events.readonly` only**, per `00-GUARDRAILS.md`. A test asserts the
  consent URL carries no write-capable scope and that the client secret never appears in it.
- Disconnect revokes the grant at Google and drops both the stored token and the cached one.

Rejected alternative: Supabase's own `signInWithOAuth`. It returns `provider_token` /
`provider_refresh_token` **only at sign-in and does not persist or refresh them** — so the
refresh plumbing would have been hand-rolled anyway, while additionally coupling calendar
access to how people sign in.

**Still true and worth remembering:** `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` were
provisioned long before any code used them. That is almost certainly why the spec's author
believed the integration was built. `src/lib/google/env.ts` is the first consumer.

---

## BLOCKER 2 — Documents have no CRM linkage and live only in localStorage (blocks the document-status core of Phases 4–6)

This one is independent of Blocker 1. **Even if Calendar OAuth existed tomorrow, the
"Ready" vs "Needs prep" badge — the entire point of the feature per `01-CONTEXT.md`'s
"the underlying why" — could not be built against today's data model.**

`01-CONTEXT.md` frames this as merely unknown-shaped:

> **The Document Builder's** client-tagging convention — how a generated proposal/audit
> currently gets linked to "this is for Client X."

`03-RECON.md` Step 3 then asks whether "does this client have a document generated" is
queryable today. **Answer: there is no client-tagging convention. It does not exist.**

- **Documents are localStorage-only.** Key `bf-docs:<uuid>`, one per document
  (`src/lib/document-builder/storage.ts:23`). The only write path is
  `window.localStorage.setItem(…)` (`:306`); `listDocs()` enumerates `window.localStorage`
  (`:271-287`). The module is `'use client'` (`:9`). There is **no documents table** in any
  migration and **no `/api/documents` route** of any kind.
- **No CRM link field exists.** The complete persisted shape
  (`src/lib/document-builder/types.ts:162-174`) is `id`, `name`, `createdAt`, `updatedAt`,
  `themeId`, `pages`, `templateId?`. No `organizationId`, no `contactId`, no `dealId`, no
  tag. A grep for `clientId|organizationId|dealId|contactId|crm` across the whole
  document-builder tree returns **zero matches**. Worse, the save validator constructs a
  fresh object with exactly those seven fields (`storage.ts:256-266`) — **any extra field
  attached to a document is silently discarded on save.**
- **The only client association is free text on a cover page**: `CoverFields.clientName?`
  (`types.ts:135-140`), hand-typed (`EditorCanvas.tsx:142-144`), defaulting to the literal
  placeholder `'[Client name]'` (`defaults.ts:89`) and frequently left unedited.
- **Consequences:** a server-rendered badge is impossible — the server has no table to
  query, and `listDocs()` physically cannot run server-side (`storage.ts:41-47` returns
  `false` when `typeof window === 'undefined'`). A *client*-side badge would also be wrong,
  since matching would be free-text `clientName` vs `organizations.name`. And documents are
  **per-browser, per-device**: a document built on a laptop is invisible on a phone, in
  another browser, and to every other internal user. Clearing site data destroys them.

**What closing this actually requires** (none of it specified in this package): a
`documents` table, an `organization_id` FK to `organizations`, an API route, a validator, a
`documentId`/`organizationId` seam in the builder's creation flow — **plus a migration path
for whatever already sits in team members' localStorage**. That last part is the risky bit,
and per `00-GUARDRAILS.md` ("Never delete or overwrite existing CRM or document data") it
needs a deliberate plan, not a best-effort import.

**Recommended next step:** treat "persist documents server-side and link them to a CRM
record" as its own scoped task, sequenced *before* Phases 4–6. It is a prerequisite for the
document-status feature in the same way OAuth is a prerequisite for the calendar feature.

---

## Not blockers, but flagged for a human call

### Theme system has no success/warning status tokens
Phase 1 (`02-DASHBOARD-CLEANUP.md` Step 3) says to flag real token gaps rather than solve
them unilaterally, and this is one. The only semantic colour token is `--bf-color-error`
(`tokens.css:130` dark / `:188` light). There is **no** `--bf-color-success`, `-warning`, or
`-info`.

The de-facto convention the codebase settled on (`BudgetsApp.module.css:326-336`) is
`--bf-color-cyan-soft` for success, **hardcoded `#fbbf24`** for warning, `--bf-color-error`
for danger. For the eventual "Ready"/"Needs prep" badge: "Ready" has a usable existing token
(`--bf-color-cyan-soft`, flips correctly), but **"Needs prep" has no suitable token** — the
only amber precedent is a literal that does not flip and is a contrast failure on the light
chrome. Adding a proper flipping token pair would mean touching the brand palette, which the
guardrails forbid without a decision. **Escalating rather than hardcoding.**

This did not affect Phase 1 (no badge was needed once the placeholders were removed), but it
will need answering before Phase 4.

### 🚩 `supabase/` is gitignored — and Phase 3 has now written a migration into it
`.gitignore:43-44` excludes `supabase/` ("config + migrations stay out of the repo"). That
is now a live problem rather than a hypothetical:

**`supabase/migrations/20260715180000_google_calendar_and_meetings.sql` exists on this
machine only.** It is not in the commit, it will not travel with the branch, and it will not
survive a fresh clone. The branch's code does not work without it (both new tables live
there). The same is true of the three pre-existing migrations.

This was deliberately **not** overridden: force-adding it, or negating the ignore rule, would
also sweep in three migrations that were previously excluded on purpose, and that is a
repo-policy change rather than a Phase 3 change.

**Recommendation:** track migrations but keep local config out —
```gitignore
supabase/
!supabase/migrations/
!supabase/migrations/*.sql
```
Migrations are schema, contain no secrets, and belong in version control; `config.toml` and
local state don't. Until then, the file must be applied by hand with `supabase db push` and
backed up outside git.

### CRM records are not deep-linkable
`07-MISSING-DOCUMENT-FLOW.md` Step 2 needs to "link directly to that record's edit view."
There is no such URL today: `/internal/crm` is the only CRM route, and the detail view is
React state inside one client component (`src/components/crm/CrmApp.tsx:26-30`, `:35`), which
never reads or writes the URL (`grep` for `useSearchParams|useRouter|usePathname` in
`src/components/crm/` returns nothing). Deep-linking is a small, contained addition
(query-param sync in `CrmApp`), but it is net-new work the spec assumes already exists.

### Pre-existing hydration warning in light chrome
Observed while screenshotting Phase 1, **not caused by it**: the layout's pre-paint chrome
script (`src/app/internal/(protected)/layout.tsx:35-40`) sets `data-bf-chrome="light"` on
`<html>` before hydration, which React flags as a hydration mismatch in dev. Dev-only, and
it predates this branch — noted so it isn't misread as Phase 1 fallout.
