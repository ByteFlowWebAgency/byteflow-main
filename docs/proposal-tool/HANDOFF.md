# Proposal Tool — Morning Handoff

Built overnight on branch **`feat/proposal-tool`** (7 commits, nothing touched on `main`).
Every phase gate passed: compile ✓, `tsc --noEmit` ✓, `next lint` ✓, plus a 21/21-check
end-to-end QA run in headless Chromium (details below).

## ⚠️ Check this first (unrelated to the feature, but urgent)

**`sendgrid.env` is committed to the repo and contains what looks like a real SendGrid API
key.** The `.gitignore` line meant to exclude it is corrupted (`*.envs e n d g r i d . e n v`
— text got mangled, likely UTF-16 copy-paste). Rotate that key in SendGrid, then remove the
file and fix `.gitignore` (purging it from git history is a separate, destructive decision —
I didn't touch any of this overnight). Until rotated, treat that key as public.

## The one thing to check before trusting this with a real client

Set `INTERNAL_TOOLS_USERNAME` / `INTERNAL_TOOLS_PASSWORD` in Vercel (and `.env.local`),
open `/internal/proposal-tool` on a deploy preview, build one real-ish proposal, and read
the downloaded PDF end to end. Everything was QA'd against a local Contentful mock built
from the repo's `Contentful-data/` dumps — the one thing I could not verify on this machine
is behavior against **live** Contentful (no credentials here; `.env.local` has throwaway QA
values, gitignored, safe to overwrite).

## What was built

Login-gated internal tool: form on the left, live ByteFlow-branded proposal document on the
right, one-click US-Letter PDF download. Flat / retainer / hybrid pricing, services sourced
from the same Contentful entries the marketing site renders (static fallback if Contentful
is unreachable), Discover/Build/Scale phases, line items with live totals, deliverables,
terms with auto-computed valid-through date.

Key files:

- `src/app/internal/proposal-tool/page.tsx` — entry, fetches service labels (with fallback)
- `src/app/internal/login/page.tsx` + `src/app/api/internal-login|internal-logout/route.ts`
- `src/middleware.ts` — gates all of `/internal/*`; layout re-checks as defense-in-depth
- `src/lib/proposal-tool/` — `types.ts`, `pricingMath.ts`, `defaults.ts`, `validate.ts`,
  `session.ts`
- `src/components/proposal-tool/` — `ProposalToolApp` (state via one reducer),
  `ProposalForm/*` (screen 1), `ProposalDocument/*` (screen 2), `pdf/generatePdf.ts`,
  `tokens.css` (brand tokens, scoped to `.bfScope`)
- `docs/proposal-tool/DISCOVERY.md`, `DESIGN-TOKENS.md` — what was found and reused

## Access gate (hard requirement — implemented)

- Credentials only in `INTERNAL_TOOLS_USERNAME/PASSWORD` env vars, compared server-side
  with SHA-256 + `crypto.timingSafeEqual` (constant-time, no field-specific errors).
- Session: stateless HMAC token (`expiry.signature`), key derived from the env vars
  themselves — rotating the password kills all sessions; unset env vars = nobody gets in
  (fails safe, no crash). Cookie is httpOnly / Secure / SameSite=Lax / 24h.
- Middleware covers every `/internal/*` path; logged-in visits to the login page bounce to
  the tool; logout button in the toolbar clears the cookie.
- QA (curl + browser): unauthenticated → redirect; wrong creds → generic error, no cookie;
  right creds → tool; tampered token → rejected; logout → gate closed again. All passed.
- No public nav/footer/sitemap links to `/internal`. Internal pages set `robots: noindex`.

## Deviations from the spec files (repo reality won)

- **Paths**: repo uses `src/` — everything landed under `src/app`, `src/components`,
  `src/lib` instead of the spec's root-level paths.
- **Brand palette**: not near-monochrome — the real tokens (globals.css + the repo's own
  `public/design_docs/`) are ink `#0B0F1F` with indigo/violet/cyan gradients. Extracted
  verbatim; the spec's placeholder palette was never needed.
- **robots.txt**: repo has none, spec says only add `Disallow` "if this repo has one," and
  guardrails forbid touching SEO surface — so none was created.
- **No prior ROI-calculator/proposal code exists in this repo** (searched; the only "roi"
  hit was the substring in `heroInner`). Built fresh per specs; nothing to generalize.
- **Form section markup** uses `<section>`+`<h2>` instead of `fieldset/legend` (legend
  styling is unreliable cross-browser); a `PhasesSection` was added to the form (screens
  spec requires phase editing; the architecture file's component list omitted it).

## Decisions made without asking (all reversible)

- **The document is a light "paper" artifact** on the dark tool chrome, using the light
  pairing the repo's own `design_docs/01_COLOR_SYSTEM.md` §6 documents (bg `#F7F7FA`, ink
  foreground, brand gradients kept). Rationale: it's a printable client document; solid
  dark pages read poorly printed/emailed. The signature element is the **gradient keyline**
  (masthead bar + section kicks).
- **Marketing Nav/Footer render around the internal tool** — the root layout wraps every
  route, and opting out would mean restructuring existing pages into route groups
  (guardrail-prohibited). Cosmetic only; the PDF captures just the document node.
- Session TTL 24h; document footer uses the site's public contact conventions
  (`byteflow.us · support@byteflowsolutions.com · Akron, Ohio` — from the live contact
  page data, nothing invented).
- `.env.example` was created fresh (repo had none) and also lists the pre-existing
  Contentful/SendGrid var names as comments for completeness.
- The pre-existing uncommitted `package-lock.json` version-sync (1.0.0→1.1.1 metadata) got
  absorbed into the dependency commit rather than left dangling.

## Known limitations

- **PDF text is rasterized** (html2canvas capture) — not selectable/searchable. Accepted
  tradeoff per 03/06 specs; the documented upgrade path is a serverless headless-Chromium
  render. Sizes are fine: ~390KB for 2 pages, ~900KB for 3 (JPEG page images — PNG made
  jsPDF balloon to 20–40MB, found and fixed during QA).
- Bracketed placeholders (e.g. "[Describe the Build phase…]") **do print** if left
  unedited — deliberate, so an unfinished section is unmissable rather than silently blank.
- Line items that don't fit the pricing model (recurring items under flat pricing,
  one-time items under retainer) are excluded from the document and totals; the form shows
  a hint when that's happening.
