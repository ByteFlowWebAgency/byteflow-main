# Theme JSON Guide

Reference for hand-authoring (or having an LLM author) a ByteFlow document theme as a
`.json` file, for import at `/internal/theme-editor`. Give this whole file to an LLM along
with a description of the visual direction you want (e.g. "a warm, editorial theme for a
nonprofit client" or "a high-contrast dark theme for an executive pitch deck"), and ask it
to produce ONE JSON file per theme that follows this spec exactly.

## What a theme actually controls

A theme is a small bundle of colors, two font choices, and one cover-page toggle. It does
**not** control layout, spacing, or which blocks/slides exist — those are fixed per
document/deck. A theme only restyles what's already there: colors, typefaces, and whether
the cover page goes full-bleed.

**One theme, reused everywhere.** The exact same theme applies to:
- **Documents** (`/internal/documents`) — proposals, one-pagers, reports, etc.
- **Presentations** (`/internal/slides`) — decks, including the downloaded `.pptx` (colors
  and fonts carry through to the exported PowerPoint file, not just the on-screen preview).

A good theme is worth making well — it's not a one-off, it's reused across every document
and deck that picks it.

## Top-level Theme shape

```json
{
  "id": "string, required — a stable slug, e.g. \"midnight-pitch\". Becomes the storage key.",
  "name": "string, required, max 60 chars — shown in every theme picker.",
  "isBuiltIn": false,
  "colors": {
    "background": "#rrggbb, required",
    "foreground": "#rrggbb, required",
    "accent": "#rrggbb, required",
    "muted": "#rrggbb, required",
    "gradient": ["#rrggbb", "#rrggbb", "#rrggbb"]
  },
  "fonts": {
    "display": "one of the 4 curated font stacks below, verbatim",
    "body": "one of the 4 curated font stacks below, verbatim"
  },
  "coverPage": {
    "fullBleedBackground": true
  }
}
```

Notes on required-ness, since this is stricter than some of this suite's other JSON
imports:

- **`id` is required** — not optional, not auto-generated. Unlike documents/decks
  elsewhere in this suite, a theme import with a missing or empty `id` is rejected
  outright (`Theme is missing a string "id".`). Use a short, readable slug — it's never
  shown to a user, but it's the theme's stable identity (referenced by every document/deck
  that picks it).
- **`isBuiltIn` is ignored on import** — always forced to `false`, whatever the JSON says.
  You may omit it entirely; include it only if it makes the file easier to reason about.
- Every color field is required — there is no "leave it blank, we'll pick something"
  fallback for background/foreground/accent/muted. `gradient` is the only optional color
  field.
- `coverPage.fullBleedBackground` is required and must be a real boolean (`true`/`false`),
  not a string.

## Colors

**Strict 6-digit hex only** — `/^#[0-9A-Fa-f]{6}$/`. No `rgb()`, no 3-digit shorthand, no
named colors (`"red"`), no alpha. Any color failing this pattern rejects the whole theme.

| Field | Used for |
|---|---|
| `background` | The document page / slide background. |
| `foreground` | Headings and primary body text. |
| `accent` | Labels, eyebrow text, numbers, bullets, table headers, chart accents — the "brand color" moment. |
| `muted` | The **base** secondary text/hairline color is derived from this at fixed opacity tiers (72%, 60%, 16%, 8%, 4%) — not a literal color you'll see at full opacity anywhere. Usually equal to `foreground`; set it separately only if you want secondary text to read cooler/warmer than headings. |
| `gradient` (optional) | An exact 3-stop signature gradient used for keylines and section-kick accents. If omitted, one is derived automatically from `accent` (two progressively lighter stops) — supplying your own is only worth it for a specific brand gradient, not a general requirement. |

### Contrast — check this yourself before handing over the JSON

The Theme Editor shows **informational** WCAG contrast warnings for three pairs (never
blocking, but worth getting right for genuinely better-looking, more legible documents):

- `foreground` on `background` — body text legibility. Target **≥ 4.5:1** (WCAG AA normal text).
- `accent` on `background` — accent text/labels legibility. Target **≥ 4.5:1**.
- `foreground` on `accent` — text sitting on an accent-filled surface (e.g. a pricing-table
  header). Target **≥ 4.5:1**.

Compute WCAG relative luminance/contrast the standard way (sRGB → linearize → 0.2126R +
0.7152G + 0.0722B → `(lighter + 0.05) / (darker + 0.05)`) and sanity-check all three pairs
before finalizing colors. A theme that fails these badly will still import and save — but
it'll look worse and read a small warning icon in the editor, which defeats the point of
asking for *better* visual documents.

## Fonts — exactly 4 allowed values, copy verbatim

`fonts.display` and `fonts.body` are **not** font names — they're exact CSS font-stack
strings, and only these four are accepted (anything else rejects the theme):

```json
"var(--font-jakarta), system-ui, -apple-system, 'Segoe UI', sans-serif"
```
Plus Jakarta Sans (brand) — the default for both display and body in Classic/Dark.

```json
"var(--font-mono), ui-monospace, Menlo, monospace"
```
JetBrains Mono (brand mono) — distinctive, useful for a technical/dev-facing theme.

```json
"system-ui, -apple-system, 'Segoe UI', sans-serif"
```
System Sans — a plain, neutral system font stack.

```json
"Georgia, 'Times New Roman', Times, serif"
```
System Serif — the only serif option; pairs well with `display` for an editorial feel
(e.g. `display: serif, body: brand-sans`).

There is no way to load a custom font file or reference an arbitrary Google Font — pick
`display`/`body` from these four stacks only, copying the string exactly (whitespace and
quoting matter, it's matched verbatim against this allowlist).

## Cover page

```json
"coverPage": { "fullBleedBackground": true }
```

- `true` — the cover page fills entirely with the theme's `background` color plus a soft
  brand-gradient wash; the real BYTEFLOW logo and title sit on top. This is what Dark uses
  — the "pitch deck" cover treatment.
- `false` — a restrained neutral-paper cover (Classic's treatment) — the theme's colors
  still apply to text/accents, but the page itself doesn't go full-color.

Full-bleed generally reads better with a dark or saturated `background`; a light,
low-contrast `background` with full-bleed on can look washed out. Not a hard rule, just a
design instinct worth applying.

## Reference: the two built-in themes, verbatim

Use these as calibration points — what "good" looks like, and a template to riff from.

**Classic** (light, restrained, the baseline every other theme is judged against for
regression):
```json
{
  "id": "classic",
  "name": "Classic",
  "isBuiltIn": true,
  "colors": {
    "background": "#f7f7fa",
    "foreground": "#0b0f1f",
    "accent": "#6366f1",
    "muted": "#0b0f1f",
    "gradient": ["#6366f1", "#8b5cf6", "#06b6d4"]
  },
  "fonts": {
    "display": "var(--font-jakarta), system-ui, -apple-system, 'Segoe UI', sans-serif",
    "body": "var(--font-jakarta), system-ui, -apple-system, 'Segoe UI', sans-serif"
  },
  "coverPage": { "fullBleedBackground": false }
}
```

**Dark** (a genuinely dark theme, not a naive color inversion — background sits slightly
violet of pure black, accent steps up in lightness since the base indigo only reaches
~4.2:1 on a dark background):
```json
{
  "id": "dark",
  "name": "Dark",
  "isBuiltIn": true,
  "colors": {
    "background": "#0d1226",
    "foreground": "#f5f6fb",
    "accent": "#818cf8",
    "muted": "#eef0fa",
    "gradient": ["#818cf8", "#a78bfa", "#22d3ee"]
  },
  "fonts": {
    "display": "var(--font-jakarta), system-ui, -apple-system, 'Segoe UI', sans-serif",
    "body": "var(--font-jakarta), system-ui, -apple-system, 'Segoe UI', sans-serif"
  },
  "coverPage": { "fullBleedBackground": true }
}
```

Both hit ≥ 6:1 on all three checked contrast pairs — comfortably past the 4.5:1 AA floor,
which is a reasonable target to aim for rather than just scraping past the minimum.

## A complete worked example (a new theme, not a built-in)

```json
{
  "id": "editorial-serif",
  "name": "Editorial Serif",
  "isBuiltIn": false,
  "colors": {
    "background": "#faf6f0",
    "foreground": "#241c15",
    "accent": "#a8481c",
    "muted": "#241c15",
    "gradient": ["#a8481c", "#c46a3a", "#d4a373"]
  },
  "fonts": {
    "display": "Georgia, 'Times New Roman', Times, serif",
    "body": "var(--font-jakarta), system-ui, -apple-system, 'Segoe UI', sans-serif"
  },
  "coverPage": { "fullBleedBackground": false }
}
```

A warm off-white paper background, a burnt-orange accent, serif headings over sans body
text — a legible, editorial pairing distinct from both built-ins.

## Validation behavior (what happens on import)

**All-or-nothing, field by field.** Every single field above is checked; the first problem
found rejects the *entire* theme with one specific error message — nothing partial is ever
saved. There's no coercion story here (unlike some of this suite's other JSON imports) —
every field is either valid or the whole file is rejected.

## How to import it once you have the JSON

1. Save the LLM's output as a `.json` file (one file per theme — there's no bulk-import;
   generating 3 themes means 3 files and 3 imports).
2. Go to `/internal/theme-editor`.
3. Click **Import…** (top right).
4. Pick the file. If the name or id collides with a theme you already have saved, you'll
   get an **Overwrite?** confirmation — nothing is silently replaced.
5. The imported theme loads into the editor immediately, live-previewed on the right (a
   sample cover + document), so you can eyeball it before it's final. It's already saved
   at this point — editing further and clicking **Save theme** just updates it in place.
6. To actually use it: open any document (`/internal/documents/[id]`) or deck
   (`/internal/slides/[id]`), and pick the new theme from the **theme picker** in that
   editor's top bar — custom themes appear grouped under "Custom themes" below the two
   built-ins.

## Troubleshooting

| Error text | Cause | Fix |
|---|---|---|
| `Theme is missing a string "id".` | No `id` field, or it's empty/not a string. | Add a short slug id — required, unlike other JSON imports in this suite. |
| `Theme "name" must be a non-empty string of at most 60 characters.` | Missing/empty/too-long `name`. | Keep it ≤ 60 chars. |
| `colors.<field> must be a 6-digit hex color like #0b0f1f.` | A color isn't strict `#rrggbb` — 3-digit shorthand, `rgb()`, or a named color. | Convert to full 6-digit hex. |
| `colors.gradient, when present, must be exactly three hex colors.` | `gradient` array has ≠ 3 entries, or a non-hex entry. | Use exactly 3 valid hex strings, or omit the field entirely. |
| `fonts.<field> is not one of the curated fonts.` | The font stack string doesn't exactly match one of the 4 allowed values. | Copy one of the 4 stacks from this guide verbatim — no custom fonts. |
| `coverPage.fullBleedBackground must be true or false.` | Missing, or a string like `"true"` instead of a real boolean. | Use a JSON boolean, not a quoted string. |
| `That file is not valid JSON.` | Syntax error in the file. | Re-validate the JSON before import. |
