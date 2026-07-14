# Background Designs — Discovery

Confirms what actually exists in this repo (not the mega-prompt's hedged "whichever of
these exist" framing) and the exact safe-zone geometry each integration point needs to
respect. Everything below was read directly from source, not guessed.

## What exists today

The proposal/audit tools referenced by the mega prompt's framing **no longer exist** —
they were deleted in an earlier consolidation pass this session (`docs/phase4/HANDOFF.md`).
Two real tools remain, both theme-aware, both with cover/title-style surfaces:

1. **Document Builder** (`/internal/documents`) — a `BuiltDocument` is a list of typed
   `DocumentPage`s. Two page kinds are cover/title-style:
   - `kind: 'cover'` — rendered by the shared `CoverPage` component
     (`src/components/internal-tools/themes/CoverPage.tsx`), the same component every
     themed document opens with.
   - `kind: 'sectionTitle'` — rendered by `SectionTitlePage`
     (`src/components/internal-tools/document-builder/SectionTitlePage.tsx`), a repeatable
     section-break page reusing `CoverPage`'s visual family.
   Both are edited live on-canvas in `EditorCanvas.tsx` (`EditableCover`/`EditableSection`)
   and rendered read-only for PDF export in `BuiltDocumentView.tsx`.

2. **Presentations** (`/internal/slides`) — a `Deck` is a list of typed `Slide`s, one of 25
   fixed `SlideTemplateId`s. The three full-bleed-eligible, title-forward templates named in
   the spec all exist: `titleCover`, `sectionDivider`, `thankYouClosing`
   (`src/lib/slides/types.ts`). Live preview: `SlideRenderer.tsx`. Field editing:
   `SlideFieldEditor.tsx`. Export: `pptxGenerators.ts`'s `genTitleCover` /
   `genSectionDivider` / `genThankYouClosing`, dispatched via `PPTX_GENERATORS` and run
   synchronously inside `pptxExport.ts`'s `buildDeckPptx`.

So both bullet points 1 and 2 from "Where this plugs in" resolve to the **same underlying
components** (`CoverPage` + `SectionTitlePage`) — there's no separate standalone "Documents
cover page" distinct from Document Builder's cover page kind anymore. Point 3 (Presentations)
is a second, independent integration surface. No "none of the above" case — proceeding with
both.

## The `Theme` type

`src/components/internal-tools/themes/themeTypes.ts`. Relevant to background designs:

```ts
colors: {
  background: string; // #rrggbb
  foreground: string; // #rrggbb
  accent: string;     // #rrggbb
  muted: string;       // #rrggbb — base for secondary text/hairlines, alpha-tiered
  gradient?: [string, string, string]; // exact 3-stop signature gradient, optional
}
```

Every design must derive its colors from these four fields only — `accent`, `gradient`
(falling back to `accent`-derived stops when absent, same convention the rest of the theme
system already uses), and `foreground`/`background` at reduced opacity. `validateTheme`
enforces strict `#rrggbb` hex, so every color read from `theme.colors` is guaranteed to be a
clean 6-digit hex string — safe to interpolate directly into SVG `fill`/`stop-color`.

## Cover-text safe zones (measured from the real CSS, not guessed)

### `CoverPage` (Document Builder `cover` kind) — `CoverPage.module.css`

- Sheet: exactly **816×1056px**, `padding: 64px` on all sides (fixed, not responsive —
  this is a print-page component).
- Logo: top-left, `width: 120px` (auto height, ~117px), inside the 64px padding — so it
  occupies roughly `x:64–184, y:64–181`.
- Text block (`.main`): vertically centered (`flex:1; justify-content:center`) inside the
  padded area, left-aligned, `.title` capped at `max-width: 600px`. With 64px padding on
  both sides, that leaves the block occupying roughly `x:64–664` (a little less once
  wrapping is accounted for) — meaning the right edge from **x:664 to x:816 is genuinely
  clear** of text at any title length, real safe territory for a corner treatment.
  Vertically, the block can span nearly the full sheet height when a title wraps to 3+
  lines, so a design should not rely on a fixed vertical gap — bias toward the top-right
  and bottom-right corners, not "the top N px."
- Footer: full-width, pinned to the bottom (`margin-top: auto`), a keyline + a date/brand
  row. Low-opacity elements safely coexist under it since text there is small (12–14px) and
  the keyline is already an opaque accent-gradient bar — but a design shouldn't paint a
  broad opaque wash across the full bottom band.
- **Safe zone summary**: left ~600–664px is were title/eyebrow/client text lives, full
  width at the very bottom carries the footer row. The top-right and (once text is short)
  bottom-right corners are the reliably clear real estate — matches the spec's own
  "center-left convention" framing exactly.

### `SectionTitlePage` (Document Builder `sectionTitle` kind) — `SectionTitlePage.module.css`

- Same **816×1056px** sheet, `padding: 64px`, but note: **no logo** is rendered here (only
  `CoverPage` shows the logo) — one less fixed element to avoid.
- Text block (`.main`): the whole block is **vertically centered** (`justify-content:
  center` on the section itself) rather than pinned to a lower-middle band like `CoverPage`
  — `max-width: 640px`, left-aligned. No footer element at all.
- **Safe zone summary**: text can appear anywhere in the vertical middle third depending on
  content length, always left-aligned within the first ~640–704px. The full right column
  (`x:704–816`) and, since there's no footer, the **entire bottom band** are clear — more
  open canvas than `CoverPage`, since there's no logo or footer to avoid.

### Presentations: `titleCover` / `sectionDivider` / `thankYouClosing` — `slideCanvas.module.css`

- Canvas: `aspect-ratio: 16/9`, intrinsic width via `--bf-slide-w` (960px default, resizes
  responsively in the editor down to 420px min — designs must be defined in *relative*
  (percentage/viewBox) terms, never fixed pixels, to stay correct at every canvas size).
  `.pad` inset is `padding: 5.5% 4.5%`.
- **`titleCover`**: text block is **left-aligned, vertically centered-ish** (flex column,
  `align-items:flex-start`) inside the padded area — eyebrow/title/subtitle stack in the
  upper-to-middle area, with an optional "Prepared for … · date" line pinned to the bottom
  via the flex container's own space. The **corner logo** sits bottom-right
  (`right:3%; bottom:4%; width:5.5%`). Safe zone: right ~35–40% of the canvas width, and
  especially the top-right corner, are clear; bottom-right is logo territory (small, already
  low-opacity at 0.9 — designs should stay clear of that exact corner or match its subtlety).
- **`sectionDivider`** / **`thankYouClosing`**: both use the identical `.centered` treatment
  — text is horizontally **and** vertically centered, `text-align:center`. This is the
  tightest safe-zone case: the *center* of the canvas is exactly where text sits, so designs
  for these three templates must bias strongly toward the **corners and edges**, leaving the
  middle 50–60% of the canvas clear. Same bottom-right logo as `titleCover`.

**Cross-cutting rule taken from the above**: every one of the 20 designs needs to work
across a left-aligned-text layout (`CoverPage`, `SectionTitlePage`, `titleCover`) *and* a
fully-centered-text layout (`sectionDivider`, `thankYouClosing`). Concretely this means: no
design may place meaningful opacity in the dead center of the canvas, and corner/edge-biased
treatments (which is 17 of the 20 in the catalog anyway) are inherently safe for both; the
two full-page textures (`Diagonal Grid`, `Dot Matrix`, `Blueprint Grid`, `Pixel Grid`,
`Binary Fade` — five, not two) need their opacity floor checked hardest since they touch the
center by definition. `Binary Fade` is explicitly specified to fade toward center already;
the grid/dot ones will be kept at the low end of the spec's 4–18% range precisely because
they can't avoid the center.

## Data-storage plan

- `CoverFields` and `SectionTitleFields` (`src/lib/document-builder/types.ts`) each get one
  new optional field: `backgroundDesignId?: string`. Independent of `themeId` (stored on the
  parent `BuiltDocument`), exactly as the guardrails require — a cover and a section-title
  page three pages later can carry different designs.
- `TitleCoverContent`, `SectionDividerContent`, `ThankYouClosingContent`
  (`src/lib/slides/types.ts`) each get the same optional `backgroundDesignId?: string`.
- No changes anywhere to `Theme`, `themeTypes.ts`, `tokens.css`, the theme editor, or the
  theme-JSON guide/skill — verified by construction (the new field lives on content/page
  types, never on `Theme`).

## Rendering + export plumbing to reuse

- **Live preview / PDF path**: both `CoverPage`/`SectionTitlePage` and the three slide
  render functions in `SlideRenderer.tsx` are plain React components already wrapped in
  `ThemedDocument` — a `BackgroundLayer` absolutely-positioned behind the existing content,
  `z-index` below the `.top/.main/.footer` (`z-index:1`) elements on the document side and
  below `.pad`'s content on the slide side, is a drop-in addition with no restructuring.
- **PPTX path**: `pptxExport.ts`'s `buildDeckPptx` currently loops over
  `PPTX_GENERATORS[slide.templateId](pptx, slide, theme)` **synchronously**. Rasterization
  (`canvas`/`Image`, both async) means this loop needs to pre-rasterize needed backgrounds
  before the loop (or become an async loop) — planned for Phase 5. Slide canvas is
  `13.33in × 7.5in` (`SLIDE_W`/`SLIDE_H` in `pptxMasters.ts`) — background images will be
  rasterized at a matching pixel size (e.g. 1600×900) for a crisp full-bleed embed via
  `pSlide.addImage()`, added first so it paints behind every subsequent text/shape call.

## Conclusion

Both integration points from the spec are real and confirmed. Proceeding to Phase 2 (data
model + registry) against this plan; no scope reduction needed.
