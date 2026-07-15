# 01 — Context and Scope

## What this tool is for

Tyrone regularly needs a BYTEFLOW-branded slide deck: as a follow-up after sending a proposal or
audit, and as the visual aid on a live discovery call or pitch meeting (e.g. the kind of meeting
recorded elsewhere in this repo's history — Summit County CoC, Progress Akron CDC, and similar).
Building a deck from scratch in PowerPoint or Google Slides every time is slow and brand
consistency drifts. This tool fixes that: pick from 25 ready-made, on-brand slide designs, fill
in the content, reorder as needed, download a real `.pptx` to present or attach.

## What already exists that this reuses

- The `/internal` hub, login gate, and session handling — same conventions as every other tool.
- The **theme system**: `Theme` type, built-in "classic"/"dark" presets, any custom themes
  Tyrone has built, and the CSS-custom-property mechanism that drives them. A deck's `themeId`
  determines its colors and fonts, exactly like a document's does elsewhere in this suite —
  reuse the existing `ThemePicker` component as-is.
- The real BYTEFLOW logo asset and brand voice conventions already established in earlier work.

This tool does **not** depend on the block/page document-builder work, if that exists in this
repo — it's a sibling, not a dependency. Confirm what actually exists in Discovery and adapt.

## What this tool deliberately is not

Not a general presentation design tool. Not a Canva/PowerPoint-Designer clone. Not a place to
build custom slide layouts. It is 25 fixed, well-designed, brand-correct slide types, each with
a small set of editable content fields — see `00-GUARDRAILS.md` for the hard scope walls, and
`04-SLIDE-LIBRARY.md` for the exact 25.

## Relationship to the document tools (if present in this repo)

Presentations are a genuinely different artifact from a proposal or audit PDF — spoken to live
or skimmed quickly, not read start-to-finish — so this is a separate tool with its own simple
data model, not a "PowerPoint export mode" bolted onto the document builder. It shares only the
theme system and the general conventions (hub, login, storage patterns), not any document/block
code.

## Definition of done

From the hub, Tyrone opens Presentations, starts a new deck (or opens a saved one), adds slides
from the flat list of 25 by clicking through them, edits each slide's text/image fields inline
with a live themed preview, reorders/duplicates/deletes slides, picks a theme for the whole deck,
and downloads a `.pptx` that opens correctly in real PowerPoint/Keynote/Google Slides, looks
on-brand, and is genuinely editable there — not a flattened image export.
