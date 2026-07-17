# Progress

Branch: `feat/internal-dashboard-meetings` (off `dev` @ `1c9d592`). Nothing pushed; nothing
deployed; `main`/`dev` untouched.

| Phase | Spec | Status |
|---|---|---|
| 1 | `02-DASHBOARD-CLEANUP.md` | ✅ **Complete** — gate met, `20d358f` |
| 2 | `03-RECON.md` | ✅ **Complete** — gate met; found two hard prerequisite gaps, `6c177c4` |
| 2.5 | *(not in the package)* | ✅ **Complete** — Calendar OAuth built after Tyrone authorised it, `3844433` |
| 3 | `04-CRM-LINKING.md` | ✅ **Complete** — gate met, incl. on live data, `3844433` |
| 2.6 | *(not in the package)* | ✅ **Complete** — documents linked to CRM clients, closing BLOCKER 2, `d549eda` |
| 4 | `05-MEETINGS-WIDGET.md` | ✅ **Complete** — `d549eda` |
| 5 | `06-CALENDAR-VIEW.md` | ✅ **Complete** — `d549eda` |
| 6 | `07-MISSING-DOCUMENT-FLOW.md` | ✅ **Complete** — `d549eda` |

**Manual steps — status** (see `BLOCKERS.md`):
- ✅ Redirect URI registered — a real consent round trip completed 2026-07-15 and returned
  `scope=email calendar.events.readonly userinfo.email openid`.
- ✅ Migration applied to the live project (over the `aws-1` session pooler; the direct
  `db.<ref>` host is IPv6-only and unreachable from WSL). Verified `service_role` reads both
  new tables and `anon` is blocked with `42501`.
- ⚠️ **Trim the OAuth consent screen's scopes** — BLOCKER 3. 13 scopes incl. "permanently
  delete all the calendars" are still configured, contrary to `01-CONTEXT.md`. Not blocking:
  the code now refuses any token carrying scope it didn't ask for.
- ✅ **Connected** as `tyrone_johnson@byteflowsolutions.com`; granted scope is exactly
  `openid userinfo.email calendar.events.readonly` — nothing broader.

---

## Phase 1 — Dashboard cleanup & visual pass ✅

Removed Monthly Reports / Contracts / Draft Emails (all `status="coming-soon"`, no `href`,
nothing behind them; each verdict re-verified by an agent tasked with refuting it). Dropped
the now-dead `HubTile.status` prop and its CSS. Regrouped the 6 real tools into Pipeline /
Client deliverables / Brand system. Only existing `--bf-*` tokens used.

**Gate met:** zero placeholders left (verified in the rendered DOM); reads as a dashboard
(screenshots, dark + light, 1440/1280/700px); every tool links to the same route as before;
typecheck/lint/build green.

**Deliberate deviation:** the spec's suggested "Needs attention" vs "Tools" grouping would
have shipped an **empty** section (the meetings widget is blocked) — itself a placeholder,
the exact thing this phase removes. Grouped by purpose instead. A "Meetings" section now
leads the page and is where the widget lands when unblocked.

---

## Phase 2 — Recon ✅

`RECON.md` + `BLOCKERS.md`, written from source. Six parallel readers (hub, CRM schema, doc
tagging, theme tokens, auth/Calendar, storage layer); the two highest-stakes claims then
adversarially verified.

**Gate met:** every claim cites `file:line`; unknowns stated as unknown; prerequisite gaps
logged; matching strategy proposed and justified — including a correction to the spec's
signal ordering and a mandatory consumer-domain blocklist.

---

## Phase 2.5 — Connect-Calendar OAuth ✅ *(not in the original package)*

