# Phase 3 — Morning Handoff (Document Themes + Templates)

Built overnight on **`feat/internal-tools-themes`** (7 commits, branched off
`feat/internal-tools-phase5` at `2455723`; nothing on `main`). Production `npm run
build` passes (run in an isolated git worktree — see the incident note), `tsc` and lint
clean, **zero new dependencies** (`package.json` diff vs. the branch base: 0 lines).

## The regression, confirmed first

**With theme Classic, no template (Blank), and the cover unchecked, both tools render
and export pixel-identical to before any of tonight's code existed.** Method: before
Gate 2, a deterministic Playwright harness captured preview screenshots and exported
PDFs of a fixed filled proposal and audit on the pre-change code. After every gate —
and once more at the end of the night, on a freshly restarted dev server with all seven
commits — the same harness re-captured and compared pixel-by-pixel: **preview PNGs and
every PDF page, zero differing pixels, every time** (proposal 2 pages, audit 2 pages).
The comparison also held with app-chrome light mode active during export.

One deliberate spec-mandated change to the *default flow*: `includeCoverPage` defaults
to **true** (Part 2 says "default true"), so a brand-new document now starts with a
cover page — one checkbox click ("Include cover page", top of each form) restores the
exact pre-theme output, proven pixel-identical above. The spec's zero-regression
guardrail and its default-true instruction genuinely conflict; I followed the explicit
default and kept the regression bar at cover-off. Flip the default to `false` in
`createDefaultProposal`/`createDefaultAudit` (one line each) if you want the old
document byte-for-byte as the untouched default.

## What was built and where

