# RECON — ByteFlow `/internal` dashboard, CRM, documents, theme

Phase 2 output (`03-RECON.md`). Everything here was read out of the code on branch
`feat/internal-dashboard-meetings` (based on `dev`, at `1c9d592`). Where something could not
be determined from source it says so rather than guessing.

**Headline: two of this package's stated prerequisites did not exist.** Google Calendar OAuth
was never built, and documents have no CRM linkage of any kind. Both are written up in
[`BLOCKERS.md`](./BLOCKERS.md); the summaries below cross-reference it rather than repeat it.

> **Update (2026-07-15, after this document was written).** Tyrone authorised closing the
> OAuth gap, so it was built on this branch (`3844433`) as an *authorization* grant rather
> than the spec's NextAuth sign-in — see `BLOCKERS.md § How BLOCKER 1 was resolved`. Phase 3
> is consequently built too. **Step 5's proposal below is now implemented** (with two
> corrections an adversarial review forced — noted inline). The document-linkage gap
> (Step 3) is still open and still blocks Phases 4–6.

---

## Step 1 — Calendar OAuth prerequisite: **WAS NOT IN PLACE.** *(since resolved — see update above)*

`01-CONTEXT.md` lists NextAuth + Google provider + `calendar.events.readonly` +
refresh-token persistence + session `accessToken` as already built. None of it exists — no
`next-auth` dependency, no `googleapis`, no `/api/auth` route, no scope string, no token
table, on any of 40 branches or in ~400 commits of history. Internal auth is Supabase Auth
(email/password, `@byteflowsolutions.com`-restricted).

`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` do exist in `.env.local` but are **read by no
code** — provisioned credentials, never wired up. That is the most likely source of the
misunderstanding.

Full evidence, including the adversarial verification, in **[BLOCKERS.md § BLOCKER 1](./BLOCKERS.md)**.

Per `03-RECON.md` Step 1 and the master prompt, this is a stop condition for Phases 3–6, and
building the OAuth flow here was explicitly out of scope. **Not attempted.**

---

## Step 2 — The CRM

### Where records live
Supabase, one table per entity, in `supabase/migrations/20260713123007_initial_crm_budget_schema.sql`.

⚠️ `supabase/` is **gitignored** (`.gitignore:43-44`) — the migrations are on disk but not
tracked in git.

The architectural pattern (`migration:7-10`) is: **the full entity JSON lives in `data
jsonb`**; a few columns are extracted purely for indexing/sorting. Reads return only `data`
(`storage/server.ts:109-116`, `:118-129`) — the extracted columns are never read back into
the app.

```sql
create table if not exists organizations (   -- :12-18
  id uuid primary key,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null
);
```

RLS is enabled with **zero policies** (`migration:71-75`), plus `grant all … to service_role`
and `revoke all … from anon, authenticated` (`:87-89`). Only the service-role key
(server-side only) can touch these tables. **The GRANT is not optional** — `migration:82-86`
documents that without it even the service-role key gets "permission denied", because
RLS-bypass does not bypass SQL GRANTs.

### Fields on a client/org record — the complete set
`src/lib/crm/types.ts:12-19`:

```ts
export interface Organization {
  id: string;
  name: string;
  website?: string;
  orgType?: string;   // free text: "nonprofit", "barbershop", "CDC", etc.
  notes?: string;
  createdAt: string;
}
```

Six fields. Only `id` (uuid), `name` (non-empty), and `createdAt` (ISO) are enforced —
`validate.ts:56-61`. `website`, `orgType`, and `notes` are **never validated**.

Against what `03-RECON.md` Step 2 asked to look for:
- organization name → ✅ `name` (required)
- key contact name/email → ❌ **not on Organization at all.** There is no `primaryContactId`.
  A key contact must be derived — either via `organizationReferences(data, orgId).contacts`
  (`src/lib/crm/references.ts:34-42`, returns *all* contacts at the org, unranked) or via a
  **Deal**, which does have `primaryContactId` (`types.ts:50`). Deal is the entity that names
  a single key contact, not Organization.
- status/stage → ❌ not on Organization. Stage lives on **Deal** (`DealStage`, `types.ts:37-44`:
  `lead | conversation | audit-sent | proposal-sent | negotiation | won | lost`).
- notes / last contact → ✅ `notes` (free text). No `lastContact` field; the closest is the
  `activities` table's `at timestamptz`, indexed `desc`.

