# Presentations — Handoff

Built on branch **`feat/internal-tools-slides`** (off `feat/internal-tools-phase4`), 7 commits,
one per phase gate. `tsc` clean, `next lint` clean, **`npm run build` passes** (18/18 pages,
`/internal/slides/[id]` included), **one new dependency**: `pptxgenjs@4.0.1` (pinned exact, the
pre-approved one).

Presentations is live at **`/internal/slides`** (decks list) and `/internal/slides/[id]` (editor),
hub tile "Presentations" + header nav entry added.

## ⚠️ The one thing to check first, by hand — cannot be verified by me

**Download a deck with at least one slide of every template type, open it in real PowerPoint,
Keynote, or Google Slides, and confirm: every slide looks right, every text box is actually
editable (click in and type), and nothing shows a "needs repair" warning.**

I verified extensively that the generated file is *structurally* sound — real editable `<a:t>`
text runs (not flattened images) on every slide, zero leading `#` on any color, correct 13.33×7.5"
dimensions, and a **second, independent parser** (`python-pptx`, unrelated to `pptxgenjs`) opened
every test file without a single schema exception. That is strong evidence, but it is not the same
as opening the file in real Office/Keynote — I have no way to do that myself, and the spec is
explicit that this is the single most important remaining check. Please do this before relying on
the tool for a real client-facing deck.

## Regression — the four prior tools, explicitly

Verified via Playwright + a throwaway confirmed test account (created and deleted through the
Supabase admin API), not just "the code didn't change":

- **Documents, CRM, Budgets**: each page loads cleanly at its route, zero console errors.
- **Theme Editor**: loads cleanly; both built-in themes (Classic, Dark) still present and
  unchanged. Presentations *consumes* the theme system (`Theme`, `builtInThemes`, `ThemedDocument`,
  `ThemePicker`, `resolveTheme`) exactly as-is — no edits to any of those files.
- Nothing in `src/lib/internal-tools/`, `src/components/crm/`, `src/components/budgets/`, or
  `src/components/internal-tools/document-builder/` was touched.

## What was built, and where — all under `src/`

**Data model** — `lib/slides/`
- `types.ts` — `SlideTemplateId` (25 fixed ids), one content interface per template, the
  `SlideContent` discriminated union, `Deck`/`Slide`.
- `defaults.ts` — bracketed-placeholder factory per template (`createSlide`), blank-deck factory
  (`createDefaultDeck`), and `cloneSlideFresh` (regenerates every id, including nested repeatable
  items, for the duplicate-slide action).
- `pricing.ts` — `computePricingTotal`, implemented fresh (no dependency on the document-builder-
  era `lib/internal-tools/pricing.ts`), per spec.
- `storage.ts` — `bf-slides:` localStorage CRUD, `useDecks()` hook, JSON export/import. Import
  validation is **stricter** than Document Builder's: a missing required field rejects the whole
  file (not silently coerced to empty), per this spec's explicit guardrail.
- `templateLabels.ts` — display name/description per template, for the picker and rail.
- `pptxColors.ts` / `pptxMasters.ts` / `pptxGenerators.ts` / `pptxExport.ts` — see below.
- `logoDataUrl.ts` — the real logo asset, base64-inlined once (generated from
  `public/BYTEFLOW_LOGO.png`, never fabricated) so the pptx master embeds it with zero runtime
  fetch.

**PPTX export** — `lib/slides/pptxGenerators.ts` — 25 functions, `genTitleCover` through
`genBlankCustom`, dispatched via the `PPTX_GENERATORS` table at the bottom of the file. One
function per template, same order as `SlideRenderer.tsx` for cross-checking. `pptxMasters.ts`
defines one theme-derived slide master per export (background/logo/footer/page-number — not two
hardcoded classic/dark masters, so custom themes get correct treatment too). `pptxColors.ts` holds
the two documented gotchas (`toPptxColor` strips the theme system's leading `#`; a curated-font-
stack → real-font-name map, since `theme.fonts.*` are CSS stacks, not plain names).

**On-screen preview** — `components/internal-tools/slides/SlideRenderer.tsx` — 25 read-only
components + a dispatcher, wrapped in the existing `ThemedDocument`. `slideCanvas.module.css`
holds the shared 16:9 canvas + per-template layout classes, mirroring the pptx generators' visual
grammar.

