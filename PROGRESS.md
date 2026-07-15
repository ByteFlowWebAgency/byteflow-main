# Progress

Branch: `feat/internal-dashboard-meetings` (off `dev` @ `1c9d592`). Nothing pushed; nothing
deployed; `main`/`dev` untouched.

| Phase | Spec | Status |
|---|---|---|
| 1 | `02-DASHBOARD-CLEANUP.md` | ✅ **Complete** — gate met, `20d358f` |
| 2 | `03-RECON.md` | ✅ **Complete** — gate met; found two hard prerequisite gaps, `6c177c4` |
| 2.5 | *(not in the package)* | ✅ **Complete** — Calendar OAuth built after Tyrone authorised it, `3844433` |
| 3 | `04-CRM-LINKING.md` | ✅ **Complete** — gate met (matching verified on fixtures, not live data — see caveat), `3844433` |
| 4 | `05-MEETINGS-WIDGET.md` | ⛔ **Blocked** — BLOCKER 2 (no document↔CRM link) |
| 5 | `06-CALENDAR-VIEW.md` | ⛔ **Blocked** — BLOCKER 2 |
| 6 | `07-MISSING-DOCUMENT-FLOW.md` | ⛔ **Blocked** — BLOCKER 2 |

**Manual steps — status** (see `BLOCKERS.md`):
- ✅ Redirect URI registered — a real consent round trip completed 2026-07-15 and returned
  `scope=email calendar.events.readonly userinfo.email openid`.
- ✅ Migration applied to the live project (over the `aws-1` session pooler; the direct
  `db.<ref>` host is IPv6-only and unreachable from WSL). Verified `service_role` reads both
  new tables and `anon` is blocked with `42501`.
- ⚠️ **Trim the OAuth consent screen's scopes** — BLOCKER 3. 13 scopes incl. "permanently
  delete all the calendars" are still configured, contrary to `01-CONTEXT.md`. Not blocking:
  the code now refuses any token carrying scope it didn't ask for.
- ▶️ **Next: hit Connect again.** The first attempt failed only because the table didn't
  exist yet.

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

**Not verified — needs you:** the actual consent round trip, token refresh against real
Google, and reading real events. All three need a Google account to click through consent,
plus the redirect URI registered in the Cloud Console. Nothing in the flow has been exercised
against live Google.

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
- ⚠️ *"A real upcoming meeting resolves to the correct CRM record"* — **verified against
  fixtures, not real data.** 26 tests over the real compiled matcher cover all three tiers,
  precedence, ambiguity, and the wrong-match regressions. But no live calendar has been read
  and no real CRM row inspected, because both need the console step + consent above. **This
  part of the gate is not fully met and should not be reported as met.**

**Also unmeasured:** whether the email/domain signals actually fire on this CRM's real data.
`RECON.md` § Step 5 recommends sampling real `Organization.website` / `Contact.email` values
before trusting the matcher — still worth doing.

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

## Phases 4–6 ⛔ Not started

Blocked on BLOCKER 2: documents live only in browser localStorage with no CRM link, so the
"Ready" vs "Needs prep" badge — the point of all three phases — has no data to read. Not
started rather than built against a model that doesn't exist.
