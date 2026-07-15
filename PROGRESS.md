# Progress

Branch: `feat/internal-dashboard-meetings` (off `dev` @ `1c9d592`). Nothing pushed; nothing
deployed; `main`/`dev` untouched.

| Phase | Spec | Status |
|---|---|---|
| 1 | `02-DASHBOARD-CLEANUP.md` | ✅ **Complete** — gate met, committed `20d358f` |
| 2 | `03-RECON.md` | ✅ **Complete** — gate met; found two hard prerequisite gaps |
| 3 | `04-CRM-LINKING.md` | ⛔ **Blocked** — BLOCKER 1 (no Calendar OAuth) |
| 4 | `05-MEETINGS-WIDGET.md` | ⛔ **Blocked** — BLOCKER 1 + BLOCKER 2 (no document↔CRM link) |
| 5 | `06-CALENDAR-VIEW.md` | ⛔ **Blocked** — BLOCKER 1 + BLOCKER 2 |
| 6 | `07-MISSING-DOCUMENT-FLOW.md` | ⛔ **Blocked** — BLOCKER 1 + BLOCKER 2 |

---

## Phase 1 — Dashboard cleanup & visual pass ✅

**Done:**
- Audited all 9 hub tiles. 6 working, 3 placeholders, 0 ambiguous. Every deletion candidate
  was independently re-verified by an agent tasked with *refuting* the placeholder verdict —
  all three refutations failed, i.e. the verdicts held.
- Removed Monthly Reports, Contracts, Draft Emails. No routes/components existed behind them,
  so nothing else had to go.
- Removed the now-dead `HubTile.status` prop, its disabled branch, and the `.tileDisabled` /
  `.badge` CSS. `href` is now required.
- Regrouped the 6 real tools into three sections — **Pipeline**, **Client deliverables**,
  **Brand system** — with heading + hairline rule, so the page reads as a dashboard rather
  than a flat list.
- Every value pulled from existing `--bf-*` tokens. No new palette, type scale, or spacing.

**Gate — met:**
- ✅ Zero non-functional "coming soon" placeholders left (verified absent from the rendered DOM,
  not just the source).
- ✅ Reads as an intentional dashboard (screenshots, dark + light chrome, 1440/1280/700px).
- ✅ Every remaining tool works identically — all 6 tiles link to the same routes as before;
  no tool code was touched.
- ✅ `typecheck` exit 0 / `lint` clean / `build` compiles, 18/18 pages.

**Deliberate deviation from the spec, flagged for review:** `02-DASHBOARD-CLEANUP.md` suggests
a default grouping of **"Needs attention" vs "Tools"**, with the meetings widget eventually
landing in "Needs attention". Since Phases 4–6 are blocked, that section would have shipped
**empty** — which would have been a new placeholder, the exact thing this phase exists to
remove. So the six real tools were grouped by purpose instead. "Needs attention" is the
natural slot at the top of the page once the meetings widget is unblocked.

**Note on QA method:** the hub is behind a Supabase Auth gate and no credentials were
available. Rather than create a user in the live project just to screenshot, the real hub
component was rendered through a temporary local-only route outside the `/internal` middleware
matcher, screenshotted, and **deleted immediately**. It was never committed — verify with
`git log -p --all -- 'src/app/hub-preview-qa/*'` (returns nothing).

---

## Phase 2 — Recon ✅

**Done:** `RECON.md` and `BLOCKERS.md` written from source, not assumption. Six parallel
readers covered the hub, CRM schema, document tagging, theme tokens, auth/Calendar, and the
storage layer; the two highest-stakes claims were then adversarially verified.

**Gate — met:**
- ✅ `RECON.md` is complete, specific, and reflects the real codebase — every claim cites
  `file:line`; unknowns are stated as unknown rather than guessed.
- ✅ Prerequisite gaps logged in `BLOCKERS.md`.
- ✅ A matching strategy is proposed and justified by what recon actually found — including a
  correction to the spec's assumed signal ordering, and a mandatory consumer-email-domain
  blocklist without which the matcher would silently mis-assign meetings.
- ✅ No ambiguous Phase 1 items to log (there were none).

**The two findings that stop the package:**
1. **Google Calendar OAuth was never built.** `01-CONTEXT.md` lists it as a done prerequisite.
   It does not exist on any of 40 branches or in ~400 commits. `GOOGLE_CLIENT_ID`/`SECRET`
   exist in `.env.local` but are read by no code — provisioned, never wired up.
2. **Documents have no CRM linkage and live only in browser localStorage.** So "does this
   client have a document?" — the basis of the entire Ready/Needs-prep feature — is not
   answerable today, server-side *or* client-side. This blocks Phases 4–6 **independently of
   the OAuth gap**.

---

## Phases 3–6 ⛔ Not started

Blocked per `03-RECON.md` Step 1 ("**If this isn't in place: stop.**") and the master prompt's
instruction not to build the OAuth flow inside this run. See `BLOCKERS.md` for evidence and
recommended next steps.

Nothing was built speculatively against a data model that doesn't exist yet.
