# Document Builder — Template JSON Guide

> ## ⚠️ READ THIS FIRST
> Every JSON file produced by this guide has an outer `name`/`description`/`category`/`document`
> wrapper (see shape below). That shape **only** imports through the **"Import template"**
> button **inside the "+ New document" dialog** at `/internal/documents`.
>
> It does **NOT** go in through the **"Import JSON"** button on the main `/internal/documents`
> list page — that button is for a different, unwrapped JSON shape and will reject this file
> with `Not a valid document file: Document has no pages array.` even though the file is
> perfectly valid.
>
> **Whenever you (the LLM) hand a user a `.json` file generated from this guide, always say
> explicitly: "Import this via the Import template button inside the + New document dialog —
> not the Import JSON button on the Documents list page."** Don't just produce the file —
> name the exact button every time, since this is the single most common failure mode.

Reference for hand-authoring (or having an LLM author) a Document Builder template as a
`.json` file, for import at `/internal/documents`. Give this whole file to an LLM along
with a description of the template you want, and ask it to produce ONE JSON file that
follows this spec exactly, **plus the import instructions from the box above.**

## The two import paths (don't mix them up)

The Document Builder has two different "Import" buttons that accept different JSON shapes:

1. **"Import template"** — inside the **+ New document** dialog (top-right of the
   dialog). Accepts a **Template file** (schema below): a named, reusable starting point
   that shows up in the chooser alongside the built-in templates, under whatever
   `category` you give it. Use this one. It's what "upload a new template" means.
2. **"Import JSON"** — on the main Documents list page. Accepts a **raw document file**
   (just the `document` object below, with no `name`/`description`/`category` wrapper).
   It creates one concrete document immediately and does not appear in the template
   chooser. Only use this if you want a one-off document, not a reusable template.

This guide is about #1. If you only want #2, skip the outer wrapper and hand over just
the `document` object.