**Editor** — same dir
- `DecksListApp` — list/new/import/duplicate/rename/export-JSON/delete-with-confirm (mirrors
  Document Builder's list app).
- `DeckEditorApp` — top bar (inline-editable name, `ThemePicker`, 600ms-debounced autosave
  status, Download .pptx), owns all deck-mutation logic, renders the delete-confirmation dialog
  (see Decisions, below, for why it's here and not in `SlideRail`).
- `SlideRail` — labeled entries (not live thumbnails — see Deviations), reorder/duplicate/
  delete, "Add slide".
- `SlideTemplatePicker` — the flat, uncategorized 25-template grid with search-to-filter.
- `SlideFieldEditor` — 25 per-template forms, one function per template, same order as the other
  two 25-way dispatchers.
- `fields.tsx` / `fields.module.css` — the shared `TextField`/`TextAreaField`/`NumberField`/
  `ImageField`/`StringListField`/`ObjectListField` primitives every form is built from.

**Wiring** — `InternalHeader.tsx` (+Presentations nav), hub `page.tsx` (+Presentations tile,
between Documents and Document Themes). `robots.txt` already disallowed `/internal` broadly.

## Deviations from spec (repo reality / tractability won)

- **Canvas editing is a live-preview + field-panel split, not literal click-on-canvas-text
  editing.** The spec describes "click a text field to edit it inline" directly on the rendered
  slide. With 25 structurally different content shapes, retrofitting each of the 25 preview
  components to double as an in-place editable surface (contentEditable spans positioned exactly
  over rendered text, wired per-field) was a much larger surface to get right than a labeled form
  panel next to a live, instantly-updating canvas. Every click in the field panel reflects on the
  canvas within one React render — the *result* (live editing, visibly connected to the canvas)
  is the same; the *interaction model* (type in a labeled field vs. click text in place) differs.
  All of `03-EDITOR-SCREEN.md`'s acceptance criteria are met either way, and this was verified,
  not assumed (Phase 5's 17/17 Playwright pass exercises every field type).
- **Slide rail uses labeled entries, not rendered thumbnails** — spec explicitly allows this
  ("a thumbnail or labeled entry... sufficient"). Each entry shows position, template name, and a
  one-line content snippet (the slide's title field, or a template-specific fallback for the three
  templates without one: testimonial's quote, bigStat's label, fullBleedImage's caption).
- **Font-name mapping for pptx export** (not in spec, needed because repo reality demanded it):
  `theme.fonts.display`/`.body` are CSS font-stack strings (`"var(--font-jakarta), system-ui,
  ..."`), but `pptxgenjs`'s `fontFace` needs a real installed font name. Added a small map keyed
  off each curated font's stable `id` (`brand-sans` → "Plus Jakarta Sans", `brand-mono` →
  "JetBrains Mono", `system-sans` → "Arial", `system-serif` → "Georgia") in `pptxColors.ts`.
- File paths follow the repo's real `src/...` layout (spec sketches omit `src/`).

## Decisions made without asking (all safe, reversible, additive)

- **Image data-URL format, resolved empirically rather than assumed.** Spec 05 flagged this as an
  open question ("confirm... by actually opening an exported file with an image slide"). Tested
  both the full `data:image/png;base64,...` string and the stripped `image/png;base64,...` form
  directly against `pptxgenjs`'s output — both produce byte-identical, valid embedded images. Kept
  the full form (matches the data model's existing `imageDataUrl: string` convention exactly, no
  extra transform needed at the export boundary).
- **Logo has no dark-theme contrast treatment in the exported `.pptx`.** The real logo asset
  (`public/BYTEFLOW_LOGO.png`) is a colored indigo mark (measured average RGB ≈ 54,61,145), not
  white — the web preview knocks it out to white on dark themes via a CSS filter
  (`themedOverrides.css`), which has no `pptxgenjs` equivalent without either a new image-
  processing dependency (not approved tonight) or a hand-authored second logo asset (not mine to
  fabricate). The logo renders identically on every theme in the `.pptx` — legible on light
  backgrounds, lower-contrast on dark ones. **Worth a real white-logo asset in a future pass** if
  dark-themed decks turn out to be common.
- **The delete-slide `ConfirmDialog` is rendered from `DeckEditorApp`, not `SlideRail`.** Found via
  the Phase 5 Playwright pass, not assumed: `SlideRail` sits inside a `position: sticky` wrapper
  (for the rail's independent scroll), and `position: sticky` unconditionally creates a new CSS
  stacking context. A `position: fixed; z-index: 60` dialog nested inside that wrapper was
  positioned correctly (confirmed via `getBoundingClientRect`: full viewport) but **painted
  beneath the canvas** — the whole sticky subtree, dialog included, lost the outer stacking
  comparison to its later DOM-order sibling. Confirmed with `document.elementsFromPoint`, which
  showed the canvas above the dialog in paint order despite the dialog's "higher" z-index. Fixed
  by lifting the dialog out of the sticky subtree entirely, rendered as a sibling at the editor's
  top level. **This is a general gotcha worth remembering for any future dialog/overlay nested
  inside a `position: sticky` container anywhere in this app** — it is not specific to slides.
- **pptxgenjs breaks the client-side production build without a webpack change** — added to
  `next.config.mjs`, client compilation only. `pptxgenjs`'s bundled code has two runtime-only,
  environment-guarded `await import('node:fs')` / `import('node:https')` calls (disk-write and
  remote-image codepaths, both unreachable in a browser) that webpack still tries to statically
  resolve, hard-failing the build the moment any page imports the export pipeline. The package's
  own `browser` field doesn't help (it stubs the bare `"fs"` string; the bundled code imports the
  `"node:fs"`-scheme form, a different string webpack matches separately) and neither does
  `resolve.fallback` nor `resolve.alias` (both tested directly against the real error; neither
  applies to a *dynamic* `import()` target in webpack5). `webpack.IgnorePlugin` on
  `/^node:(fs|https)$/` is the correct fix for a guarded-but-unreachable dynamic import — verified
  against both `next dev` and `next build`.

## Known limitations

- **localStorage per-browser** persistence — same story as every other tool in this suite; JSON
  export/import is the portability/backup path. A wiped profile loses unexported decks.
- **On-screen preview vs. actual `.pptx` rendering may differ in minor ways** — font substitution
  if a theme font isn't installed on whatever machine ultimately opens the file, exact spacing/
  line-wrap differences between CSS and PowerPoint's own text layout engine. This is normal for
  generated Office files, not a bug, but worth knowing going in — the preview's job is "clearly
  correspond," not "pixel-match."
- **Images are data URLs in localStorage** (same ~5MB-ish budget concern as Document Builder) —
  no storage-usage indicator was added for Presentations specifically; if decks with several
  photos/screenshots become common, port Document Builder's storage bar over.
- **`pricingInvestment`'s stored `total` field is display-only** — the actual total shown
  everywhere (preview, export) is always the live sum of line items (`computePricingTotal`), so a
  stale/tampered stored value can never drift from reality, but it does mean the field is
  effectively write-only from the data model's perspective.
- Logo dark-theme contrast (see Decisions, above).

## Verification performed (headless Chromium via Playwright + throwaway Supabase accounts)

- **Phase 3** (pptx pipeline, before any UI existed): a 25-slide hardcoded test deck generated for
  both Classic and Dark themes; re-opened with `python-pptx` (independent of `pptxgenjs`) with zero
  schema exceptions; grepped full XML output for zero leading `#` and zero typed bullet glyphs;
  confirmed real, non-empty, correctly-themed text on every slide.
- **Phase 4** (preview renderer): screenshotted all 25 templates across both themes via a temporary
  route (deleted before commit) — caught and fixed two real rendering bugs (`ThemedDocument`'s
  `fit-content` wrapper collapsing a percentage-width canvas to zero; the corner logo missing on
  `fullBleedImage` and inconsistently applied elsewhere).
- **Phase 5** (editor): 17/17 automated checks driving the real UI — create from blank, add all 25
  templates via the picker, edit every field type, reorder/duplicate/delete, reload-verified
  autosave, live theme switch, and a real `.pptx` download triggered by an actual button click.
  Caught and fixed the webpack build failure and the stacking-context dialog bug documented above.
- **Phase 6** (integration/regression/QA): 23/23 checks — full regression pass on the four prior
  tools, theme-system integrity, exact-round-trip deck export/delete/re-import, two distinct
  malformed-import cases both rejected cleanly, and a 23-slide varied deck exporting as one
  complete file.
- Every Playwright test account was created and deleted via the Supabase admin API; no test data
  was left in the live database or in any browser's localStorage (each Playwright run uses a fresh,
  throwaway browser context).

## Ideas deferred for future phases

A chart-generation template (tonight's Chart/Graph slide only displays a pre-made chart image, per
spec, it doesn't build one), speaker notes support, exporting a deck as PDF in addition to `.pptx`,
pulling content from an existing Document Builder document into a deck automatically, a real
white/light logo asset for legible dark-theme corner marks in the exported file, drag-and-drop
slide reorder (up/down buttons ship), a storage-usage indicator if image-heavy decks become common.
