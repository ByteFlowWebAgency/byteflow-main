# Background Designs — Handoff

Feature branch: `feat/internal-tools-background-designs`. All 7 phase gates complete, each
committed separately, repo builds clean (`npm run build`) and typechecks clean
(`npx tsc --noEmit`) at every commit.

**Update (post-handoff, same branch):** the original mega prompt scoped background designs
(and, per a follow-up request, theme overrides) to just the 5 title-forward cover/title
surfaces. A direct follow-up request expanded both to **every** Document Builder page kind
(cover/sectionTitle/content/closing) and **every** one of the 25 Presentation slide
templates, plus added a `/internal/backgrounds` gallery page and a per-page/per-slide theme
override (independent of backgroundDesignId — a page/slide can override its theme, its
background design, both, or neither). The architecture notes below (data model, rendering,
PPTX) describe the file layout as of that expansion, not the original narrower version —
see the commit history on this branch for the exact sequence if you need the intermediate
state.

## What got wired up

Per `DISCOVERY.md`, the proposal/audit tools the mega prompt hedged about no longer exist
(deleted in an earlier consolidation pass). Two real tools existed and both got wired up —
no "nothing to attach to" case:

- **Document Builder** (`/internal/documents`) — `CoverPage` (the `cover` page kind) and
  `SectionTitlePage` (the `sectionTitle` page kind), both used by the live editor
  (`EditorCanvas.tsx`), the read-only PDF/preview export source (`BuiltDocumentView.tsx`),
  and by extension the html2canvas-based PDF preview/export path — all three share the same
  two components, so wiring `BackgroundLayer` into `CoverPage`/`SectionTitlePage` once
  covered every render target automatically. The picker lives per-page in the editor
  canvas's own toolbar (not the document-level top bar next to the theme picker), since a
  document can want a different design on its cover than on a section-title page three
  pages later — confirmed in testing that switching pages doesn't cross-contaminate the
  choice.
- **Presentations** (`/internal/slides`) — the three full-bleed-eligible templates named in
  the spec: `titleCover`, `sectionDivider`, `thankYouClosing`. `SlideRenderer.tsx` threads
  `theme` into just those three render functions (every other template's signature is
  untouched); the picker was added to those three templates' field-editor forms only.
  PPTX export (`pptxGenerators.ts` / `pptxExport.ts`) embeds the rasterized design as a
  full-bleed background image on the same three templates.

## Regression confirmation

Every surface renders through `BackgroundLayer`, which returns `null` when
`backgroundDesignId` is unset — by construction, nothing else about the existing markup or
CSS changed. Confirmed visually, not just by reading the code: screenshotted a cover page,
switched a background design on and back off, and the "back to None" screenshot is visually
identical to the pre-selection baseline on both Document Builder and Presentations. Also
confirmed a plain `bulletList` slide (a template with no `backgroundDesignId` field at all)
carries zero image shapes in an exported `.pptx` alongside sibling slides that do.

## Legibility spot-check (5 of 20, short + long titles)

Tested on Presentations' `titleCover` (the tightest real layout: left-aligned text with a
tall stack when eyebrow+title+subtitle all wrap) at both a short title ("Q3 Partnership
Update") and a long, realistically wrappy one ("A Comprehensive Strategic Digital
Transformation and Modernization Proposal for Enterprise Clients", which wraps to 3 lines):

| Design | Category | Result |
|---|---|---|
| Corner Orbs (Top Right) | corner-orb style | Clear at both lengths — orb sits fully right of even the widest wrapped line. |
| Dot Matrix | full-page texture | Clear at both lengths — texture reads as paper grain, never fights the bold title color. |
| Radial Center Glow | glow (worst case: literally centered) | Clear at both lengths — its low opacity (0.07 peak) plus the title's bold accent color and drop-shadow-free flat rendering kept contrast comfortable even with the glow directly behind 3 lines of text. |
| Wave Sweep | line-based | Clear at both lengths — confined to the lower third, below the tallest 3-line wrap. |
| Minimal Corner Mark | minimal | Trivially clear — a single small dot in the far corner. |

No design needed simplification to pass this check — the opacity ranges chosen in Phase 2
(4–18%, higher only for corner-confined accents) held up under real, realistic text without
any adjustment. `sectionDivider`/`thankYouClosing`'s fully-centered layout (the tightest
safe-zone case per `DISCOVERY.md`) was also spot-checked with `Concentric Rings` and `Halo
Ring` during Phase 4/6 — both stayed corner/edge-confined and never touched the centered
title.

## Independence proof

Rendered all 20 designs under Classic, Dark, and a third hand-built custom theme as a Phase
2 spot-check (`builtInThemes.ts`'s `CLASSIC_THEME`/`DARK_THEME` plus an ad hoc third theme
object), then — more rigorously — imported a genuinely new custom theme (`QA Editorial
Serif`: warm off-white background, burnt-orange
accent, serif display font) through the real `/internal/theme-editor` JSON import flow and
applied it to a live deck. `Minimal Corner Mark` recolored from indigo to terracotta with no
code changes anywhere — proving the "derives entirely from `theme.colors`" architecture
holds for arbitrary themes, not just the two it was designed alongside.

All 20 designs were also cycled through programmatically on a real `titleCover` slide (not
the Phase 2 scratch page) — every one renders a non-empty `<svg>` with zero console/page
errors.

## Known limitations

- **PPTX export has a brief async rasterization step.** A deck with a background design
  needs its SVG rasterized to a PNG (canvas + `Image`, both async) before `pptxgenjs` can
  embed it. In testing, a 3-slide deck with 3 distinct backgrounds finished the whole
  download (rasterize + embed + write) in ~150ms — not perceptible as a delay in practice.
  Designs are cached per `designId` within one export, so a deck reusing the same design
  across several slides only rasterizes it once.
- Rasterization output is fixed at ~150dpi (2000×1125px for the current 13.33×7.5in slide
  size) — crisp on a projector/screen, not intended for print-quality zoom.
- The registry-order picker list has no search/filter — fine at 20 items, would need one if
  the catalog ever grew substantially past that.

## Deferred (flagged, not built)

- A "random / surprise me" picker that picks a design automatically.
- Letting Tyrone define a 21st, fully custom design through the UI (rather than the fixed
  built-in 20) — a materially bigger feature (would need an SVG-authoring or parameterized
  UI, not just a picker), out of scope for this pass.

## Files

- `src/lib/background-designs/types.ts`, `svgHelpers.ts`, `registry.ts`, `rasterize.ts`
- `src/components/background-designs/BackgroundLayer.tsx`, `BackgroundDesignPicker.tsx`
- Modified: `CoverPage.tsx`, `SectionTitlePage.tsx`, `BuiltDocumentView.tsx`,
  `EditorCanvas.tsx` (+ `editor.module.css`) in document-builder; `SlideRenderer.tsx`,
  `SlideFieldEditor.tsx`, `fields.tsx` (+ `fields.module.css` reused, unmodified) in slides;
  `pptxGenerators.ts`, `pptxExport.ts` for the PPTX path; `types.ts`/`storage.ts` in both
  `lib/document-builder` and `lib/slides` for the new optional field + its validator.
