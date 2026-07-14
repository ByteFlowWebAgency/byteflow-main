# Proposal Tool — Design Tokens (Phase 3)

Every value below was **extracted from this repo**, not invented. Primary sources:
`src/app/globals.css` (live token definitions), `src/app/layout.tsx` (font loading), and
`public/design_docs/01_COLOR_SYSTEM.md` / `02_TYPOGRAPHY.md` (the repo's own design-system
docs, which match globals.css exactly). Correct anything wrong here and in
`src/components/proposal-tool/tokens.css` — they are kept in sync.

## Colors (real values, from `globals.css` `:root`)

| Token | Value | Source name |
|---|---|---|
| Ink (page bg) | `#0B0F1F` | `--ink` |
| Ink-2 (inner panels) | `#1a1f3a` | `--ink-2` |
| Indigo (primary accent) | `#6366F1` | `--indigo` |
| Indigo-400 | `#818CF8` | `--indigo-400` |
| Violet | `#8B5CF6` | `--violet` |
| Violet-400 (eyebrows) | `#A78BFA` | `--violet-400` |
| Cyan | `#06B6D4` | `--cyan` |
| Cyan-400 (focus ring) | `#22D3EE` | `--cyan-400` |
| Foreground | `#FFFFFF` | `--fg` |
| Muted tiers | `rgba(255,255,255,.70/.60/.50)` | `--fg-muted/soft/dim` |
| Hairlines | `rgba(255,255,255,.08/.14)` | `--line`, `--line-strong` |
| Glass surfaces | `rgba(255,255,255,.04/.06)` | `--glass`, `--glass-solid` |
| Error (forms only) | `#F87171` | design_docs semantic table |
| Signature gradient | `linear-gradient(105deg,#6366F1 0%,#8B5CF6 50%,#06B6D4 100%)` | `--grad-primary` |
| Gradient text | `linear-gradient(105deg,#818CF8 0%,#A78BFA 40%,#22D3EE 100%)` | `--grad-text` |

## Light "paper" palette for the document itself

The site is dark-mode-native, but the proposal document is a printable, client-facing
paper artifact. `public/design_docs/01_COLOR_SYSTEM.md` §6 documents the repo's own
official inverse pairing for light surfaces, used verbatim for the document:

| Token | Value | Source |
|---|---|---|
| Paper bg | `#F7F7FA` | design_docs §6 |
| Paper fg | `#0B0F1F` (ink) | design_docs §6 |
| Paper glass | `rgba(11,15,31,0.04)` | design_docs §6 |
| Paper hairline | `rgba(11,15,31,0.08)` | design_docs §6 |
| Brand gradients | unchanged | design_docs §6 ("keep all brand gradients") |

The tool chrome (form, app shell) stays on the site's dark theme; the document previews as
a light sheet on the dark desk and prints/export cleanly. Logged as a decision in HANDOFF.

## Typography (from `layout.tsx`, loaded via `next/font/google`)

- Display + body: **Plus Jakarta Sans**, weights 300/400/500/600/700, exposed as
  `--font-jakarta` on `<html>` (one family for both roles — weights differentiate, matching
  the site).
- Mono: **JetBrains Mono**, 400/500, exposed as `--font-mono`.
- Fallback stacks (globals.css / design_docs): `system-ui, -apple-system, "Segoe UI",
  sans-serif` and `ui-monospace, Menlo, monospace`.
- Scale conventions: body 15px/1.55; eyebrows 13px, 600, uppercase, +1.2px tracking;
  card titles 22px/700/-0.6px; big headings 700 with tight negative tracking.

## Logo

- **`public/BYTEFLOW_LOGO.png`** — 200×196px, dark-indigo wordmark ("BYTEFL" solid,
  "OW" outlined) with gradient rule and "byte by byte." tagline, transparent background.
  Legible on light backgrounds → used on the paper document.
- The dark site chrome uses a Contentful-hosted alpha variant
  (`Byteflo-logo-Alpha__1_.png`); not used by this feature (CDN dependency).

## Spacing / radius / focus conventions

- Cards: 1px hairline borders, glass fills, rounded corners (12–24px on site cards).
- Focus: `2px solid #22D3EE`, `outline-offset: 3px` (globals.css `:focus-visible`).
- Reduced motion respected globally (globals.css media query).

## Signature element (one deliberate choice, per 02-DESIGN-SYSTEM)

**The gradient keyline.** A slim `--grad-primary` bar: full-width 3px under the document
masthead, and a short 26px tick above each section heading. It is the single recurring
brand mark that makes the document read as ByteFlow at a glance; everything else stays
quiet (ink text on paper, hairline table rules, mono phase numbers).

## Where the tokens live in code

`src/components/proposal-tool/tokens.css` — all values above declared once as `--bf-*`
custom properties, **scoped to `.bfScope`** (not `:root`) so nothing leaks into the
marketing site. Imported once by the feature's root component; every `*.module.css` in the
feature references `var(--bf-...)` only.
