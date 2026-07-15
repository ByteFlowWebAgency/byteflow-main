# 00 — Guardrails (read first, overrides everything else)

All prior guardrails apply: no public exposure of `/internal`, additive-only changes to the
marketing site, feature branches, no destructive git commands, confirmations on destructive user
actions, validated JSON import everywhere, no real client data as defaults.

## Scope: fixed slide layouts, not a presentation design tool

This is explicitly simpler than the document-builder tools, and it should stay that way:

- **No rich text formatting** — no bold/italic/links within a text field, no font-size overrides,
  no per-slide color overrides. A slide's visual style comes entirely from its template layout +
  the deck's chosen theme (colors/fonts), never from user-applied inline styling. If a request
  seems to need inline formatting to look right, the fix is picking a different one of the 25
  templates, not adding formatting controls.
- **No freeform positioning** — no dragging text boxes, no resizing/repositioning elements, no
  custom slide layouts beyond the 25 built-in ones. Each template's layout is fixed; only its
  text/image *content* is editable.
- **Exactly 25 templates, not categorized.** Do not group them by type in code or UI, and do not
  build more or fewer than 25 — see `04-SLIDE-LIBRARY.md` for the exact list. If you find
  yourself wanting a 26th to cover some case, that's a future idea for `HANDOFF.md`, not
  tonight's work.
- No slide-master customization tool, no user-created slide templates, no theme editor changes
  (the existing theme editor from prior work is untouched — decks simply pick from existing
  themes via the existing `ThemePicker`).

## Dependency rule (one exception, pre-approved)

`pptxgenjs` is approved for generating real `.pptx` files client-side. Requirements: pin a
specific version, confirm it runs fully client-side with no network calls, and confirm generated
files open correctly in real presentation software (see the handoff requirement in
`MASTER_PROMPT.md` — you cannot verify this yourself, so say so clearly rather than assuming).
No other new dependency is approved tonight.

## Data-loss protection (same standard as the document builder)

- Autosave the working deck to `localStorage` on every meaningful change (debounced), keyed by
  deck id.
- A visible saved-decks list (open, duplicate, rename, delete-with-confirmation).
- JSON export/import of any deck (the internal editable representation, not the `.pptx` — that's
  a separate "Download .pptx" action). Validate imports fully; fail with a clear message on
  anything malformed rather than partially applying it.
- Never wipe or migrate existing localStorage keys from prior tools.

## When something is genuinely ambiguous

Safe, reversible, additive choice; log it under "Decisions I made without asking" in
`HANDOFF.md`.