All paths are `src/…` (the spec's `components/…` sketch, adapted).

**Theme system** — `src/components/internal-tools/themes/`
- `themeTypes.ts` — `Theme` interface + curated font list (brand Jakarta/JetBrains
  stacks + system sans/serif — the only four allowed) + field-by-field validation.
- `builtInThemes.ts` — **Classic** (today's exact values; the regression reference)
  and **Dark** (`#0d1226` page, AA-verified: body ≈8.8:1, soft ≈6.4:1, accent
  stepped up to `#818cf8` ≈6.2:1 because brand `#6366f1` only reaches ~4.2:1 on dark).
- `themeToCss.ts` — pure Theme → CSS-custom-property map. Alpha tiers derive from
  `colors.muted` with tokens.css's exact ratios, so Classic reproduces today's values
  *by construction*. Also `isDarkColor()` (logo/cover treatments).
- `ThemedDocument.tsx` — the entire mechanism: a wrapper div carrying the variables
  inline. It is also the PDF export node, so the engine's clone carries the theme.
  Pinning every document-consumed variable inline is also what makes documents immune
  to the chrome mode (stronger than the spec's separate-variable-names idea).
- `ThemePicker.tsx`, `DocumentAppearanceSection.tsx` — the shared "Appearance" form
  card (theme dropdown + cover checkbox) in both tools.
- `themeStorage.ts` — localStorage CRUD under `bf-themes:<id>`, JSON export/import
  (all-or-nothing validation), `useCustomThemes()` live hook, `resolveTheme()` with
  deleted-theme → Classic fallback (inline note in the form, never a crash).
- `CoverPage.tsx` — document-type-agnostic (label/title/clientName/date props, never
  imports ProposalData/AuditData). Exactly 816×1056 border-box, so the paginator's
  first natural cut lands precisely on its bottom edge — the firm one-page break needs
  no engine special-casing. Full-bleed = theme background + gradient washes; off =
  restrained paper. `contrast.ts` — WCAG math for the editor.

**Theme editor** — `src/components/internal-tools/theme-editor/` +
`src/app/internal/(protected)/theme-editor/page.tsx`, hub tile "Document Themes"
(a **new** tile — the three "coming soon" tiles are reserved roadmap tools and were
not consumed), and a "Themes" entry in the shared `InternalHeader` nav. Start-from
dropdown, required name, four color-picker+hex pairs (invalid hex never touches a
style), three informational AA contrast lines (warn, never block), curated font
dropdowns, full-bleed toggle, live preview (CoverPage + fixed placeholder sample sheet
through the real ThemedDocument path), save/export/import/delete with confirms.

**Template system** — `src/components/internal-tools/templates/`
- `templateTypes.ts` — `DocumentTemplate` + strict whitelist validation of
  `defaultContent` per document type (unknown fields reject the whole file).
- `builtInTemplates.ts` — the five: Proposal **Standard** / **Retainer** /
  **Dark Pitch**, Audit **Full Site Audit** (six categories × one placeholder finding)
  / **Local SEO Snapshot** (GBP + on-page). Bracketed placeholders only.
- `templateStorage.ts` — `bf-doc-templates:<id>` keys, export/import,
  `applyProposalTemplate`/`applyAuditTemplate` (deep copy, **every item id
  regenerated**, mount-assigned document identity preserved), capture helpers (ids
  stripped at capture).
- `TemplateChooser.tsx` — opens on entry to both tools: Blank first, badged built-ins,
  then customs with inline Rename / Export / Delete (confirmed) / Import. Escape =
  blank. `SaveTemplateDialog.tsx` — "Save as template" (toolbar of both tools):
  name + description, explicit second-click overwrite.

**App-chrome light mode** — `ChromeModeToggle.tsx` (hub switch, keyboard-operable),
pre-paint restore script in the `(protected)` layout, and a
`html[data-bf-chrome='light']` block in `tokens.css`. See deviations below.

**Touched existing files (all additive):** both `types.ts` (+`themeId`,
`+includeCoverPage`), both `defaults.ts`, both ToolApp components (theme resolution,
cover, chooser, save-as-template, reducer cases), both Form components (Appearance
card mount), `AuditDocument.module.css` (callout border-image → var with identical
literal fallback), both document roots (+`data-pdf-document` attribute),
`generateDocumentPdf.ts` (optional `backgroundColor`, strips preview chrome from
`data-pdf-document` sheets, bakes CSS image filters into pixels — html2canvas ignores
`filter`, which would otherwise silently drop the white-logo treatment from dark PDFs),
`InternalShell.module.css` (header/footer literals → vars with identical fallbacks),
hub page + header nav.

## Deviations from the spec (repo reality won)

- **The documents never read `--bf-color-bg`** — they read the paper palette
  (`--bf-paper-*`) plus accent/gradients/fonts. The theme layer overrides exactly the
  eleven variables the document CSS actually consumes (inventory in DISCOVERY.md).
- **The chrome is already dark**, so "app-chrome dark mode" became a **light-chrome
  option**: default (`bf-app-dark-mode` absent/true) is today's look; the hub switch
  flips `html[data-bf-chrome='light']`, which re-values the existing chrome variables.
  Documents are insulated by ThemedDocument's inline pinning — verified: preview vars
  and exported PDFs identical in both chrome modes.
- The audit severity palette stays **theme-independent by design** (semantic color =
  meaning, not brand). Badges are self-contained light chips and were verified legible
  on the Dark theme in an actual exported PDF.
- Spec's `Theme.colors` gained one **optional** field: `gradient` (three hexes) so the
  built-ins can carry the exact brand tri-color keyline. Custom themes without it get
  an accent-derived gradient; the editor keeps the base theme's gradient until you
  change the accent, then switches to derived. Import validation accepts both shapes.
- The hub had no theme-ish "coming soon" tile to replace, so the editor got a new one.

## Decisions made without asking

- `includeCoverPage` default **true** (the spec conflict, argued above).
- Dark covers/documents render the logo as a **white knockout** (`brightness(0)
  invert(1)`) — the real asset is dark-indigo-on-transparent and vanishes on dark.
  The PDF engine bakes the filter into pixels since html2canvas ignores it.
- Cover contents: eyebrow label ("Proposal" / "Site Audit Report"), title (audit uses
  the site URL — it's the audit document's own title), "Prepared for {client}", date,
  bottom keyline + "ByteFlow Solutions · Akron, Ohio".
- Theme editor: saving under an existing custom name overwrites **that theme's id**
  after confirm (that's what makes edits propagate to documents); built-in names are
  reserved; imports colliding with an existing custom id/name confirm-then-replace
  under the existing id.
- Template chooser opens on every tool visit (every visit is a new document — there's
  still no draft persistence). Escape or "Blank" gets you the old flow in one action.
- Light-chrome accent tints step down to darker brand tones (`#4f46e5`/`#7c3aed`/
  `#0e7490`) — the soft tints fail contrast as text on light ground.
- QA themes/templates created during testing were cleaned out of localStorage; the
  browser profile used was headless-temporary anyway.

## Incident: the dev server on :3000

A dev server (yours, presumably) was running when the night started; I QA'd against
it (it hot-reloads the working tree — which is this branch). During Gate 7 the
production build ran in a **separate detached git worktree** precisely to avoid the
known build-vs-dev `.next` interference — but the dev server still died around the
time of the prod-server teardown (likely the shared `node_modules` symlink trick, or
a `pkill` pattern that matched more than intended — exact cause unproven). **I
restarted it** (`npm run dev`, logs at the session scratchpad `dev-server.log`) and
re-verified the full regression suite on the fresh server: ALL EQUAL. If your terminal
shows a dead `npm run dev` from yesterday, that's what happened — the running server
is healthy, just not attached to your terminal. Next full build: safest is stopping
the dev server first, as before.

## QA actually performed (headless Chromium, ~110 checks across the night)

- **Gate 2**: baseline determinism (two independent captures identical), then
  post-wrapper captures — 6/6 identical.
- **Gate 3**: classic unchanged (6/6) + dark flips preview AND PDF in both tools +
  dark→classic returns to exact baseline + dark page fill (no light strips) + white
  logo verified in exported PDF pixels.
- **Gate 4** (14/14): cover-off still baseline-identical; cover adds exactly one page
  on 2-page and 5-page documents; band-structure proofs (content bands equal count,
  edges ≤3px) show every band moves one page whole — nothing shares the cover page,
  nothing lost at cuts; dark full-bleed cover inspected in the exported file.
- **Gate 5** (23/23): editor lifecycle — live hex application/rejection, contrast
  warn/clear, save→storage, custom theme in tools, overwrite propagation by id,
  export round-trip, malformed + non-JSON imports rejected with nothing written,
  cross-tab delete → Classic fallback + inline note, tab order.
- **Gate 6** (32/32): all five built-ins open and export; Dark Pitch is dark with
  cover; Full Audit seeds 1×6 categories, Local SEO seeds 3; save-as-template
  round-trip; no live ids stored; document edits never touch the template;
  rename/export/delete/import; malformed and wrong-type imports rejected; Escape=blank.
- **Gate 7** (20/20 + build): the classic default regression re-run (the most
  important check — see top); default cover +1 page; a custom theme's background
  verified **in exported PDF pixels**; chrome toggle keyboard-operated, persists,
  flips chrome vars, leaves document vars and exports untouched; robots.txt disallows
  `/internal` (prefix-covers `/internal/theme-editor`); unauthenticated theme-editor
  redirects to login (dev + prod); production build clean, prod-mode login → editor →
  chooser → Dark Pitch all verified on :3100.

## Known limitations

- Custom themes/templates are **per-browser localStorage** — export/import JSON is the
  portability story (as spec'd). A wiped profile loses unexported customs.
- PDFs remain rasterized (no selectable text) — unchanged, pre-existing tradeoff.
- Cross-page-shift PDF comparisons show sub-pixel glyph anti-aliasing jitter
  (html2canvas rasterization at shifted canvas offsets). Invisible at any human zoom;
  the strict zero-diff bar holds on the unshifted regression path.
- A very long cover title will clip at the sheet edge (fixed-height page, by design).
- The severity palette doesn't adapt to extreme custom themes (e.g. a red background
  will clash with the critical-red accents) — the contrast warnings in the editor are
  the guardrail; a per-severity theme audit is not built.
- The chooser reappears on every visit; with draft persistence (still deferred) it
  should only appear for genuinely-new documents.
- Next dev overlay once showed a transient "1 issue" badge during hot-reload-heavy QA;
  not reproducible on fresh loads — zero console/page errors, clean build.

## Deferred (flag-don't-build, per spec)

Block-based document builder; section reordering / per-block color overrides;
server-side (selectable-text) PDF rendering; per-section layout variants; draft
persistence (would fix the chooser-every-visit nit); linking saved documents to CRM
activities; folding the proposal page onto `getServiceOptions()`; the standing
pre-phase items (committed `sendgrid.env` key rotation — still urgent, mangled
`.gitignore` line, stale `lint.json`).

## Check first in the morning

1. **The classic-default regression**: open Proposals → Blank → uncheck "Include cover
   page" → fill anything → export. It must look exactly like yesterday's output. (The
   automated proof already says it does — confirm it in your own browser once.)
2. **Dark-theme contrast in an actual exported PDF**: New proposal → Dark Pitch →
   fill → Download PDF → **open the file** and read it at print size. Rasterized color
   can differ subtly from the browser — the file, not the preview, is the truth.
   Automated checks verified pixel colors; your eyes verify "sendable."
3. If the CRM/Budgets look off: the dev server was restarted overnight (incident note
   above) — reload once; the Supabase-backed tools were untouched by this phase.