### The other entities and how they relate
Entities: `organizations | contacts | deals | activities` (+ `budgets`, which is **not** a CRM
entity — `storage/types.ts:6-20`, routed separately).

```
organizations 1──∞ contacts     contacts.organization_id    → organizations.id  (optional)
organizations 1──∞ deals        deals.organization_id       → organizations.id  (optional)
contacts      1──∞ deals        deals.primary_contact_id    → contacts.id       (optional)
deals         1──∞ activities   activities.deal_id          → deals.id          (optional)
contacts      1──∞ activities   activities.contact_id       → contacts.id       (optional)
contacts      1──∞ contacts     contacts.referredByContactId → contacts.id      (JSON only, no column/FK)
```

Every FK is `on delete set null` — no cascades (`migration:77-80`).

`Contact` (`types.ts:21-35`): `id`, `name`, `email?`, `phone?`, `role?`, `organizationId?`,
`source`, `referredByContactId?`, `notes?`, `createdAt`.

**Relevant find:** `ActivityKind` (`types.ts:64`) **already includes `'meeting'`**, labelled
"Meeting" (`labels.ts:41`), and `activities` has an indexed `at timestamptz`. `activities` is
the closest structural precedent for a `meetings` relation — same optional-dual-FK shape, same
time column. Caveat: `activities` has **no `organization_id`**, which matters if meetings must
attach to an org directly.

### Existing relations to anything calendar-like, or to documents
- **Calendar: nothing.** No `meetings` table, no `calendar_events` table, no Google API route.
- **Documents: nothing.** There is no relation from a client record to documents, and
  documents are not in the database at all. See Step 3.

`03-RECON.md` anticipated that an existing `documents` relation would be "the pattern to
follow" for a new `meetings` relation. **That pattern does not exist.** The pattern to follow
is instead the `activities`/`budgets` one (Supabase table + `EntityStore` + API route),
recipe below.

### Is there a UI for viewing/editing a CRM record? What route?
`/internal/crm` — and **that is the only CRM URL. Deep-linking to a record is impossible today.**

- No `/internal/crm/[id]`: `find src/app/internal/(protected)/crm -type f` → only `page.tsx`.
- The detail view is React state inside one client component (`src/components/crm/CrmApp.tsx:26-30`):
  `type Detail = {kind:'deal'|'contact'|'organization'; id:string} | null`, `useState<Detail>(null)`
  (`:35`), rendered by a ternary chain (`:89-113`) that swaps `OrganizationDetail` etc. in place
  of the tab list.
- The CRM **never reads or writes the URL**: `grep -rn "useSearchParams|useRouter|usePathname|next/navigation" src/components/crm/` → nothing.
- The org edit form is `OrganizationDetail`, a named export from `OrganizationsView.tsx:239-247`
  — an inline edit form (draft state `:250-252`, `persist()` → `saveOrganization(draft)` `:277-289`).

**This matters for `07-MISSING-DOCUMENT-FLOW.md`**, which needs to "link directly to that
record's edit view." That link has nowhere to point yet. Lowest-risk fix: keep `/internal/crm`
and add query-param sync in `CrmApp` (`?organization=<uuid>`) — the `Detail` union maps 1:1 to
`?kind=…&id=…`, so the state model already supports it. Noted in `BLOCKERS.md`.

### Recipe to add a new entity (for a future `meetings` relation)
**Big shortcut first:** because the whole entity lives in `data jsonb`, **adding a *field* to
an existing entity needs no migration at all** (`migration:7-9`). Only a **new table** does.

For a new `meetings` entity, 7 steps:
1. **Migration** in `supabase/migrations/<UTC>_<name>.sql`, idempotent (`create table if not
   exists`), copying the `activities` shape. **Must** include `enable row level security` +
   `grant all … to service_role` + `revoke all … from anon, authenticated`. Applied with
   `supabase db push` — the migration headers explicitly say *not* to paste into the dashboard
   SQL editor.
2. **TS type** in `src/lib/crm/types.ts`.
3. **Register the name** in `storage/types.ts:6-11` (`EntityName` union) and `CRM_ENTITIES`
   (`:13-18`).
4. **Extraction map** in `storage/server.ts:70-93` (camelCase → snake_case). Helpers exist:
   `uuidOrNull` (`:54-56`), `stringOrNull`, `timestampOr`. TypeScript **forces** this step once
   the union is extended.
5. **Validator** in `storage/validate.ts` — also a `Record<EntityName, …>`, so also type-forced.
   See `activities` (`:101-113`) for the at-least-one-FK idiom.
