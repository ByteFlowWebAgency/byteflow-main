# Proposal Tool — Discovery (Phase 1)

Date: 2026-07-12 (overnight autonomous build). Findings from inspecting the repo before
writing any feature code.

## Framework & tooling

- **Next.js 15.5.12, App Router**, React 19.2.4, TypeScript 5.4 (strict mode).
- Source lives under **`src/`** — `src/app`, `src/components`, `src/lib`. The architecture
  spec's `app/…` / `components/…` / `lib/…` paths are adapted to `src/…` throughout.
- Path alias: `@/*` → `./src/*` (tsconfig).
- Package manager: **npm** (`package-lock.json` present; no pnpm/yarn lockfiles).
- Lint: `next lint` (ESLint 8 + eslint-config-next). Baseline: **clean**.
- Type-check: `npx tsc --noEmit`. Baseline: **clean**.
- No test runner is configured in this repo.

## Build baseline (important)

`npm run build` on this machine **compiles and type-checks successfully**, then fails at
"Collecting page data" with `Error: CONTENTFUL_ACCESS_TOKEN must be set` (from
`generateStaticParams` on `/work/case-studies/[slug]`). There is **no `.env.local`** on this
machine and no Contentful credentials available. This failure is **pre-existing and
environmental** — the phase-gate check for this build is therefore:
"✓ Compiled successfully" + "Linting and checking validity of types" passes with **zero new
errors**, plus `npm run lint` and `npx tsc --noEmit` clean.

## Styling approach

- **CSS Modules per component + global CSS custom properties** in `src/app/globals.css`.
  No Tailwind, no CSS-in-JS anywhere. This matches the spec's mandated approach exactly —
  no adaptation needed.
- Real brand tokens live in `src/app/globals.css` `:root` (full extraction in
  `DESIGN-TOKENS.md`, Phase 3). Summary: ink-dark canvas `#0B0F1F`, white foreground with
  opacity-stepped muted tiers, brand accents indigo `#6366F1` / violet `#8B5CF6` / cyan
  `#06B6D4`, and signature gradients (`--grad-primary`, `--grad-text`). **Not** the
  near-monochrome palette the spec guessed at — the spec said to confirm real values, and
  these are them.
- Fonts via `next/font/google` in `src/app/layout.tsx`: **Plus Jakarta Sans**
  (300–700, `--font-jakarta`, body + display) and **JetBrains Mono** (400/500, `--font-mono`).
- Focus ring convention: 2px `--cyan-400` outline, 3px offset (globals.css).
- Radius/spacing conventions: rounded cards (glass panels, 1px `--line` borders), generous
  whitespace, `ScrollReveal` entrance animations on marketing pages.

## Logo

- Local asset: **`public/BYTEFLOW_LOGO.png`** (used as the Footer's fallback logo).
- Nav/Footer normally render a Contentful-hosted logo asset
  (`Byteflo-logo-Alpha__1_.png` on images.ctfassets.net); `/BYTEFLOW_LOGO.png` is the
  committed-in-repo fallback and is the reliable choice for the proposal document (works
  offline/at build, no CDN dependency).

## Layout structure (affects this feature)

- `src/app/layout.tsx` is the **single root layout**: it fetches the Header and Footer from
  Contentful (`getHeader()`/`getFooter()`, uncaught) and wraps **every** route in the
  marketing `<Nav>` (position: fixed) and `<Footer>`. Consequences:
  - `/internal/*` pages will inherit the marketing Nav/Footer. Opting out would require a
    route-group restructure of existing pages — prohibited by guardrails. Accepted; the
    tool's own layout adds top clearance for the fixed Nav. PDF capture targets only the
    document node, so Nav/Footer never appear in exports.
  - Without Contentful credentials the root layout throws at request time, which limits
    in-browser QA on this machine (see HANDOFF).
- No `src/middleware.ts` exists yet — free for the auth gate (spec 07 explicitly allows
  middleware for the session check; middleware also keeps the gate testable without
  Contentful, since it runs before any rendering).

## Contentful content model (from `src/lib/contentful/types/` and `Contentful-data/` JSON dumps)

Content types: `page`, `section`, `sectionHeader`, `hero`, `featureCard`, `caseStudy`,
`ctaCard`, `header`, `footer`, `footerColumn`, `navLink`, `seo`.

- **There is no standalone "service" content type.** The six practices are `featureCard`
  entries inside the services page's second section, fetched via `getPage('services')` and
  extracted with `cardsOf(sections[1])` (`src/app/services/page.tsx`).
- The six practice titles (from the live services-page data dump):
  1. Enterprise Software Solutions
  2. Custom Development
  3. AI Integration
  4. Cloud Solutions
  5. SEO & Digital Growth
  6. Consulting & Host Management
  (The footer nav shortens two of these to "Enterprise Software" / "Consulting".)
- Plan: the proposal tool's server `page.tsx` will attempt the same `getPage('services')`
  fetch to source service labels from the shared source of truth, with a **try/catch static
  fallback** to the six titles above so the tool never crashes when Contentful is
  unavailable (and so local builds keep working).
- Footer columns are nav links only — **no contact email/phone exists in the footer data**.
  Footer tagline: "Software engineering for teams that take shipping seriously." Copyright:
  "© 2026 BYTEFLOW Solutions…". The document footer will follow these conventions.

## Prior art search (per 01-CONTEXT)

- Searched all of `src/` for `roi`, `calculator`, `proposal` (case-insensitive): the only
  hit was a false positive (`heroInner` contains "roi"). **No ROI-calculator or proposal/PDF
  code exists in this repo** — the past client ROI calculator / branded proposal mentioned
  in the context spec lives elsewhere. Building from zero per the specs; nothing to reuse.
- No PDF, canvas, or print-related code exists in the repo.

## Existing routes

`/` `/about` `/services` `/work` `/work/case-studies/[slug]` `/contact`, plus API routes
`/api/contact` (SendGrid contact form) and `/api/contentful/revalidate` (webhook). No
`/internal` namespace exists — free to claim.

## robots.txt / sitemap

**Neither exists** (no `public/robots.txt`, no `src/app/robots.ts`, no sitemap). Spec 07
says add `Disallow: /internal` "if this repo has one" — it doesn't, and guardrails prohibit
touching SEO surface area, so no robots.txt is being created. Noted in HANDOFF: the internal
route is protected by real auth, not by robots exclusion (which is advisory anyway).

## Pre-existing working-tree oddities (not touched by this work)

- `package-lock.json` has an uncommitted 2-line change syncing its version fields
  (1.0.0 → 1.1.1) with package.json. Harmless; will be absorbed when this feature's
  dependencies are installed.
- **`sendgrid.env` is committed to git and appears to contain a SendGrid API key** (196
  bytes, `SG.`-prefixed content). The `.gitignore` line intended to exclude it is corrupted
  (`*.envs e n d g r i d . e n v` — UTF-16/copy-paste mangling). ⚠️ Flagged prominently in
  HANDOFF — the key should be rotated and the file purged; not remediated overnight because
  history rewriting is destructive and out of scope.
- `lint.json` at repo root is a stale UTF-16 ESLint output dump from a Windows machine.
  Ignored.
- Untracked `0X-*.md` spec files in the repo root are the build instructions for this
  feature; left untracked deliberately.

## Branch

Work proceeds on **`feat/proposal-tool`**, branched from `289deb4` (the
`feature/project-scoping` HEAD, which matches the latest `dev` merge). Nothing is committed
to `main`.
