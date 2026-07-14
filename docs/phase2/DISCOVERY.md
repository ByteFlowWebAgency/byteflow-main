# Phase 2 — Discovery (hub + site audits)

Date: 2026-07-13 (overnight autonomous run). Branch: `feat/internal-tools-phase2`, off
`feat/proposal-tool` (`c4347a2`, phase 1's final commit). Phase 1's HANDOFF was read first;
the notes below reconcile tonight's spec against what phase 1 actually shipped.

## Baseline (before any change tonight)

- **`npm run build` now completes end-to-end** — real Contentful credentials are present in
  `.env.local` (added since phase 1; values not reproduced here). Phase 1 could only gate on
  compile+types+lint; tonight's gate is the full build. `tsc --noEmit` and `next lint` are
  both clean at baseline.
- The phase-1 QA harness survives in the session scratchpad (Playwright + Chromium, the
  Contentful network mock, the proposal-tool E2E script). With live credentials the mock is
  optional; QA will run against live (read-only) Contentful data.
- `INTERNAL_TOOLS_*` in `.env.local` are still throwaway local QA values.

## What phase 1 actually did (differs from tonight's spec assumptions)

Tonight's architecture spec assumes the login gate lives only in
`app/internal/proposal-tool/layout.tsx`. Reality (per phase 1's HANDOFF and confirmed in
code): the gate is **two layers**:

1. **`src/middleware.ts`** — the primary gate. Matcher `/internal/:path*`, verifies the
   HMAC session cookie (WebCrypto, Edge-safe), redirects unauthenticated requests to
   `/internal/login`, and bounces already-authenticated visits to the login page into the
   tool. This ALREADY protects every current and future `/internal/*` URL — including
   tonight's new `/internal` hub and `/internal/audits` — with no changes needed.
2. **`src/app/internal/proposal-tool/layout.tsx`** — a thin defense-in-depth re-check
   (cookies() → verify → redirect).

**Adaptation**: the migration moves layer 2 into the route group
(`src/app/internal/(protected)/layout.tsx`) exactly as the spec's diagram shows, and the
middleware stays as-is except for one redirect target (below). The mechanism (env-var
creds, timing-safe check, httpOnly cookie) is untouched, per guardrails.

## Post-login destination changes (spec-sanctioned)

Phase 1 sent successful logins (and already-authed visits to `/internal/login`) to
`/internal/proposal-tool` — there was nothing else. With the hub, "land somewhere sensible
(the new hub page)" per 05-INTEGRATION-AND-QA.md means both redirects change to
`/internal`. Two-line change: `src/app/api/internal-login/route.ts` and
`src/middleware.ts`. Logged as a deliberate behavior delta in HANDOFF.

## File-move map (repo paths are `src/…`, adapting the spec's root-relative paths)

| From (phase 1) | To (tonight) | Notes |
|---|---|---|
| `src/app/internal/proposal-tool/layout.tsx` | `src/app/internal/(protected)/layout.tsx` | becomes the group gate; per-tool layout deleted |
| `src/app/internal/proposal-tool/page.tsx` | `src/app/internal/(protected)/proposal-tool/page.tsx` | URL unchanged: `/internal/proposal-tool` |
| `src/components/proposal-tool/tokens.css` | `src/components/internal-tools/tokens.css` | moved as-is; `.bfScope` scope class unchanged |
| `src/components/proposal-tool/pdf/generatePdf.ts` | `src/components/internal-tools/pdf/generateDocumentPdf.ts` | generalized: `(node, filename)` — no proposal knowledge; proposal builds its own filename |
| `src/lib/proposal-tool/session.ts` | `src/lib/internal-tools/session.ts` | moved as-is |
| (new) | `src/lib/internal-tools/clientInfo.ts` | `ClientContact` = clientName/contactName/contactEmail; proposal's `ClientInfo` extends it with `organizationType?` |

Import sites to update: `src/middleware.ts`, both API routes, the group layout,
`ProposalToolApp.tsx` (tokens import + pdf import), `src/app/internal/login/page.tsx`
(tokens import), `src/lib/proposal-tool/types.ts` (ClientInfo extends shared type).

Kept proposal-specific (not moved): pricing math, validate.ts, defaults, the proposal form
and document components/styles.

**Deliberately NOT shared tonight**: the form-field/app-shell CSS. The audit tool copies
the field patterns into its own modules instead of importing the proposal form's
stylesheet — sharing presentation CSS across tools mid-migration is regression surface for
zero user-visible gain tonight; consolidating into a shared form stylesheet is flagged in
HANDOFF as a future cleanup. (`tokens.css` — the actual brand values — IS shared.)

## Hub page notes

- Root layout still wraps `/internal/*` in the marketing Nav/Footer (unchanged phase-1
  reality) — the real logo asset already appears in the Nav directly above the hub.
  `public/BYTEFLOW_LOGO.png` is dark-indigo-on-transparent and is illegible on the ink
  background, so the hub masthead uses the brand's gradient-text wordmark treatment
  (`--grad-text`, the site's own convention) rather than the PNG. Logged as a decision.
- Hub page is a server component inside the protected group; `/internal` URL comes from
  `(protected)/page.tsx`.

## robots.txt

Still none in the repo (unchanged since phase 1; guardrails still say don't create SEO
surface). All internal pages set `robots: noindex` metadata; the audits page will too.
The 05 spec's "confirm the existing rule covers the new routes" resolves to: there is no
rule because there is no file — auth is the protection. Re-flagged in HANDOFF.

## Severity palette for audit badges (grounding)

The repo's own semantic colors (`public/design_docs/01_COLOR_SYSTEM.md` §4): Error
`#F87171`, Warning `#FBBF24`, Info `#818CF8`, Success `#22D3EE`. Audit severity mapping
derives from these (critical/high → red/orange family, medium → amber, low → indigo,
good → cyan), darkened for contrast on the light paper document. Exact values in the audit
document stylesheet; logged as a decision.
