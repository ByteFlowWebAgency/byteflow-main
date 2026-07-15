# BYTEFLOW Internal Tools — MEGA PROMPT: Background Designs (single-file, overnight run)

You are running unattended, overnight, inside the **byteflow.us** repository. Prior runs built a
login-gated hub at `/internal` with a **theme system** (`Theme` type: colors, two fonts, a
cover-page full-bleed toggle) shared across whichever of these tools exist in this repo:
Proposals/Audits (`/internal/documents` or similar), the block-based Document Builder
(`/internal/documents`, if that's what shipped), and Presentations (`/internal/slides`). Read
the most recent `docs/*/HANDOFF.md` files FIRST to find out exactly what exists — this spec
adapts to reality, not the other way around.

**Tonight's job**: themes currently only control flat color + type. Cover-style pages (and the
title-heavy pages/slides that work like them) deserve more visual range than a solid or
full-bleed-gradient-wash background — real agency-grade collateral uses **decorative background
treatments**: corner glows, grids, orbs, geometric accents. You're adding exactly that: a
**Background Designs** layer — 20 built-in, on-brand decorative backgrounds, independent of
theme, selectable wherever a cover/title-style page already exists, that automatically recolor
themselves from whatever theme is active.

You cannot ask questions. Verify at every gate, commit per phase on a feature branch (never
`main`), never leave the repo non-building. Every existing tool must keep working, pixel-for-
pixel identical, when a page's `backgroundDesignId` is unset — this feature is 100% additive and
opt-in.

---

## HARD GUARDRAILS

- **Independent of Theme, not part of it.** Do NOT add background-design fields to the `Theme`
  JSON schema, and do NOT touch `tokens.css`, the theme editor, or the `byteflow-theme-json`
  skill's schema. A background design is a *separate* selection (default: none/solid, today's
  behavior) stored alongside `themeId` wherever cover-style content already stores it — keeping
  it decoupled means 20 designs × any number of themes "just work" without a combinatorial
  schema, and the already-shipped theme editor and theme-JSON skill stay untouched.
- **Exactly 20 designs, flat list, no categories** — see the catalog below. Ship all 20; don't
  ship more or fewer, and don't add category grouping to the picker UI.
- **Every design derives its colors entirely from the active `Theme`** — `accent`, `gradient`,
  `foreground`/`background` at reduced opacity. No hardcoded hex values anywhere in a design's
  implementation. This is what makes a design "automatically on-brand" regardless of which theme
  (built-in or custom) is chosen — verify this by rendering the same design under both "classic"
  and "dark" and confirming it recolors correctly with no manual per-theme-case code.
- **Legibility is non-negotiable.** Every design is a *background* — it sits behind title/cover
  text, never competes with it. Concretely: keep decorative elements low-opacity (roughly 4-18%
  for fills/lines, higher is acceptable only for small, corner-confined accents) and biased
  toward corners/edges, leaving a clear "safe zone" in the area cover text actually occupies
  (center-left is the established convention on this suite's cover pages — check the real
  `CoverPage` component for exact text placement and design around it, don't guess). If a design
  can't stay out of the way of real cover text at realistic content lengths, simplify it — don't
  ship something that's ever fought a real headline.
- **Zero new npm dependencies.** Everything here is achievable with SVG, CSS, and canvas
  rasterization (for the PPTX path, see below) using what's already in this repo.
- **One definition per design, two render targets — not two implementations.** Each design is
  defined ONCE as an SVG-generating function of `(theme, dimensions)`. That single definition
  renders live for on-screen preview and the DOM-based PDF export path (same as everything else
  in this suite), AND gets rasterized to a PNG data URL for the PPTX export path (pptxgenjs
  can't render arbitrary blurred SVG gradients as native shapes reliably — a background IMAGE
  layer is the robust choice there). Do not hand-build a second, divergent "PowerPoint version"
  of each design using pptxgenjs shapes — rasterize the real SVG instead, so the two outputs
  can never visually drift apart.

## Where this plugs in

Confirm in Discovery which of these actually exist, and wire into whichever do:

- **Documents' cover page** (the shared `CoverPage` component, if that's the name in this repo)
  — add a background-design picker next to the existing theme picker and cover-toggle.
