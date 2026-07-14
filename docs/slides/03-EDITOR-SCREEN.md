# 03 — Editor Screen

Route: `/internal/slides` (decks list) and `/internal/slides/[id]` (editor) — or the equivalent
adapted to the repo's real routing conventions, same pattern as other tools in this suite.

## Decks list (`/internal/slides`)

- List of saved decks: name, last-updated, theme, slide count. Actions per deck: open,
  duplicate, rename, export JSON, delete (with confirmation).
- "New deck" → starts a blank deck (one `titleCover` slide, see `02-SLIDE-DATA-MODEL.md`
  defaults) → editor. No template-deck concept tonight — decks always start from the same blank
  starting point and get built up slide-by-slide; the 25 *slide* templates are the unit of
  reuse, not deck-level presets (see `00-GUARDRAILS.md` scope walls).
- "Import deck" → JSON file input, validated per `02-SLIDE-DATA-MODEL.md`.

## Editor (`/internal/slides/[id]`)

Three working regions, same shape as the document-builder editor if that exists in this repo,
but simpler since there's no block system inside a slide:

1. **Slide rail** (left, narrow): a thumbnail or labeled entry per slide, in order. Click to
   jump. Controls: reorder (up/down buttons sufficient; drag-and-drop is nice-to-have, not
   required), duplicate slide, delete slide (confirmation). An "Add slide" control opens the
   slide-template picker (below).
2. **Canvas** (center): the current slide rendered at correct 16:9 proportions, themed via the
   existing `ThemedDocument`/theme mechanism, with its content fields editable in place:
   - Click a text field to edit it inline (plain text — single-line fields are single-line
     inputs; multi-line fields like `body` or `freeText` are plain textareas, no formatting
     toolbar).
   - Repeatable fields (agenda items, bullet points, stats, team members, FAQ pairs, etc.) have
     add/remove/reorder controls appropriate to their template — keep these obvious and close to
     the content they affect, not in a separate settings panel.
   - Image fields show a file picker + current image preview + remove button.
   - The canvas shows honest 16:9 slide proportions so what Tyrone sees is close to what the
     `.pptx` produces (some difference in exact rendering is expected and fine — see
     `05-PPTX-EXPORT.md` — but layout, color, and content placement should clearly correspond).
3. **Top bar**: deck name (inline-editable), theme picker (the existing shared `ThemePicker`),
   autosave status indicator ("Saved" / "Saving…"), "Download .pptx" button, back-to-list link.

## The slide-template picker ("Add slide")

A single flat list/grid of all 25 templates — **no categories, no grouping, no tabs.** Each
entry shows the template's name and a small representative thumbnail/icon so Tyrone can scan
visually rather than read 25 labels top to bottom. Clicking one appends a new slide of that
template (with bracketed placeholder content, per `04-SLIDE-LIBRARY.md`) to the end of the deck
and jumps the canvas to it, ready to edit. Search/filter-by-typing across the 25 names is a
reasonable nice-to-have given the list length, but the default view is the full flat list, not a
search box first.

## Keyboard and focus

Same quality floor as every tool in this suite: everything reachable and operable by keyboard,
visible focus states, repeatable-field controls accessible (not hover-only).

## Acceptance criteria

- Create a deck from blank; add at least one slide of every one of the 25 templates; edit every
  field type at least once (plain text, textarea, repeatable list, image); reorder, duplicate,
  and delete slides — all reflected live on the canvas and all autosaved (verify by reloading
  mid-edit).
- Switching the deck's theme restyles every slide live, consistent with how theming works
  elsewhere in this suite.
- The slide-template picker shows all 25 with no categorization, grouping, or tabs.
- The empty/default deck (one `titleCover` slide) renders without errors.
- A deck with 15+ slides across many different templates remains navigable via the slide rail.
