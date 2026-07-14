# 06 — Integration, Regression Check, and QA

## Integration checklist

- Builds cleanly; lint and type-check pass; exactly **one** new dependency (`pptxgenjs`, pinned
  version) — nothing else needed tonight.
- New hub tile: "Presentations" → `/internal/slides`, same tile pattern as every other tool.
  Replace a "coming soon" placeholder if one exists for it.
- `robots.txt` disallow still covers the new routes.
- No direct `localStorage` access outside the storage adapter (grep to confirm).

## Regression check first

1. Log in; hub works; every pre-existing tile still present and functional (a quick open-and-
   confirm-it-loads pass on each, not a full re-QA — tonight didn't touch their code).
2. Confirm the theme system is unaffected: open the theme editor (if present) and confirm
   existing custom themes still load and the built-ins are unchanged.

## New-feature QA

1. Full editor pass per `03-EDITOR-SCREEN.md` acceptance criteria — every one of the 25
   templates addable and editable, every field type exercised, reorder/duplicate/delete,
   autosave-and-reload, theme switch reflected live.
2. Full export pass per `05-PPTX-EXPORT.md` acceptance criteria, including the manual
   open-in-real-software verification — do as much of this as you can (file downloads without
   error, no obvious structural problem you can detect by re-reading the generated XML if
   needed), and be explicit in the handoff about what still needs Tyrone's own eyes.
3. Deck management: create, duplicate, rename, delete (confirm), export deck JSON, re-import it,
   confirm exact round-trip.
4. Malformed import: hand-corrupt a deck JSON file (bad `templateId`, missing required field);
   confirm graceful rejection with a clear message, never a crash or partial apply.
5. A 20+ slide deck spanning many different templates remains responsive and navigable in the
   editor, and exports as one complete, correctly-ordered file.

## Handoff (`docs/slides/HANDOFF.md`)

- Regression confirmation for prior tools.
- What was built, where; the 25 generator functions' locations.
- Deviations from spec vs. repo reality; decisions made without asking.
- Known limitations: on-screen preview vs. actual `.pptx` rendering may differ in minor ways
  (font substitution if a theme font isn't installed on whatever machine ultimately opens the
  file, exact spacing) — this is normal for generated Office files, not a bug, but worth Tyrone
  knowing going in.
- **The one thing to check first, explicitly and by hand**: download a deck with at least one
  slide of each template type, open it in real PowerPoint (or Keynote/Google Slides), confirm
  every slide looks right, every text box is actually editable, and nothing shows a "repair"
  warning. This is the single most important verification step for tonight's work and the agent
  cannot do it — flag it clearly, don't bury it in a list.
- Ideas deferred: a chart-generation template (tonight's Chart/Graph slide only displays a
  pre-made chart image, it doesn't build one), speaker notes support, exporting a deck as a PDF
  in addition to `.pptx`, pulling content from an existing proposal/audit/document into a deck
  automatically.
