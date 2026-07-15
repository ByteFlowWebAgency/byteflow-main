# Phase 4 — Discovery (Document Builder)

Branch `feat/internal-tools-phase4`, off `feat/internal-tools-themes` (which now also carries
this session's Supabase-auth login + footer login-link commit). Nothing on `main`.

## Real state of the shared code I build on

Confirmed by reading the phase-3 handoff and the actual modules (not assumed from spec).

### Theming — `src/components/internal-tools/themes/`
- `themeTypes.ts` — `Theme { id, name, isBuiltIn, colors:{background,foreground,accent,muted,gradient?}, fonts:{display,body}, coverPage:{fullBleedBackground} }`. `validateTheme` is field-by-field, all-or-nothing, returns a *fresh* object, forces `isBuiltIn:false`. `HEX_COLOR_RE`, `CURATED_FONT_STACKS`.
- `themeToCss.ts` — `themeToCss(theme): CSSProperties` produces the **11 doc-consumed vars**: `--bf-paper-bg/-fg/-fg-muted/-fg-soft/-line/-line-strong/-glass`, `--bf-color-accent`, `--bf-grad-primary/-callout`, `--bf-font-display/-body`. Documents never read `--bf-color-bg`. Also `isDarkColor(hex)`.
- `ThemedDocument.tsx` — `forwardRef<HTMLDivElement,{theme,children}>`; a single div with `{...themeToCss(theme), width:'fit-content', margin:'0 auto'}` + `data-bf-themed`/`data-bf-on-dark`. **It is the PDF export node** (clone carries inline vars). It does NOT impose sheet geometry — inner sheets self-size to 816px and center with `margin:0 auto`.
- `CoverPage.tsx` — props `{label,title,clientName,date,theme}`; renders exactly **816×1056** border-box (`data-pdf-document`), so the PDF engine's first natural cut lands on its bottom edge. `theme.coverPage.fullBleedBackground` picks full-bleed vs restrained. My `sectionTitle` pages reuse this visual family.
- `builtInThemes.ts` — `CLASSIC_THEME` (id `classic`, regression reference), `DARK_THEME` (id `dark`). `BUILT_IN_THEMES`, `getBuiltInTheme(id)`.
- `themeStorage.ts` — `bf-themes:<id>` keys, `resolveTheme(id):{theme,missing}` (deleted → Classic + `missing:true`), `useCustomThemes()` live hook, `parseThemeImport`, `saveCustomTheme` (refuses built-in ids). Import re-keys built-in id collisions rather than shadowing.
- `ThemePicker.tsx` — props `{id,value,onChange,missing?}`, built-ins then custom optgroup.

### PDF — `src/components/internal-tools/pdf/generateDocumentPdf.ts`
- `generateDocumentPdf(node, filename, {backgroundColor?})`. Clones the node into an off-screen `.bfScope`, bakes CSS `filter` into image pixels (html2canvas ignores it), html2canvas @2x, JPEG@0.92 pages.
- Pagination contract: page = **816×1056 px**; cuts at cumulative page height; `[data-pdf-block]` never split; `[data-pdf-keep-next]` headings never orphaned; short pages filled with `backgroundColor`. **No explicit page-break support today** — the cover only works because it is exactly 1056px AND first.
- `sanitizeFilePart(raw)`, `computeCutPositions(...)` exported.

### Pricing math (single source of truth) — `src/lib/proposal-tool/`
- `calculateTotals(proposal: ProposalData): ProposalTotals` in `pricingMath.ts` — the only totals implementation. `ProposalTotals { model, oneTimeTotal?, monthlyTotal?, termMonths?, contractTotal, nonRecurringLineItems, recurringLineItems }`.
- `types.ts` — `LineItem {id,description,amount,recurring}`, `Pricing = FlatPricing|RetainerPricing|HybridPricing`, `ProposalData`.
- `formatUsd`, `formatDisplayDate` in `src/lib/internal-tools/format.ts`. `--bf-font-mono` comes from `tokens.css`.
- The fixed InvestmentTable (`src/components/proposal-tool/ProposalDocument/InvestmentTable.tsx`) is CSS-module-coupled; I import the **logic** (`calculateTotals`/`formatUsd`) and replicate the markup/classes with `--bf-paper-*`/`--bf-font-mono`, per its structure (group/subtotal/total rows, right-aligned mono amounts).

### Audit categories (import, don't hardcode) — `src/lib/audit-tool/`
- `labels.ts` — `CATEGORY_ORDER`, `CATEGORY_LABELS`, `SEVERITY_ORDER`, `SEVERITY_LABELS`.
- `types.ts` — `AuditCategory` (6), `AuditSeverity` (5, incl. `good`), `AuditFinding`, `AuditData`.

### Routing / hub / shell
- `(protected)/layout.tsx` auto-provides the session gate, `bfScope` wrapper, `tokens.css`, header, footer to **any** folder under it — no layout edit needed.
- Create: `src/app/internal/(protected)/documents/page.tsx` (list) + `documents/[id]/page.tsx` (editor) as thin server shells (`metadata` w/ `robots:{index:false}`, `dynamic='force-dynamic'`) importing `'use client'` app components in `src/components/internal-tools/document-builder/`.
- Edit exactly two files: `InternalHeader.tsx` `TOOLS` array (+`{href:'/internal/documents',label:'Documents'}`) and hub `page.tsx` (+ a live `HubTile`). `robots.ts` already disallows `/internal`.
- `ConfirmDialog` props `{title,body,confirmLabel,danger?,promptLabel?,promptPlaceholder?,promptDefault?,onConfirm,onCancel}` — reuse for delete/rename.

## Key architectural decisions for Phase 4

1. **Pagination for `sectionTitle`/`pageBreak`/multi-page docs** — the PDF engine has no page-break primitive. I add an **additive, backward-compatible** `data-pdf-break-before` marker: the renderer marks the top of every page wrapper after the first (and each `pageBreak` block) with it; `generateDocumentPdf`/`computeCutPositions` force a cut at those offsets. Existing tools set no such marker → their output stays pixel-identical (regression-safe). This makes each `sectionTitle` its own page and content pages start on fresh pages while still letting long content overflow to more PDF pages naturally.
2. **`sectionTitle` pages** reuse CoverPage's visual family at 816×1056 (own component, no client/date fields — eyebrow/title/subtitle only), fixed height so they fill their page.
3. **`pricingTable` block** stores `{pricing: Pricing, lineItems: LineItem[]}` and computes via `calculateTotals({ ...createDefaultProposal(), pricing, lineItems })` — reusing the one math impl, zero duplication.
4. **Rich text** — native `contenteditable`, sanitized on every write and paste to the whitelist `p,strong,em,a,ul,ol,li,br` (strip other tags, all inline styles, event handlers, `javascript:` URLs). Evaluating whether a dependency (Tiptap) is warranted; leaning dependency-free given the small fixed feature set (decision logged in HANDOFF).
5. **Storage** — documents under **`bf-docs:`** (free), mirroring `themeStorage` (validate-all-or-nothing, corrupt entries skipped not destroyed, CustomEvent change signal, `useDocs()` hook, JSON export/import with re-key on id collision). Autosave debounced per-document id.

## Deviations from spec vs repo reality (logged)

- **Custom-template prefix collision**: spec 04 says custom doc-builder templates go under `bf-doc-templates:`, but **that prefix is already in active use** by the phase-3 proposal/audit template system. Using a distinct prefix `bf-builder-templates:` for phase-4 doc templates to avoid collision. (Documents use the spec's `bf-docs:`, which is free.)
- File locations follow the repo's real `src/...` layout (spec sketches `components/…`/`lib/…` without `src/`).
- `lib/document-builder/*` per spec paths, adapted under `src/`.

## Regression baseline to protect
Proposals + Audits + Theme Editor must stay byte-identical (phase-3 proved pixel-identical on classic/blank/cover-off). My only shared-file touch is the additive `data-pdf-break-before` in `generateDocumentPdf.ts` + the two wiring edits — all no-ops for existing tools.