- No draft persistence — a page refresh clears the form (localStorage drafts were spec'd
  as lowest-priority nice-to-have; deferred, see below).
- Mobile is usable-but-cramped (panes stack); desktop is the design target per spec.

## Deferred ideas (flagged, not built)

- localStorage draft saving / "My Drafts" list (03-ARCHITECTURE optional item)
- Server-side PDF rendering for selectable text + smaller files
- Emailing the PDF from the tool; multiple document themes
- A shared "internal tools" landing page under `/internal` if more tools accumulate
- Repo hygiene beyond scope: fix the mangled `.gitignore` line, remove `lint.json`
  (stale UTF-16 lint dump), and the sendgrid.env rotation above

## How QA was run (so you can re-run it)

Headless-Chromium E2E lives in the session scratchpad (not committed — throwaway):
logs in through the real form, fills all three pricing models, checks the live preview
totals ($6,250 flat / $2,450/mo·$14,700 retainer / $18,700 hybrid on the sample inputs),
rejects negative amounts, exports short and long PDFs, and I visually inspected every
exported page for page-break quality. Contentful was mocked from `Contentful-data/*.json`
via an injected Node preload (repo untouched); auth flow also verified with curl. To QA by
hand: `.env.local` with the two internal vars + real Contentful creds, `npm run dev`, then
walk `07-INTEGRATION-AND-QA.md`'s checklist.