- **Document Builder's `cover` and `sectionTitle` page kinds**, if that tool shipped — both are
  already full-bleed-eligible title moments; same picker pattern, stored per-page (a document can
  reasonably want a different design on its cover than on a section-title page three pages in).
- **Presentations' full-bleed-eligible slide templates**, if that tool shipped — specifically
  `titleCover`, `sectionDivider`, and `thankYouClosing` (the three templates already designed as
  title-forward, minimal-content moments). Do not add background designs to dense content
  templates (bullet lists, tables, etc.) — same legibility principle as above.
- If none of the above exist yet in this repo, stop and write that finding plainly in the
  handoff — this feature has nothing to attach to until at least one of them does.

## Data model

```ts
// lib/background-designs/types.ts
export interface BackgroundDesign {
  id: string;           // stable slug, matches the 20 ids below
  name: string;          // display name for the picker
  renderSvg(theme: Theme, width: number, height: number): string;
    // returns a complete <svg>...</svg> string sized to width/height, using ONLY theme.colors
    // values (with opacity/gradients as needed) — no hardcoded colors, ever.
}
```

- `lib/background-designs/registry.ts` — an array of all 20, in the order listed below (order is
  just registry order, not a category — the picker UI shows them as one flat, scannable list,
  same convention as the Presentations slide-template picker if that shipped).
- Wherever a cover-style page/slide's data already lives, add an optional field:
  `backgroundDesignId?: string` (undefined/omitted = today's behavior, no change). This field is
  independent of `themeId` — changing the theme re-colors the design automatically; changing the
  design swaps the pattern without touching the theme.
- `lib/background-designs/rasterize.ts` — `rasterizeBackgroundDesign(design, theme, widthPx,
  heightPx): Promise<string>` — draws the design's SVG onto an offscreen `<canvas>` (via
  `Image` + `drawImage` from a `data:image/svg+xml` source, or an SVG-to-canvas approach already
  proven to work in this browser environment) and returns a PNG data URL. Used exclusively by the
  PPTX export path.

## Rendering component

`components/background-designs/BackgroundLayer.tsx` — takes `designId` + `theme`, looks up the
design in the registry, renders its SVG absolutely-positioned behind the page/slide's real
content (`z-index` below text, `pointer-events: none`). This is the one component every
integration point above uses — no page-type-specific reimplementation.

## The 20 built-in designs

Flat list, no categories, ship all 20. Each is achievable with SVG circles/paths/gradients/blur
filters, colored entirely from `theme.colors`:

1. **Corner Orbs (Top Right)** — two soft, overlapping glow circles anchored past the top-right
   corner, radial gradient from `accent` (or `gradient[0]`) fading to transparent. The direct
   generalization of the reference that prompted this feature.
2. **Corner Orbs (Bottom Left)** — the same treatment, mirrored to the bottom-left corner.
3. **Single Corner Bleed** — one large soft circle bleeding off a single corner (configurable
   which corner, default top-right), radial gradient `accent` → transparent.
4. **Radial Center Glow** — a soft, very-low-opacity radial gradient glow centered on the page.
5. **Diagonal Grid** — a fine diagonal line grid across the full page, `foreground`/`muted` at
   very low opacity (this is a full-page texture — keep it genuinely subtle).
6. **Dot Matrix** — an evenly spaced grid of small dots, low opacity, full-page texture.
7. **Concentric Rings** — several nested thin circle outlines radiating from one corner, using
   `gradient` stops for progressively fainter rings outward.
8. **Blueprint Grid** — fine graph-paper-style grid lines, a technical/engineering feel,
   `muted` at low opacity.
9. **Diagonal Accent Band** — one soft-edged angled band of `accent` color crossing a single
   corner of the page, low opacity, feathered edges (blur or gradient-to-transparent, not a hard
   line).
10. **Gradient Mesh Wash** — a soft, irregular blob-shaped gradient wash hugging one edge of the
    page, built from 2-3 overlapping low-opacity radial gradients using `gradient` stops.
11. **Scattered Dots** — a deterministic (not random-per-render) scatter of small accent-colored
    dots across one region of the page — same scatter every time a given design+theme renders.
