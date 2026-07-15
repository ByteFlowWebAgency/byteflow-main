# Slides (Presentations) — Discovery

Branch **`feat/internal-tools-slides`**, off `feat/internal-tools-phase4` at the point where the
Document Builder, a Supabase-Auth login rewrite, and a Proposal/Audit-tool consolidation had all
just landed. Read `docs/phase4/HANDOFF.md` (most recent by mtime) plus this session's own recent
work to confirm current reality — the handoff is stale on two points corrected below.

## What's actually true right now (vs. what the master prompt assumes)

**Hub + login gate**: `/internal` hub at `src/app/internal/(protected)/page.tsx`, tiles via
`HubTile` (`{ title, description, monogram, href?, status: 'live' | 'coming-soon' }`). No
"Presentations"/"coming soon" placeholder tile exists to replace — this will be a new tile,
inserted live.

Auth is **not** what `docs/phase4/HANDOFF.md` describes (that doc predates it). It's real
**Supabase Auth** now: `src/middleware.ts` + `(protected)/layout.tsx` both call
`getCurrentInternalUser()` (`src/lib/internal-tools/auth/server.ts`), sign-up restricted
server-side (and by a Postgres trigger) to `@byteflowsolutions.com` emails. Irrelevant to
tonight's work beyond "the gate exists and every `/internal` page sits behind it the same way" —
Slides needs no auth-specific code, same as every other tool.

**Proposal and Audit tools no longer exist** — removed this session, consolidated into Document
Builder. Their shared pricing math and audit-category vocabulary now live at
`src/lib/internal-tools/pricing.ts` (`Pricing`, `LineItem`, `calculateTotals`) and
`src/lib/internal-tools/findingCategories.ts`. Slides has no dependency on either per
`01-CONTEXT-AND-SCOPE.md` ("not a dependency... confirm what actually exists and adapt") — it
implements its own `pricingInvestment` total math fresh, per `02-SLIDE-DATA-MODEL.md`'s explicit
instruction, so this is a non-event, just noted for accuracy.

**Document Builder** (`/internal/documents`) is live and unrelated — pages/blocks composition,
`bf-docs:`/`bf-builder-templates:` localStorage prefixes. Confirmed sibling, not a dependency,
per spec. Not touched tonight.

## Theme system — confirmed shape (`src/components/internal-tools/themes/`)

Exactly what the spec assumes, verified directly against source:

```ts
// themeTypes.ts
interface ThemeColors { background: string; foreground: string; accent: string; muted: string; gradient?: [string, string, string]; }
// all colors are 6-digit hex WITH a leading '#', validated by HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/
interface Theme { id: string; name: string; isBuiltIn: boolean; colors: ThemeColors; fonts: { display: string; body: string }; coverPage: { fullBleedBackground: boolean }; }
```

- `builtInThemes.ts` — `CLASSIC_THEME` (light, `#f7f7fa`/`#0b0f1f`/`#6366f1`) and `DARK_THEME`
  (`#0d1226`/`#f5f6fb`/`#818cf8`), `BUILT_IN_THEMES`, `getBuiltInTheme(id)`.
- `themeStorage.ts` — `useCustomThemes()` hook for user-created themes (same validation).
- `ThemePicker.tsx` — `{ id, value, onChange, missing? }`, built-ins then an optgroup of custom
  themes; reused as-is per spec, no changes.
- `ThemedDocument.tsx` — wraps children, sets theme values as inline CSS custom properties via
  `themeToCss(theme)`. This is a DOM/CSS-variable mechanism — **directly reusable for the
  on-screen slide preview** (Phase 4), not usable for `.pptx` generation (Phase 3), which needs
  the raw hex/font values read directly off the `Theme` object instead.

**Font gotcha for PPTX export**: `theme.fonts.display`/`.body` are CSS stack strings (e.g.
`"var(--font-jakarta), system-ui, -apple-system, 'Segoe UI', sans-serif"`), not plain font names.
`pptxgenjs`'s `fontFace` option needs an actual installed font name PowerPoint can resolve, not a
CSS stack. Phase 3 needs a small stack-to-font-name mapping keyed off `CURATED_FONTS[].id`
(`brand-sans` → `"Plus Jakarta Sans"`, `brand-mono` → `"JetBrains Mono"`, `system-sans` →
`"Arial"`, `system-serif` → `"Georgia"`) — a reasonable, safe, additive choice; logged here rather
than asked, per `00-GUARDRAILS.md`.

## Reusable conventions confirmed

- **localStorage prefixes in use**: `bf-docs:`, `bf-builder-templates:`, `bf-themes:`. No
  collision with the spec's `bf-slides:` — clear to use as specified.
- **`sanitizeFilePart`** (exported from `src/components/internal-tools/pdf/generateDocumentPdf.ts`)
  is the existing filesystem-safe-filename convention for downloads — reused for `.pptx`
  filenames per `05-PPTX-EXPORT.md`'s "matching the convention already used for PDF filenames."
- **`robots.ts`** already disallows the `/internal` prefix broadly — `/internal/slides` is
  covered with no changes needed.
- Storage-adapter pattern (list/get/save/delete, `useX()` live hook, all-or-nothing JSON
  import/export validation, corrupt-entry-skipped-never-destroyed) is consistent across
  `document-builder/storage.ts` and the theme/template storages — Slides' `lib/slides/storage.ts`
  follows the identical shape.

## Plan for tonight, adjusted for the above

No spec adjustments needed beyond the font-name mapping noted above — the repo's real theme
system matches `01`–`06`'s assumptions closely enough that the spec's file layout and reuse plan
stand as written, with paths under the real `src/` root. Proceeding to Phase 2 (data model).