> **Seeing "Not a valid document file: Document has no pages array."?** That error means a
> **wrapped Template file** (with `name`/`description`/`category`/`document` at the top)
> was dropped into the **"Import JSON"** button by mistake — that button only accepts the
> unwrapped `document` object, so it looks at the top level for `pages`, doesn't find it
> (it's nested inside `document.pages`), and rejects the file. The JSON itself is fine.
> Fix: use the **"Import template"** button inside the **+ New document** dialog instead
> (see step-by-step at the bottom of this guide) — do not use "Import JSON" for a file
> that has an outer `name`/`description`/`category`/`document` wrapper.

## Top-level Template file shape

```json
{
  "name": "string, required, max 80 chars",
  "description": "string, optional, max 300 chars — shown under the name in the chooser",
  "category": "string, optional, max 60 chars — groups it in the chooser; defaults to \"Custom\"",
  "document": { ... a Document object, required, see below ... }
}
```

`id` may be included but is ignored/regenerated on import — never hand-author one.

## The `document` object (a `BuiltDocument`)

```json
{
  "name": "string, max 120 chars — the document's own name (usually same as template name, or 'Untitled document')",
  "themeId": "\"classic\" | \"dark\" | any custom theme id already saved in this browser",
  "pages": [ ... array of Page objects, required, see below ... ]
}
```

Notes:
- `id`, `createdAt`, `updatedAt` are optional — auto-filled on import. Never hand-author them.
- `themeId`: if it doesn't resolve to a real theme, the app silently falls back to
  `"classic"`. When unsure, just use `"classic"`.
- `templateId` is informational only; omit it.
- `pages` can be any length, any order, any mix of kinds.

## Page objects

Every page has:

```json
{ "kind": "cover" | "sectionTitle" | "content" | "closing", "blocks": [ ... ] }
```

`id` is optional (auto-generated). Field requirements by `kind`:

| kind | `blocks` | extra fields |
|---|---|---|
| `cover` | must be `[]` (empty) | `coverFields` (see below) |
| `sectionTitle` | must be `[]` (empty) | `sectionTitleFields` (see below) |
| `content` | array of Block objects, any of the 11 types below, in any order | none |
| `closing` | array of Block objects (same as `content`) | none — renders with a themed closing footer automatically |

Use exactly one `cover` page, normally first, if the document should open with a title
page. Use `sectionTitle` pages as full-page divider/section breaks anywhere in the
document (as many as you want — "Our Approach", "Investment", etc.). Everything else is
`content`; put a `closing` page last if the document should end with a themed sign-off
page.

### `coverFields` (only on `kind: "cover"`)

```json
{
  "title": "string, required — the big title",
  "subtitle": "string, optional — sits in the eyebrow slot above the title",
  "clientName": "string, optional — shown as 'Prepared for <clientName>'",
  "date": "string, optional, max 40 chars — free text, not parsed as a real date"
}
```

### `sectionTitleFields` (only on `kind: "sectionTitle"`)

```json
{
  "eyebrow": "string, optional — small caps label above the title",
  "title": "string, required",
  "subtitle": "string, optional"
}
```

## Block objects (used inside `content` / `closing` pages' `blocks` array)

Every block has `{ "type": "...", ... }`. `id` is always optional (auto-generated). There
are exactly 11 types — do not invent new ones; an unrecognized `type` string rejects the
**entire document**, not just that block.

### `heading`
```json
{ "type": "heading", "level": 1, "text": "string, max 2000 chars" }
```
`level` must be `1`, `2`, or `3` (anything else silently becomes `2`).

### `titleBanner`
A strong section-header moment *within* a content page (as opposed to a whole
`sectionTitle` page).
```json
{ "type": "titleBanner", "eyebrow": "string, max 200", "title": "string, max 2000, required", "subtitle": "string, max 2000" }
```

### `richText`
```json
{ "type": "richText", "html": "string — sanitized HTML, see whitelist below" }
```

### `callout`
Accent-styled box, same content rules as `richText`.
```json
{ "type": "callout", "html": "string — sanitized HTML, see whitelist below" }
```

**HTML whitelist for `richText`/`callout`** — ONLY these tags survive sanitization:
`p`, `strong`, `em`, `a`, `ul`, `ol`, `li`, `br`. Everything else is either unwrapped
(its own text survives, e.g. a stray `<div>` becomes plain text) or dropped entirely
(`<script>`, `<style>`, `<iframe>`, `<svg>`, etc.). `<a>` keeps only a safe `href`
(`http:`, `https:`, `mailto:`, or a relative path/anchor — any other scheme is stripped).
**Author your HTML using only the whitelisted tags** — don't rely on remapping.

### `image`
```json
{ "type": "image", "dataUrl": "", "caption": "string, max 2000", "alt": "string, max 500", "width": "full" | "half" }
```
`dataUrl` MUST be empty string `""` or a real `data:image/...` base64 URL — any other
value (including a normal `https://` image URL) is silently dropped to `""`. **For a
hand-authored template, always leave `dataUrl: ""`** and let the person fill the image
in after import; don't try to embed a real image unless you truly have base64 data.

### `table`
```json
{ "type": "table", "header": ["Col A", "Col B"], "rows": [["r1c1", "r1c2"], ["r2c1", "r2c2"]] }
```
Every row is force-padded/truncated to `header.length` columns, so keep them
rectangular yourself for a clean result.

### `divider`
```json
{ "type": "divider" }
```
No other fields. A themed horizontal rule.

### `spacer`
```json
{ "type": "spacer", "size": "small" | "medium" | "large" }
```
Anything else silently becomes `"medium"`.

### `keyValueList`
Label/value rows — good for "Project / Timeline / Budget" summaries.
```json
{ "type": "keyValueList", "items": [ { "label": "string, max 500", "value": "string, max 2000" } ] }
```
Each item's `id` is optional (auto-generated).

### `pricingTable`
Reuses the proposal tool's pricing model — one of three shapes for `pricing`, plus a
flat `lineItems` array.
```json
{
  "type": "pricingTable",
  "pricing": { "model": "flat", "totalAmount": 5000, "paymentSchedule": "50% upfront, 50% on completion" },
  "lineItems": [ { "description": "string, max 2000", "amount": 1500, "recurring": false } ]
}
```
`pricing` alternatives:
```json
{ "model": "retainer", "monthlyAmount": 2000, "termMonths": 6, "includedScope": "string, max 2000" }
```
```json
{ "model": "hybrid", "setupAmount": 1000, "monthlyAmount": 500, "termMonths": 12, "includedScope": "string, max 2000" }
```
Any non-numeric `amount`/`totalAmount`/`monthlyAmount`/`setupAmount`/`termMonths` value
silently becomes `0` — don't quote numbers as strings.

### `pageBreak`
```json
{ "type": "pageBreak" }
```
No other fields. Forces everything after it in the same page's block list onto a new
printed page — put this INSIDE a `content`/`closing` page's `blocks` array (it's a block,
not a page kind) when you want an in-page hard break instead of a full `sectionTitle`
page.