12. **Edge Glow (Left)** — a soft gradient glow hugging the left edge, fading toward the center.
13. **Edge Glow (Right)** — the same, mirrored to the right edge.
14. **Circuit Lines** — abstract thin connecting lines with small node circles at intersections,
    low opacity — a literal nod to this being a software agency's brand.
15. **Wave Sweep** — a single soft curved line sweeping across the lower third of the page.
16. **Split Diagonal** — the page background split diagonally into two very-close, subtly
    different tone bands (e.g. `background` and a 4-6% `accent`-tinted version of it) — barely
    perceptible, adds depth without reading as a "pattern."
17. **Halo Ring** — one large, thin ring outline, mostly bled off-canvas in a corner.
18. **Pixel Grid** — a grid of small solid squares (not lines) at low opacity — a literal visual
    pun on "byte," fitting the brand name.
19. **Binary Fade** — faint rows of `0`/`1` glyphs, very low opacity, fading to fully transparent
    toward the page center — a playful, restrained brand nod; keep opacity low enough that it
    reads as texture, not as text competing with real content.
20. **Minimal Corner Mark** — a single small accent-colored dot or short mark in one corner, the
    rest of the page left completely clear — the deliberately "quiet" option for when a design
    should barely announce itself.

## Phase gates (commit after each one)

1. **Discovery** — confirm which tools/components exist per "Where this plugs in" above; locate
   the real `Theme` type, the real `CoverPage` (and `sectionTitle`/slide-template code if
   present), and their exact cover-text safe-zone layout. Write `docs/background-designs/
   DISCOVERY.md`.
2. **Data model + registry** — `BackgroundDesign` type, all 20 implementations in the registry,
   each rendering correctly under both "classic" and "dark" themes with zero hardcoded colors.
   No UI yet. Spot-check a handful (not just one) by eye at this gate.
3. **`BackgroundLayer` component + rasterization utility** — wire the shared renderer, and prove
   the PNG rasterization path produces a correct, correctly-sized image for at least three
   different designs before moving on.
4. **Wire into every integration point found in Discovery** — a `backgroundDesignId` picker
   (default: "None" — today's plain/solid behavior) alongside each existing theme picker, at
   every location identified in "Where this plugs in." Verify each surface still renders
   identically to before when "None" is selected — this is the regression check for this phase.
5. **PPTX integration** (if Presentations exists) — the rasterized PNG becomes a full-bleed
   background image layer beneath the slide's real text/shapes in the `pptxgenjs` generator for
   `titleCover`/`sectionDivider`/`thankYouClosing`. Verify by actually opening an exported file.
6. **QA pass** (below).
7. **Handoff** — `docs/background-designs/HANDOFF.md`.

## QA

- All 20 designs render correctly, on-brand, under both "classic" and "dark" (recolor themselves
  correctly, no hardcoded colors slipping through — grep the registry for hex literals as a
  final check; there should be none).
- Every integration point found in Discovery: selecting each of the 20 updates the live preview
  immediately; exporting (PDF and/or PPTX, whichever apply) reflects the chosen design correctly.
- Regression: every surface with `backgroundDesignId` unset/"None" is pixel-equivalent to its
  pre-this-phase appearance.
- Legibility: for at least 5 of the 20 designs (a representative spread — a corner-orb style, a
  full-page texture like the grid/dots, a glow, a line-based one, and the minimal one), place
  realistic cover text over them at both a short and a long title length and confirm the text
  stays clearly legible — this is a real visual check, not just "opacity number looks low enough
  in the code."
- A design + custom theme combination (not just the two built-ins) recolors correctly — prove
  the "independent of theme" architecture actually holds, not just for the two presets that were
  designed alongside it.

## Handoff

Cover: which tools existed and got wired up; confirmation of the regression check (every "None"
surface unchanged); the 5-design legibility spot-check results; any design that had to be
simplified to stay legible and why; known limitations (e.g. rasterization adds a brief async step
before PPTX export — note actual timing if it's noticeable); ideas explicitly deferred (e.g. a
"random/surprise me" picker, letting Tyrone define a 21st custom design through the UI — flag,
don't build).
