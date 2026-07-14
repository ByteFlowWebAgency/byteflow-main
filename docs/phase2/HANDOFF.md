# Phase 2 — Morning Handoff (hub + site audits)

Built overnight on **`feat/internal-tools-phase2`** (8 commits, branched off phase 1's
`feat/proposal-tool`; nothing on `main`). Final state: full `npm run build` completes
(live Contentful credentials from `.env.local`), `tsc` and lint clean, **zero new
dependencies**.

## Did the proposal tool survive? Yes — verified, not assumed

- The complete phase-1 E2E suite (21 checks: login flow, all three pricing models' math,
  live preview, negative-input guard, short + long PDF export with correct filenames)
  was re-run against the migrated code and passed **21/21 — against live Contentful**.
  It was run again after the one shared-PDF-engine change later in the night: still 21/21.
- Production-mode (`next build` + `next start`) gate check passed 10/10: `/internal`,
  `/internal/proposal-tool`, and `/internal/audits` all redirect unauthenticated → login;
  correct credentials land on the hub; logout re-locks everything; wrong credentials get
  the same generic error; the public site is untouched.
- URL unchanged: `/internal/proposal-tool`, exactly as before.

**One deliberate behavior change** (sanctioned by tonight's spec): logging in — or
visiting `/internal/login` while already signed in — now lands on **`/internal`** (the
hub) instead of the proposal tool.

## What was migrated

- **Route group**: `src/app/internal/(protected)/layout.tsx` is now the shared
  server-side session gate; the proposal tool moved inside the group; its old per-tool
  layout is gone. The phase-1 middleware (`src/middleware.ts`) remains the first gate for
  all of `/internal/*` — unchanged except the post-login redirect target. Mechanism
  (env-var creds, timing-safe compare, httpOnly cookie) untouched per guardrails.
- **Promoted to shared homes**:
  - `src/components/internal-tools/tokens.css` (as-is)
  - `src/components/internal-tools/pdf/generateDocumentPdf.ts` — generalized to
    `(node, filename)`; knows nothing about proposals; both tools call it
  - `src/lib/internal-tools/session.ts` (as-is)
  - `src/lib/internal-tools/clientInfo.ts` — new shared `ClientContact`; the proposal's
    `ClientInfo` now extends it
  - `src/lib/internal-tools/format.ts` — shared document date formatter (promoted beyond
    the spec list because both documents need it; date-only strings parse as local dates
    so an audit dated 2026-07-13 never prints July 12)
- **Deliberately NOT shared**: form-field/app-shell CSS. The audit tool has its own
  copies of those patterns. Sharing presentation CSS mid-migration was regression surface
  with no user-visible payoff; consolidating into one internal-tools form stylesheet is a
  good future cleanup once a third tool exists.

## What was built new

- **Hub** at `/internal` — `(protected)/page.tsx` + `HubTile`: live tiles for Proposals
  and Site Audits, dimmed non-clickable "Coming soon" tiles (Monthly Reports, Contracts,
  Draft Emails), logout, gradient-wordmark masthead, keyboard-navigable.
- **Site Audit Reports** at `/internal/audits`:
  - `src/lib/audit-tool/` — types (shared `ClientContact`), category/severity labels,
    empty defaults, export validation
  - `src/components/audit-tool/AuditForm/` — site/client basics (audit date defaults to
    today), verbatim summary textarea, findings in collapsible per-category groups
    (severity select including "Working well", screenshot file input), top
    recommendations list
  - `src/components/audit-tool/AuditDocument/` — the branded report: mono site-URL
    masthead with the shared gradient keyline, summary, a "Where to start" numbered
    callout (placed right after the summary — judgment call: cold-outreach readers skim,
    so the action list leads), findings grouped by category with empty categories
    skipped, severity badges + matching left accents, inline screenshots, restrained
    "glad to walk through it" footer line.
  - PDF export through the shared engine; filename
    `ByteFlow-Site-Audit-{Client}-{date}.pdf`.

## Audit QA actually performed

17/17 automated checks in headless Chromium: hub-tile navigation, empty-state rendering
and export blocking (site URL + client name + ≥1 finding all required), live preview
grouping with empty categories skipped, a "good" finding rendering distinctly (cyan,
"Working well"), a screenshot attached via the real file input rendering inline, export
re-blocking when a required field is cleared, and both PDFs opened and inspected
page-by-page: short audit (6 findings, 1 screenshot) → 3 pages / ~590KB; long audit
(12 findings, 5 categories) → 5 pages / ~1MB. Findings never split across pages; category
headings never orphaned; screenshot printed intact with correct aspect ratio.

Inspecting those pages caught one real bug that automated checks missed: a few-pixel
sliver of the next section's gradient tick could remain at a page bottom (DOM-offset vs
canvas-pixel rounding drift). Fixed in the shared engine with a 6px cut-safety backoff;
both tools' suites re-passed afterward.

## Decisions made without asking

- Login (and authed visits to the login page) land on the hub — see above.
- Hub masthead uses the brand gradient-text wordmark instead of `BYTEFLOW_LOGO.png`
  (that asset is dark-indigo-on-transparent and illegible on the ink background; the real
  logo already shows in the marketing Nav directly above, and on both paper documents).
- Top-recommendations callout sits right after the summary (spec allowed either
  placement).
- Severity palette on paper: critical `#B91C1C`, high `#C2410C`, medium `#A16207`,
  low `#4338CA`, good `#0E7490` (tinted badges + left accents) — derived from the repo's
  own semantic color table, darkened for light-background contrast.
- Screenshots are downscaled client-side to ≤1200px wide JPEG on attach, so a full-size
  retina capture can't balloon form state or the PDF.
- `formatDisplayDate` promoted to shared code beyond the spec's explicit list (rationale
  above, regression-tested).

## Known limitations

- Same as phase 1: PDFs are rasterized (no selectable text); no draft persistence — a
  refresh clears the form, **including attached screenshots** (they live only in memory,
  by design; nothing is uploaded or stored).
- Unreadable/non-image files chosen in the screenshot input are silently ignored (the
  input just clears) — no error message yet.
- robots.txt still doesn't exist in this repo (unchanged from phase 1; guardrails say
  don't touch SEO surface). There is no `/internal` robots rule because there's no file —
  the protection is the auth gate itself, plus `robots: noindex` metadata on every
  internal page including the new hub and audits routes.

## Check first in the morning

1. **Proposal tool**: log in on a deploy preview → land on the hub → open Proposals →
   totals + PDF export (the regression suites passed locally; confirm once in your real
   environment).
2. **Audit tool**: build a real-ish audit with a screenshot and export — confirm the PDF
   reads like something you'd send to a prospect.
3. `.env.local` was found to contain live Contentful credentials (added since phase 1) —
   they were used read-only for builds/QA tonight. The `INTERNAL_TOOLS_*` values in it
   are still throwaway QA strings; set real ones in deployment before first use.

## Deferred (next passes, per the roadmap)

- Monthly SEO reports, Contracts (clause library), Draft Emails (Claude-API-backed) —
  hub tiles are already reserved.
- Draft persistence (localStorage) across all tools; shared form stylesheet
  consolidation; selectable-text PDF via serverless Chromium; an error message for
  unreadable screenshot files.
- Phase 1's standing items: rotate + purge the committed `sendgrid.env` key (still
  present, still urgent), fix the mangled `.gitignore` line, delete stale `lint.json`.
