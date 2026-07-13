# Phase 3 (Document Themes + Templates) — Discovery

Run date: 2026-07-13. Branch for tonight: `feat/internal-tools-themes`, branched off
`feat/internal-tools-phase5` at `2455723` (the latest commit — see "repo moved under me"
below). Nothing goes on `main`.

**Phase numbering note:** the repo's internal-tools history is phase 1 (proposals),
phase 2 (hub + audits), phase 5 (CRM + budgets). There is no `docs/phase3` or
`docs/phase4`; tonight's spec calls itself phase 3 and writes to `docs/phase3/`, so the
numbering gap closes rather than growing.

## Repo moved under me mid-discovery

Commit `2455723` ("internal app shell + branded date/month pickers") landed on
`feat/internal-tools-phase5` at 13:07 today, between my first directory listing and my
component reads. Verified afterwards: `tokens.css`, both document components and their
CSS, and the PDF engine are untouched by it; the tool toolbars lost their Home links
(the new sticky `InternalHeader` owns navigation now) and the marketing site moved into
an `(site)` route group. All file reads below are from the post-`2455723` tree. Tonight's
work branches from that commit — and the theme-editor route must be added to
`InternalHeader`'s `TOOLS` nav as well as the hub grid.

## Where things actually live (spec sketch → reality)

The spec's `components/...` paths are `src/components/...` here. Tonight's new code goes
in `src/components/internal-tools/themes/` as specced, plus one route directory
`src/app/internal/(protected)/theme-editor/`.

| What | Real path |
| --- | --- |
| Brand tokens | `src/components/internal-tools/tokens.css` (all vars on `.bfScope`) |
| PDF engine | `src/components/internal-tools/pdf/generateDocumentPdf.ts` |
| Proposal app/state | `src/components/proposal-tool/ProposalToolApp.tsx` (useReducer) |
| Proposal document | `src/components/proposal-tool/ProposalDocument/` (forwardRef → `.document` div) |
| Audit app/state | `src/components/audit-tool/AuditToolApp.tsx` (useReducer) |
| Audit document | `src/components/audit-tool/AuditDocument/` |
| Data types | `src/lib/proposal-tool/types.ts`, `src/lib/audit-tool/types.ts` |
| Defaults | `src/lib/{proposal,audit}-tool/defaults.ts` (SSR-deterministic) |
| Hub | `src/app/internal/(protected)/page.tsx` + `HubTile` |
| Shared shell | `src/components/internal-tools/InternalHeader.tsx` (+ Footer/Shell css) |
| Session gate | `src/app/internal/(protected)/layout.tsx` + `src/middleware.ts` |
| robots | `src/app/robots.ts` — disallows `/internal` (prefix ⇒ covers `/internal/theme-editor`) |

## The variables the documents actually read (regression-critical)

The spec's example (`var(--bf-color-bg)`) is a **chrome** variable. The documents read
the **paper** palette plus shared accent/type. Complete list consumed by
`ProposalDocument.module.css` + `AuditDocument.module.css`:

- `--bf-paper-bg` `#f7f7fa`, `--bf-paper-fg` `#0b0f1f`
- `--bf-paper-fg-muted` `rgba(11,15,31,0.72)`, `--bf-paper-fg-soft` `rgba(…,0.6)`
- `--bf-paper-line` `rgba(…,0.08)`, `--bf-paper-line-strong` `rgba(…,0.16)`,
  `--bf-paper-glass` `rgba(…,0.04)`
- `--bf-color-accent` `#6366f1`
- `--bf-grad-primary` (105deg indigo→violet→cyan; keyline + section kicks)
- `--bf-font-display`, `--bf-font-body`, `--bf-font-mono`

**Derivation scheme that makes "classic" exact by construction:** every alpha tier is
`rgba(muted, α)` with α = .72/.6/.08/.16/.04. With classic's `muted = #0b0f1f`
(= foreground), the derived strings equal today's token values character-for-character.
So `themeToCss` derives tiers from `colors.muted` and needs no special-casing.

Hardcoded (not var-driven) colors inside the documents:

- Audit severity palette (left borders + badge tints, `#b91c1c` etc.) — **semantic**,
  deliberately theme-independent (the theme owns brand color, not meaning). Badges are
  self-contained chips (light tint bg + dark text) so they stay legible on a dark page;
  will verify on the dark theme in QA.