6. **API route** — if it's a CRM entity, `/api/crm/[entity]` **already serves it with zero new
   code** (`route.ts:20-36` gates on `isCrmEntity`). Adding the name in step 3 is literally all
   that's needed. Never write auth/Supabase code in the route: `apiHandlers.gate()` (`:28-41`)
   does session→config→validation→query in that order.
7. **Client** via the `EntityStore<T>` adapter — components only ever see `EntityStore<T>`
   (`storage/types.ts:1-4`); only the server module touches Supabase.

---

## Step 3 — How documents get tied to a client: **they don't.**

**There is no client-tagging convention.** Documents live only in browser localStorage
(`bf-docs:<uuid>`, `src/lib/document-builder/storage.ts:23`), have **no** `organizationId`/
`clientId`/`dealId` field (`types.ts:162-174`), and any extra field attached to one is
**silently discarded on save** (`storage.ts:256-266`). The only client association is free-text
`CoverFields.clientName?` defaulting to the literal `'[Client name]'`.

**"Does this client have a document generated?" is not answerable today** — not server-side
(no table, and `listDocs()` cannot run without `window`), and not reliably client-side either
(it would be a free-text comparison against a placeholder-defaulted field). Documents are also
per-browser and per-device.

This is a second hard prerequisite gap, independent of the OAuth one, and it blocks the
document-status core of Phases 4–6. Full detail and what closing it requires:
**[BLOCKERS.md § BLOCKER 2](./BLOCKERS.md)**.

Two smaller notes for whoever builds this:
- `createCoverPage(fields?: Partial<CoverFields>)` (`defaults.ts:81-94`) **already accepts a
  partial and spreads it** (`:91`) — so `clientName` pre-fill has a natural seam. No caller
  passes anything today.
- There is **no `type`/`kind` discriminator** on a document — a "proposal" and an "audit" are
  the same runtime type, distinguished only by the template they started from
  (`templateId?`, which the type itself calls "informational"). So "the right document for this
  meeting" has no field to key off yet either.
- There is no `/internal/documents/new` route, and neither documents route reads
  `searchParams` — so `?clientId=…` deep-linking into creation does not work today.

---

## Step 4 — The theme system

**Where the tokens live:** `src/components/internal-tools/tokens.css`, scoped to `.bfScope`
(set on the shell root in `internal/(protected)/layout.tsx:32`) so nothing leaks into the
marketing site. Styling convention is **CSS Modules** (`*.module.css`) referencing `var(--bf-*)`
— never raw values.

**Two distinct token sets — do not conflate them:**
- **App chrome** (the dashboard UI itself): `--bf-color-bg`, `-bg-2`, `-fg`, `-fg-muted`,
  `-fg-soft`, `-fg-dim`, `-line`, `-line-strong`, `-glass`, `-glass-solid` (`tokens.css:110-121`);
  accents `--bf-color-accent`, `-accent-soft`, `-violet`, `-violet-soft`, `-cyan`, `-cyan-soft`,
  `-error` (`:124-130`); gradients `--bf-grad-primary`, `-grad-text` (`:133-134`); fonts
  `--bf-font-display|body|mono` (`:146-148`); focus `--bf-focus-ring`, `-focus-offset` (`:151-152`);
  radii `--bf-radius-sm|md|lg` = 8/12/16px (`:155-157`).
- **Paper/document** (`--bf-paper-*`, `:137-143`) — for generated documents only. `ThemedDocument`
  pins these inline, which always beats the cascade. **The dashboard must not use these.**

**Light/dark chrome:** default is dark ink; `html[data-bf-chrome='light']` flips the *chrome*
variables (`tokens.css:169-194`). Toggled from the hub, persisted as localStorage
`bf-app-dark-mode`, restored pre-paint by a script in the layout. **Any new dashboard section
must be built from the flipping tokens above and verified in both modes** — several existing
components (e.g. `CrmApp.module.css:370-388` `.overdueFlag`/`.staleFlag`, `chooser.module.css:171-179`)
hardcode colours and break in light mode. Don't copy those.

**Status/semantic tokens: the set is incomplete.** Only `--bf-color-error` exists. No success,
warning, or info token. See `BLOCKERS.md § Not blockers, but flagged` — this needs a decision
before Phase 4's "Ready"/"Needs prep" badge.