## Validation behavior (what happens on import)

- **Structure is all-or-nothing.** An unknown `page.kind`, an unknown `block.type`, or a
  non-array `pages`/`blocks` rejects the WHOLE file with an error — nothing partial gets
  imported.
- **Content is coerced, not rejected.** Bad numbers become `0`, missing strings become
  `""`, out-of-range enums fall back to a sane default (see per-field notes above), rich
  text is sanitized rather than refused. So the only way to actually fail an import is a
  wrong `type`/`kind` or wrong top-level shape (e.g. `pages` missing or not an array).
- Every `id` field anywhere in the document is optional — never hand-author one; the
  importer fills in a fresh UUID wherever one is missing (or, for the document's own
  top-level `id`, re-keys it if it happens to collide with an existing document).

## Minimal complete example (template file)

```json
{
  "name": "Quarterly Check-In",
  "description": "A short client check-in: wins, risks, what's next.",
  "category": "Client-Facing Extras",
  "document": {
    "name": "Untitled document",
    "themeId": "classic",
    "pages": [
      {
        "kind": "cover",
        "blocks": [],
        "coverFields": {
          "title": "[Client] — Quarterly Check-In",
          "subtitle": "QUARTERLY REVIEW",
          "clientName": "[Client name]",
          "date": ""
        }
      },
      {
        "kind": "content",
        "blocks": [
          { "type": "heading", "level": 2, "text": "Wins this quarter" },
          { "type": "richText", "html": "<ul><li>[Win one]</li><li>[Win two]</li></ul>" },
          { "type": "heading", "level": 2, "text": "Risks & watch items" },
          { "type": "richText", "html": "<p>[Describe any risk here.]</p>" },
          { "type": "keyValueList", "items": [
            { "label": "Timeline", "value": "[On track / At risk]" },
            { "label": "Budget", "value": "[On track / At risk]" }
          ] }
        ]
      },
      {
        "kind": "closing",
        "blocks": [
          { "type": "richText", "html": "<p>Questions before next quarter? Let's talk.</p>" }
        ]
      }
    ]
  }
}
```

## How to import it once you have the JSON

A file produced by this guide has the outer `name`/`description`/`category`/`document`
wrapper — that means it is a **Template file** and MUST go in via **Import template**,
never the "Import JSON" button on the Documents list page (that one is for path #2 only,
see above).

1. Save the LLM's output as a `.json` file.
2. Go to `/internal/documents`.
3. Click **+ New document**.
4. In the dialog that opens, click **Import template** (top right of the dialog, next to
   the ✕) and pick the file. Do **not** use the "Import JSON" button on the Documents list
   page behind this dialog — that's a different button for a different, unwrapped JSON
   shape (path #2 above) and will reject a Template file with
   `Not a valid document file: Document has no pages array.`
5. It appears immediately in the chooser under the `category` you set, tagged **Custom** —
   click it any time to start a new document from it. (Import errors show inline in that
   dialog and never save anything.)

## Troubleshooting

| Error text | Cause | Fix |
|---|---|---|
| `Not a valid document file: Document has no pages array.` | A wrapped Template file (has `document.pages`) was dropped into **Import JSON** instead of **Import template**. | Use **Import template** inside the **+ New document** dialog. |
| `Not a valid template file: Document has no pages array.` | The `document` field is missing, isn't an object, or its `pages` isn't an array. | Make sure the Template file's `document` object has a top-level `pages` array (see shape above). |
| `Not a valid document file: Invalid document: unknown page kind "...".` / `unknown block type "..."` | A `page.kind` or `block.type` doesn't match the fixed list. | Only use `cover`/`sectionTitle`/`content`/`closing` for page `kind`, and only the 11 listed block `type`s. |
| `That file is not valid JSON.` | The file has a syntax error (trailing comma, unescaped quote, etc). | Re-validate the JSON before import. |