- Audit `recsCallout` `border-image: linear-gradient(180deg, #6366f1, #06b6d4) 1` — will
  become `var(--bf-grad-callout, <same literal>)` so themes can override it; the
  fallback keeps the default byte-identical.

## PDF engine facts that shape the design

- It clones the ref'd node into a fresh off-screen `.bfScope` wrapper. Anything not in
  the clone (e.g. CSS vars set inline on an ancestor) is lost ⇒ **the export ref must
  move to the `ThemedDocument` wrapper itself** so the inline vars travel with the clone.
- `PAPER_BG = '#f7f7fa'` is used as html2canvas background and short-page fill ⇒ engine
  gains an optional `backgroundColor` option (default unchanged) or dark-theme pages get
  light bottom strips.
- It strips `boxShadow`/`borderRadius` from the clone **root** only. With the ref on the
  wrapper, the inner `.document` keeps its preview shadow ⇒ engine will also strip
  `[data-pdf-document]`-marked descendants (attribute added to both document roots; no
  visual effect on screen).
- Pagination is cut-position math on offset heights. A cover page that is exactly
  `1056px` tall (= PAGE_HEIGHT_PX at 816px width) makes the first natural cut land
  precisely on its bottom edge; content blocks start at offset 1056 so no straddle
  triggers, no safety backoff shifts the cut. That is the "firm page break" mechanism —
  to be proven in QA with short and long documents.

## Fonts actually in the repo (the curated list)

`next/font` loads exactly two families in the root layout: Plus Jakarta Sans
(`--font-jakarta`) and JetBrains Mono (`--font-mono`). Curated list therefore:

1. Plus Jakarta Sans (brand) — `var(--font-jakarta), system-ui, -apple-system, 'Segoe UI', sans-serif` (classic's exact stack)
2. JetBrains Mono (brand mono) — `var(--font-mono), ui-monospace, Menlo, monospace`
3. System Sans — `system-ui, -apple-system, 'Segoe UI', sans-serif`
4. System Serif — `Georgia, 'Times New Roman', Times, serif`

No new font files, no loader changes.

## Other load-bearing findings

- **No `localStorage` usage anywhere in `src/` today** — the `bf-themes:`,
  `bf-doc-templates:` and `bf-app-dark-mode` keys are unclaimed, nothing to migrate.
- **App chrome is already dark** (ink `#0b0f1f`). The spec's "app-chrome dark mode"
  assumes a light default. Adaptation: the toggle offers a **light** chrome variant;
  default (toggle "dark" = on) is today's look, so zero regression. Attribute
  `data-bf-chrome="light"` on the shell + overrides of the existing `--bf-color-*`
  chrome vars in tokens.css. Documents are insulated not by variable naming but by
  `ThemedDocument` pinning every document-consumed var inline — stronger than the
  spec's naming-discipline mechanism, same guarantee. Logged as a deviation.
- **Hub has no theme-ish "coming soon" tile** (the three placeholders are reserved
  roadmap tools) ⇒ the theme editor gets a **new** tile, nothing replaced.
- `BYTEFLOW_LOGO.png` is dark-indigo-on-transparent — illegible on dark covers. Cover
  page will pick treatment by computed background luminance: PNG on light covers,
  gradient-text wordmark (the hub-masthead precedent from phase 2) on dark ones.
- The three "coming soon" HubTiles, login, middleware, storage layer: untouched tonight.
- Both tools' state is `useReducer` with SSR-deterministic defaults; `themeId` /
  `includeCoverPage` join `ProposalData`/`AuditData` with defaults `"classic"` / `true`
  set in `createDefaultProposal`/`createDefaultAudit`. **Wait — spec default for
  `includeCoverPage` is `true`, which changes the default document (adds a cover).**
  Resolution per the zero-regression guardrail: the data default is `true` as specced,
  but the regression reference is "cover off + classic": QA compares that configuration
  against tonight's baseline. The baseline captures happen **before** any code change.
- QA tooling: Playwright's chromium-1228 is already in `~/.cache/ms-playwright`;
  `playwright-core` + `pdf-to-png-converter` + `pixelmatch` will live in the session
  scratchpad (never in the repo). `INTERNAL_TOOLS_*` QA creds exist in `.env.local`.
  No poppler on this machine.

## Baseline captures (taken before Gate 2 code)

Stored in the scratchpad: preview screenshots + exported PDFs (rendered to PNG) for a
fixed populated proposal and audit, dev server, fresh profile. These are the
pixel-equivalence reference for the Gate 2 regression check.