**Badge/pill component:** there is **no shared `Badge`/`Pill`/`Chip` component**. The best
template is `HubTile.module.css`'s former `.badge` rule (fully tokenized, flips correctly) —
though as of Phase 1 that rule is removed along with the coming-soon tiles that used it (it's
in git history at `20d358f^`). `InternalShell.module.css:55-64` `.brandTag` is a near-identical,
still-live recipe. A future badge should be extracted as a shared component rather than
copy-pasted a fifth time.

---

## Step 5 — Proposed matching strategy (calendar event → CRM record)

Stated against what recon actually found.

> **Status: IMPLEMENTED** in `src/lib/meetings/match.ts` (`3844433`), with two corrections an
> adversarial review forced — both marked **[CORRECTED]** below. Accuracy on real data is still
> unmeasured: no live calendar has been read.

`03-RECON.md` offered three candidate signals. Assessed honestly:

### 1. Attendee email domain vs. a stored client domain — ⚠️ viable but weak, and *not* the primary signal
There is **no `domain` field anywhere in the CRM.** The nearest thing is
`Organization.website?` (`types.ts:15`), which is:
- **unvalidated free text** — `validate.ts:56-61` checks only `name` and `createdAt`; `website`
  is never checked for URL shape or presence;
- **unnormalized on write** — `OrganizationsView.tsx:144` stores `website.trim() || undefined`.
  The input is `type="text"` with an `example.org` placeholder, so stored values may be
  `example.org`, `https://www.example.org/`, `www.example.org`, or junk;
- **optional** — so coverage is partial by construction;
- **jsonb-only, unindexed** — not in the extraction map (`server.ts:71` extracts `name` only).

Any matcher must normalize on read (strip scheme, `www.`, path; lowercase).

> **[CORRECTED]** An early implementation also accepted an **email** pasted into the website
> field (taking the part after the `@`). That was a wrong-match vector: `jane@aol.co.uk` made
> every `aol.co.uk` attendee match Jane's Barbershop, and the consumer blocklist is finite so
> it cannot cover every provider (it has `aol.com`, not `aol.co.uk`). `normalizeDomain` now
> returns **null** for anything email-shaped — "someone owns this mailbox" is not evidence
> "their org owns this domain". Consumer domains and **shared hosts** (`facebook.com`,
> `linktr.ee`, Wix/Squarespace — a Facebook page is a very common "website" for this client
> base, and there the *path* identifies the org while we compare only hosts) are also
> excluded on the **org** side, not just the attendee's.

### 2. Organization name fuzzy-matched against the event title — ⚠️ viable as a fallback only
`Organization.name` is the one guaranteed-present field. Normalizing both sides (lowercase,
strip punctuation) and substring-matching is cheap. But it's noisy — short or generic org names
will false-positive against unrelated titles. Per `00-GUARDRAILS.md`, an ambiguous match must be
left unmatched rather than guessed.

