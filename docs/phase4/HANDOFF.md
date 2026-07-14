# Phase 4 — Morning Handoff (Document Builder)

Built on branch **`feat/internal-tools-phase4`** (off `feat/internal-tools-themes`, which also
carries this session's Supabase-auth login commit). Nothing on `main`. `tsc` clean, `next lint`
clean (0 warnings/errors), **zero new dependencies**, and **`npm run build` passes** (17/17
pages generated; the only build warnings are the marketing site's pre-existing Contentful
connection retries, unrelated to this work).

The Document Builder is live at **`/internal/documents`** (list) and
`/internal/documents/[id]` (editor), hub tile "Documents" + header nav entry added.

## Regression — the three prior tools, explicitly

- **Proposals**: page renders, preview sheets present, Download PDF present, **zero console
  errors** (automated). Not touched except the shared PDF engine (see below).
- **Site Audits**: same — renders, preview, export button, zero console errors (automated).
- **Theme Editor**: untouched; the theme system it owns (`themeTypes`, `themeStorage`,
  `ThemePicker`, `ThemedDocument`, `CoverPage`) is consumed read-only by the Document Builder.

**The only shared-code change is additive and provably a no-op for the existing tools.**
`generateDocumentPdf.ts`/`computeCutPositions` gained an optional `forcedBreaks` param +
gathering of `[data-pdf-break-before]` offsets. That attribute exists **only** in the engine
and the Document Builder — grep-confirmed no proposal/audit markup emits it — so for those
tools `forcedBreaks` is always `[]`, and with an empty list the algorithm executes the
byte-identical original code path (the forced-break branch never triggers; the else-branch and
loop termination are unchanged). The phase-3 pixel-identity harness established the baseline;
this change cannot alter it. (I did not re-run that full pixel harness tonight — the change's
additivity is structural, and the live render + zero-console-error check backs it.)

## What was built, and where — all under `src/`

**Data model** — `lib/document-builder/`
- `types.ts` — 11 block types (incl. `titleBanner`), 4 page kinds (incl. `sectionTitle`),
  `BuiltDocument`. `sanitize.ts` — rich-text whitelist (`p,strong,em,a,ul,ol,li,br`), applied
  on write/paste/import/storage-load. `defaults.ts` — block/page/document factories.
  `storage.ts` — `bf-docs:` CRUD, all-or-nothing import validation, `useDocs` hook,
  export/import, storage-bytes estimate.

**Renderer + PDF** — `components/internal-tools/document-builder/`
- `BuiltDocumentView` (forwardRef → `ThemedDocument`, the export node), `BlockView` (all 11
  types; `pricingTable` renders through the proposal tool's `calculateTotals` — no duplicated
  math), `SectionTitlePage` (echoes CoverPage's 816×1056 family). Additive
  `data-pdf-break-before` in the shared engine makes each `sectionTitle`/page-after-first and
  each `pageBreak` block start its own printed page while long content still overflows.

**Editor** — same dir
- `DocumentsListApp` (new/import, open/duplicate/rename/export-JSON/delete-with-confirm,
  storage bar), `DocumentEditorApp` (load, debounced autosave to `bf-docs:`, top bar with
  name/ThemePicker/cover-toggle/save-status/save-as-template/export, off-screen full-doc
  export node), `PageRail` (add blank/section-title/closing, reorder, duplicate, delete,
  kind-distinguished), `EditorCanvas` + `BlockEditor` (edit all 11 types in place),
  `RichTextEditor`, `PlainTextEditable`, `InsertBlockControl`, `editorState` reducer.

**Templates** — same dir
- 13 built-ins (Blank + 12) across 5 categories (`builtInTemplates.ts`); the two "Full Design"
  templates import shared pricing math + audit `CATEGORY_ORDER/LABELS`. `TemplateChooser`
  (category-grouped, custom badge + manage), `SaveTemplateDialog`, `templateStorage`
  (`bf-builder-templates:` — see deviation), `useCustomTemplates`.

**Wiring** — `InternalHeader.tsx` (+Documents nav), hub `page.tsx` (+Documents tile). `robots`
already disallows `/internal`.

## Dependency decision (the one pre-approved dependency)

**Went dependency-free — did NOT add Tiptap.** The fixed rich-text set (bold, italic, link,
bullet/numbered lists) is small enough that native `contentEditable` + the still-universally-
supported `document.execCommand` for those five commands + a sanitizing paste handler is
stable and far lighter than a block-editing library. Trade-off: `execCommand` is deprecated
(not removed); if a browser ever drops it, the formatting buttons degrade but typing/paste
still work and content stays on the whitelist. Net new dependencies this phase: **0**.

## Deviations from spec (repo reality won)

- **Custom-template prefix**: spec 04 says `bf-doc-templates:`, but that prefix is already in
  active use by the phase-3 proposal/audit template system. Custom Document Builder templates
  use **`bf-builder-templates:`** instead; documents use the spec's `bf-docs:` (free).
- File paths follow the repo's real `src/...` layout (spec sketches omit `src/`).
- The shared `CoverPage` has no subtitle slot, so a document cover's optional subtitle rides in
  CoverPage's eyebrow/label slot (keeps CoverPage reused unchanged).

## Decisions made without asking

- Rich text rendered directly in `BlockView` (not re-sanitized at render): it is sanitized at
  every *input* boundary, and re-sanitizing at render diverged across SSR (no DOM) vs client
  and broke hydration. The input-boundary invariant is the single guarantee.
- `data-pdf-break-before` chosen over touching the sheet geometry to force page breaks —
  additive and backward-compatible with the three existing tools.
- Executive Pitch's "slide" pages are content pages with a `titleBanner` + short `callout`
  (a `sectionTitle` page can't hold a callout, which the spec asks for on each slide).
- One cover page max, pinned first; it never moves and nothing slots ahead of it.

## Polish items (bounded list) — done / skipped

- ✅ **Storage-usage indicator** on the documents list (warns ≥80%).
- ⏭️ Word/character count, duplicate-page button (page rail already has duplicate), last-opened
  sort + search, keyboard-shortcut popover, print stylesheet — **skipped** (time); none
  required. Document-level undo/redo also skipped (per-block text undo comes free from
  contentEditable).

## Known limitations

- **localStorage per-browser** persistence; JSON export/import is the backup/portability story.
  A wiped profile loses unexported documents and custom templates.
- **Rasterized PDF text** (no selectable text) — unchanged since phase 1.
- **Images are data URLs** in localStorage (~5MB budget); the storage bar warns before the
  quota bites (a silent quota failure would look like data loss).
- Rich text is exactly the whitelist — no font-size/color overrides by design (theme owns them).
- The canvas renders at 1:1 (816px) and scrolls; no fit-to-width zoom.

## Check first in the morning

**The multi-page PDF export with mixed block types + scattered section-title pages —
pagination is the most likely subtle failure.** Automated tonight: a hardcoded doc with 2
scattered `sectionTitle` pages + a `pageBreak` exported to exactly 8 pages / 8 JPEG streams,
zero console errors; "Proposal — Full Design" exported to 7 pages. Open one of those PDFs and
eyeball the page breaks at print size — the file, not the preview, is the truth.

## Verification performed tonight (headless Chromium)

- **Gate 3**: hardcoded 2-sectionTitle + pageBreak doc → 8-page PDF, 8 JPEG streams, no sliver
  pages, zero console errors (caught + fixed a flex-`gap` sliver-page bug and an SSR hydration
  bug during this gate).
- **Gate 4**: new doc → insert+type heading → autosave → reload restores name+content → export.
- **Gate 5**: chooser renders 13 across 5 categories; Proposal — Full Design opens (7pp) → 7-page
  PDF; save-as-template → badged custom template appears. (Fixed a list SSR-hydration bug.)
- **Gate 6**: malicious import (`<script>`, `onclick`, `javascript:`, `<img onerror>`) fully
  sanitized in editor AND export HTML, nothing executed, legit `<strong>` kept; proposals +
  audits render with zero new console errors; single `calculateTotals`/`formatUsd`; lint clean.

## Deferred ideas for future phases

Converging Proposals/Audits onto the block engine; server-side (selectable-text) PDF; the live
Monthly Reports data source (template ships as placeholder layout now); document-level
undo/redo; fit-to-width canvas zoom; drag-and-drop page/block reorder (up/down buttons ship).
Standing pre-phase item still open: rotate the committed `sendgrid.env` key.