Built after Tyrone authorised it and chose the design. Calendar access is an
**authorization** grant, not a sign-in — Supabase Auth sign-in is untouched. Standard OAuth
code flow, refresh token in `google_calendar_tokens` (RLS, service_role only, not an
EntityStore entity so `/api/crm/*` can't reach it), `calendar.events.readonly` only,
revocable.

**Verified:** consent URL asserted to carry no write-capable scope and no client secret (7
tests); every route fails closed unauthenticated (307/401); `GET` disconnect → 405;
`/api/crm/google_calendar_tokens` → 404; connection card renders in both chrome modes.

**Verified against live Google (2026-07-15):** consent round trip completed; the stored grant
is exactly `openid userinfo.email calendar.events.readonly`; refresh-token → access-token →
event fetch all work. `include_granted_scopes` was removed and an allowlist added first — see
BLOCKER 3 — so a token carrying anything broader is now refused rather than stored.

---

## Phase 3 — Meetings ↔ CRM linking ✅

`meetings` added as a CRM entity the standard way (migration + `EntityName`/`CRM_ENTITIES` +
extractColumns + validator), so `/api/crm/meetings` is served with no new route code. Stores
the event id, start time, and auto-vs-manual, per spec.

One shared fetch/match layer: `lib/meetings/resolve.ts`, exposed as `/api/meetings?from=&to=`
with a **date range parameter** precisely so the 7-day list and the month grid consume the
same path. `/api/meetings/assign` is the manual override both will call.

**Gate:**
- ✅ *No duplicate event-fetching logic* — exactly one Calendar API path
  (`lib/google/calendar.ts`), one matcher, one resolve layer.
- ✅ *Manual override persists and is not overwritten* — a `manual` row short-circuits the
  matcher before it runs; a manual row with no org is a deliberate "not a client meeting"
  and is likewise never re-matched.
- ✅ *"A real upcoming meeting resolves to the correct CRM record, or is correctly left
  unmatched"* — **now verified on live data** (2026-07-15, read-only dry run calling the real
  `listCalendarEvents` + `matchEvent` against the real calendar and real CRM):
  - Token refresh + calendar fetch worked; 3 events in the next 30 days.
  - **1 correctly matched**: "Chris / Tyrone" → *Summit County Continuum of Care*, via tier 1
    (attendee `…@summitcoc.org` = a stored `Contact.email`). Note the title contains **no org
    name**, so tier 3 could never have caught it — this meeting matched *only* because of the
    exact-contact-email signal, which `03-RECON.md` didn't list and recon added.
  - **2 correctly unmatched**: two Contentful webinars with no external attendees. No signal,
    left alone rather than force-matched — exactly what `00-GUARDRAILS.md` requires.
  - Both halves of the gate demonstrated. Caveat: a 3-event sample, and the dry run
    deliberately did not call `resolveMeetings` (which persists), so **the persistence path is
    still only fixture-tested**.

**Real-data quality — measured, and better than feared:** 4 organizations (3 with a usable
website domain: `summitcoc.org`, `progressakron.org`, `akronsneakeracademy.org`) and 4 contacts
(3 with both an email and an org). Contact emails are on **corporate** domains, not personal
ones — so tiers 1 and 2 are both genuinely viable here, and the consumer-domain blocklist is
insurance rather than load-bearing. The `RECON.md` § Step 5 recommendation to sample before
trusting the matcher is now done.

---

## Adversarial review of the OAuth + matching code

12 findings confirmed, 3 refuted; all 12 fixed in `3844433`. The two that mattered were both
in code I'd added *beyond* what `RECON.md` specified:
- **Legal-suffix stripping** reduced "Vision Foundation" → `vision`, silently matching "Q3
  vision planning". Removed — only full names match, as the spec actually said.
- **`normalizeDomain` accepted an email** in the free-text website field, so `jane@aol.co.uk`
  made every aol.co.uk attendee match Jane's Barbershop. Now returns null; consumer and
  shared hosts are also excluded on the org side.

Both were the "wrong match is worse than no match" failure the guardrails single out.

---

## Phase 2.6 — Documents ↔ CRM ✅ *(not in the original package; closed BLOCKER 2)*

`documents` table with an `organization_id` FK; `BuiltDocument.organizationId` threaded
through `validateDocument` (which rebuilds a fresh object — an uncopied field is dropped on
every save, so the link had to be explicit or it would have silently evaporated).
localStorage remains the editing store, the server is the shared copy, and `sync.ts` mirrors
up on save + reconciles on list load.

**Safety:** the sync never deletes a local document and never overwrites a newer copy in
either direction. It is deliberately not delete-propagating — a document missing locally but
present on the server means "a teammate made it", not "I deleted it".

**Cost control:** the badge reads `listDocumentSummaries()` (extracted columns only). The
generic `listEntities` selects `data`, which for documents means megabytes of embedded image
data URLs — fine for backup, absurd for a yes/no question.

---

## Phases 4, 5, 6 ✅

`MeetingsSection` owns the data for both views — **one** fetch over a range covering the
7-day list and the visible month.

**Gates:**
- ✅ 7-day list, sorted, today distinct, doc status per row, inline reassignment.
- ✅ Month grid, native (not Google's iframe — no public sharing anywhere), prev/next +
  Today, `+N more` overflow, chips reusing the list's status indicator.
- ✅ *"Navigating months doesn't trigger a duplicate/competing fetch"* — true by
  construction: one owner, one fetch, two slices.
- ✅ *"A reassignment in the grid is reflected in the list without a full page reload, and
  vice versa"* — both render from the same array.
- ✅ *Flow stops at "fix the CRM record" and does not offer generation prematurely* —
  verified: a client whose only contact has no email gets the problem named, a deep-link to
  the record, and **no generate button**.
- ✅ *needs-prep → ready after a document is linked* — verified end to end against the live
  project.

**Verified on live data:** all three match signals fire (`contact-email` → Summit County,
`org-domain` → Progressive Alliance CDC Akron, `org-name-in-title` → Clutch DNA).

**Not yet exercised by a human:** the reassignment round trip and the pre-filled
`?forOrg` document creation were verified by fixtures and by direct calls, not by clicking
through the real UI. Worth a pass.