> **[CORRECTED]** Only the **full** normalised name is matched, with word-boundary padding and
> a ≥4-character floor. An early implementation also retried with legal suffixes stripped, so
> "Acme Corp" would catch "Acme sync" — but the same path reduced "Vision Foundation" to
> `vision` (matching "Q3 vision planning") and "Impact Co" to `impact` (matching "Impact
> review with team"), silently persisting the wrong client. Stripping converts a
> high-specificity needle into a low-specificity one; the length floor can't help, because the
> remainder is a full-length common English word. Removed. Tier 3 is the weakest signal we
> have, and unmatched beats wrong.

### 3. Manual only — always required as the backstop
Non-negotiable regardless of the above, per the guardrails' "good enough, with an easy manual
override."

### Recommendation: **exact contact email first, then org website domain, then title, else unmatched**

The strongest signal is one `03-RECON.md` didn't list: **`Contact.email` exact match**
(`types.ts:24`), then hop `contact.organizationId` → organization. An exact email beats every
domain heuristic and reuses an existing FK. It is optional and unvalidated too
(`ContactDetail.tsx:117` doesn't even `.trim()` on the edit path), so coverage is partial — but
when it hits, it's right.

Proposed ordered resolution for each event:
1. **Exact attendee email → `Contact.email`** (normalized: lowercase + trim) → `organizationId`.
   High confidence. Auto-match.
2. **Attendee email domain → normalized `Organization.website` domain.** Medium confidence.
   Auto-match **only if exactly one org matches** — two or more → leave unmatched.
3. **Normalized org name ⊂ normalized event title.** Low confidence. Auto-match **only on a
   unique hit**, and only above a sane length floor (a 3-letter org name should not match).
4. **Otherwise: unmatched**, surfaced with the inline quick-assign control.

**🚩 Mandatory safety rule for signals 1–2: blocklist consumer email domains**
(`gmail.com`, `outlook.com`, `yahoo.com`, `hotmail.com`, `icloud.com`, …). This is not
hypothetical: if any contact is stored with a personal address — likely for a client base of
barbershops, nonprofits, and CDCs (`orgType` examples, `types.ts:16`) — then **one `gmail.com`
attendee would domain-match every org that has a Gmail contact**, silently assigning meetings to
the wrong client. That is precisely the failure `00-GUARDRAILS.md` calls "worse than no match."
Domain matching must apply to corporate domains only.

**Where the matching should run:** in memory over the already-loaded `CrmData`. `CrmContext`
already loads all four entity lists client-side once per session (`CrmContext.tsx:77-87`), and
`listEntities` pulls every row anyway (`server.ts:109-116`). The dataset is small; no SQL or new
index is warranted.

**Honest caveat:** signals 1 and 2 both depend on data quality nobody has measured. Before
building the matcher, sample the real `organizations.data->>'website'` and
`contacts.data->>'email'` values to see whether they hold bare domains, full URLs, personal
addresses, or nothing. If `website` is mostly empty and contact emails are mostly personal, then
the honest answer is that **only signal 3 + manual assignment are viable**, and the CRM should
grow a proper normalized `domain` field first — which, per the jsonb design, needs **no
migration**, just a type change and a form field.

---

## Phase 1 audit results (`02-DASHBOARD-CLEANUP.md` Step 1)

All nine hub tiles were classified, and every deletion candidate was independently
re-verified by a second agent tasked with *refuting* the placeholder verdict.

### Removed — confirmed non-functional placeholders (3)
| Tile | Evidence |
|---|---|
| Monthly Reports | `page.tsx:75-80` — `status="coming-soon"`, **no `href` prop at all** |
| Contracts | `page.tsx:81-86` — same |
| Draft Emails | `page.tsx:87-92` — same |

All three rendered through `HubTile.tsx:41`'s fallback branch as an inert `<div class="tileDisabled">`
(opacity 0.45) with a literal "Coming soon" badge (`:27`). **No route, component, or logic
existed behind any of them** — `find src/app/internal -type d` yields only `backgrounds`,
`budgets`, `crm`, `documents`, `documents/[id]`, `slides`, `slides/[id]`, `theme-editor`,
`login`, `signup`. So there was nothing to remove alongside the tiles. Verified gone from the
rendered DOM.

### Kept — confirmed working (6)
CRM, Budgets, Documents, Presentations, Document Themes, Backgrounds. Each `status="live"` with
an existing route and real logic/persistence behind it (verified by opening each target page and
its components, not by name).

**One that deserved a second look:** **Backgrounds** — its own header comment says "preview
only / Purely a preview surface" (`BackgroundsGalleryApp.tsx:3-8`), which reads like a stub. It
is not. It maps over the real `BACKGROUND_DESIGNS` registry, calls `design.renderSvg(theme, 960,
540)` per design, and resolves a live theme via a working `ThemePicker` (`:13-15`, `:66-79`).
"Preview-only by design" ≠ "unfinished." **Kept.**

### Ambiguous — needs a human call
**None.** Every tile resolved cleanly to working or placeholder under adversarial review.

### Dead code removed alongside
With no coming-soon tiles left, `HubTile`'s `status` prop and its disabled branch became
unreachable, along with the `.tileDisabled` and `.badge` CSS rules. Removed; `href` is now
required. (If a coming-soon tile is ever wanted again, the old shape is at `20d358f^`.)

---

## Unknowns — stated rather than guessed

- **Whether the on-disk migrations match what's actually applied to the live Supabase project.**
  `supabase/` is gitignored and the database was not queried. All three files are idempotent, so
  drift is possible but unverifiable from source alone.
- **Real-world data quality of `organizations.data->>'website'` and `contacts.data->>'email'`** —
  a data question, not a code question. Directly determines whether the proposed matcher is
  viable. Recommend a read-only sample before building it.
- **Whether contact emails use client corporate domains or personal ones.** Not determinable from
  source, and it decides whether signal 2 is usable at all.
- **Whether a `meetings` relation should be a new entity or an extension of the existing
  `Activity` kind `'meeting'`** (`types.ts:64`). Both fit the schema; it's a product decision.
  `Activity` already has dual optional FKs and an indexed `at`, but **no `organization_id`**.
