# 05 — Generating a Real, Editable .pptx

The export must produce a genuine `.pptx` — opens in real PowerPoint/Keynote/Google Slides,
text is real editable text (not a flattened image), using **`pptxgenjs`**, entirely client-side.

## Setup

```ts
import PptxGenJS from "pptxgenjs";
const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";      // 13.33" x 7.5", 16:9 — the modern PowerPoint default size.
                                    // Do not use a 4:3 layout for anything.
pptx.author = "ByteFlow Solutions";
pptx.title = deck.name;
```

## Two known pptxgenjs gotchas — get these right, they cause silent file corruption

1. **Hex colors must NOT include a leading `#`.** pptxgenjs wants `"1A2B3C"`, not `"#1A2B3C"`.
   The theme system elsewhere in this repo stores colors *with* the `#` (validated against
   `/^#[0-9A-Fa-f]{6}$/`). **Strip the `#` at the export boundary** — write one small helper
   (`toPptxColor(hex: string): string`) and route every color value through it before it reaches
   any pptxgenjs option. Do not hand-strip this in multiple places; one helper, used everywhere.
2. **Bulleted lists must use the `bullet: true` option on `addText`**, never a manually-typed
   bullet character (e.g. `"• Item"`) — typed bullet glyphs plus PowerPoint's own bullet
   rendering produces doubled bullets.

If anything else about the API doesn't match what you expect, check the official docs
(https://gitbrent.github.io/PptxGenJS/docs/) before guessing — the library has specific,
sometimes non-obvious requirements (documented gotchas around image paths, opacity-in-hex-string,
etc.) and getting them wrong produces a "needs repair" file, not a clean error.

## Brand consistency via a slide master

Define one slide master per theme-and-layout-family (at minimum, enough to cover "classic" and
"dark" cleanly — a light-background master and a dark-background master, since text/logo
contrast needs differ) using `pptx.defineSlideMaster()`: background color from the active
`Theme`, the real BYTEFLOW logo placed consistently (e.g. a small corner mark), and slide
numbering. Every generated slide uses `pptx.addSlide({ masterName })` with the master matching
the deck's active theme, so brand consistency is enforced structurally, not re-implemented per
slide-template function.

## One generator function per template

`lib/slides/pptxGenerators.ts`: one function per `SlideTemplateId` (25 total, matching
`02-SLIDE-DATA-MODEL.md` and `04-SLIDE-LIBRARY.md` exactly), each taking `(pptx, slide, theme)`
and calling `pptx.addSlide(...)` + the appropriate `addText`/`addImage`/`addShape`/`addTable`
calls to lay out that template's fields. Keep each function focused on one template — do not
build a single mega-function with a giant switch inside it; one function per file or a clearly
separated function per template in one file, agent's judgment on file splitting.

- Text: use theme fonts (`fontFace`) and colors (via `toPptxColor`) throughout — never a
  hardcoded color or font name in a generator function.
- Images: pass the slide's stored data URL directly to `addImage({ data: ... })` — verify
  against the current images doc whether the full `data:image/png;base64,...` string or the
  `image/png;base64,...` form (without the `data:` prefix) is expected, and adjust the stored
  format or strip the prefix at the export boundary accordingly — confirm this by actually
  opening an exported file with an image slide, not by assumption.
- Tables (if any template benefits from `addTable` over positioned text, e.g. Pricing/Investment
  or FAQ) — reasonable to use `addTable` for tabular content, agent's judgment per template.
- Bulleted content: `bullet: true`, not typed bullet characters (see gotcha #2 above).

## Download flow

`pptx.writeFile({ fileName: <sanitized deck name + date> })` triggers a browser download — same
"generate a real file, trigger download, no server round-trip" pattern as the PDF export
elsewhere in this suite. Sanitize the deck name for filesystem-safe characters, matching the
convention already used for PDF filenames if one exists in this repo.

## Acceptance criteria

- Every one of the 25 generator functions produces a slide that opens without a "needs repair"
  warning in **actually-opened** PowerPoint, Keynote, or Google Slides — not just "the code ran
  without throwing." This cannot be verified by the agent alone; say so plainly in the handoff
  and give Tyrone the exact steps to check it himself first thing.
- Exported colors and fonts visibly match the deck's active theme, for both "classic" and "dark."
- A deck mixing several different templates, including at least one with an image and one with a
  bulleted list, exports as one coherent, correctly-ordered `.pptx`.
- No hex color anywhere in generated output includes a leading `#` (grep the generator code for
  the pattern; every color access goes through `toPptxColor`).
- Text in the exported file is genuinely editable (click into a text box in real PowerPoint and
  type) — this is the core value proposition of using `pptxgenjs` over, say, exporting slides as
  images; confirm it's actually true, not assumed.
