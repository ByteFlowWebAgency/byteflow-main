# ByteFlow Site Audit Service

A standalone Python microservice that crawls a WordPress site and returns a
structured JSON audit covering SEO, on-page accessibility heuristics, WordPress
security/exposure checks, real WCAG 2.2 scanning (via axe-core in a headless
browser), duplicate-content detection, and optional broken-link checking. It
also exports an audit straight into ByteFlow's internal **Document Builder**
(`/internal/documents`) as an importable client-facing report.

Called on-demand by ByteFlow's Next.js internal tool (byteflow.us) via a
server-side API route. **Stateless** — every request is a fresh crawl, no
database, no caching layer.

## Stack

- Python 3.12, FastAPI, Pydantic v2
- [Scrapling](https://github.com/D4Vinci/Scrapling) `Fetcher` / `FetcherSession`
  (pure `curl_cffi`, no browser) for all HTTP-only fetching
- Playwright (Chromium) **only** for the axe-core WCAG phase, where real
  CSS/layout rendering is unavoidable
- axe-core 4.10.3, vendored into the image (never CDN-fetched at request time)

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/health` | Liveness check → `{"status":"ok"}` |
| `POST` | `/audit`  | Run an audit, return the full `AuditResponse` JSON |
| `POST` | `/audit/export/document-builder` | Run an audit **and** return Document Builder import JSON (re-crawls) |
| `POST` | `/export/from-audit` | Convert an **already-run** `AuditResponse` into Document Builder JSON — no re-crawl. Body: `{ "audit": <AuditResponse>, "client_name": "…" }` |

`/export/from-audit` exists so a caller that already ran `/audit` (e.g. the ByteFlow
internal frontend, below) can turn those exact results into a report without paying
for a second crawl — which matters when the audit included the slow WCAG browser pass.

### Auth

A single `AUDIT_API_KEY` env var, checked against an `X-API-Key` request header
— the same env-var-auth pattern as every other ByteFlow internal tool. No user
accounts.

- If `AUDIT_API_KEY` is **set**, requests without a matching `X-API-Key` get `401`.
- If `AUDIT_API_KEY` is **unset**, auth is skipped. This is **dev-only** — never
  deploy to production without it set.

`ALLOWED_ORIGIN` (default `https://byteflow.us`) controls the CORS allow-list.

### Request body (`/audit` and the export endpoint)

```jsonc
{
  "url": "https://example.com/",   // required, root URL of the site
  "max_pages": 40,                  // 1–300, pages to crawl from the sitemap
  "check_broken_links": false,      // HEAD-check every internal link (slower)
  "check_wcag": false,              // real WCAG 2.2 scan via axe-core (much slower)
  "wcag_tags": ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
  "timeout": 20,                    // 5–60 s per request
  "client_name": ""                 // export endpoint only — printed on the cover page
}
```

## Running locally (without Docker)

```bash
cd wp-audit-service
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# One-time: install the Chromium binary Playwright drives (needed for check_wcag).
.venv/bin/playwright install chromium
# On a bare host you may also need system libs: .venv/bin/playwright install-deps chromium

# The vendored axe-core (audit/vendor/axe.min.js) already ships in the repo.
# If it is ever missing, re-fetch the pinned version (see below).

AUDIT_API_KEY=devkey .venv/bin/uvicorn main:app --port 8000
```

Then:

```bash
curl -s -X POST http://localhost:8000/audit \
  -H "Content-Type: application/json" -H "X-API-Key: devkey" \
  -d '{"url":"https://your-wordpress-site.com/","max_pages":20}' | python3 -m json.tool
```

## Running with Docker

```bash
docker build -t byteflow-audit .
docker run -e AUDIT_API_KEY=prodkey -p 8000:8000 byteflow-audit
```

The image installs Chromium via `playwright install --with-deps chromium` and
copies the vendored `audit/vendor/axe.min.js` in with `COPY audit ./audit`, so
no browser download or CDN fetch happens at request time.

## Frontend integration (ByteFlow `/internal`)

This service is driven from the ByteFlow Next.js app at **`/internal/site-audit`**.
The browser never calls this service directly — a server-side proxy holds the key:

```
/internal/site-audit (page, Supabase-gated)
   → src/components/internal-tools/site-audit/SiteAuditApp.tsx (client UI)
      → POST /api/audit  (Next route handler, re-checks the session, adds X-API-Key)
         → this service (/audit  and  /export/from-audit)
```

The page runs the **full audit in one action** (SEO + WordPress/security + broken
links + WCAG, all on by default, each toggleable), renders the findings, then
**"Create Document Builder report"** turns those exact results into a document via
`/export/from-audit` (no re-crawl) and opens it in the Document Builder editor.

Env wiring on the Next side (server-only — no `NEXT_PUBLIC_`):

| Var | Meaning |
|---|---|
| `AUDIT_SERVICE_URL` | Where this service is reachable, e.g. `http://localhost:8000` in dev |
| `AUDIT_API_KEY` | Must match this service's own `AUDIT_API_KEY` (omit only if the service runs keyless in dev) |

### Running the whole thing at once (dev)

Two processes — start this service, then the Next app pointed at it:

```bash
# 1) the audit service
cd wp-audit-service
AUDIT_API_KEY=devkey .venv/bin/uvicorn main:app --port 8000

# 2) the Next app (repo root), with matching env in .env.local:
#    AUDIT_SERVICE_URL=http://localhost:8000
#    AUDIT_API_KEY=devkey
npm run dev
```

Then sign in to `/internal` and open **Site Audit** in the nav.

## WCAG 2.2 scanning — coverage honesty (read this)

`check_wcag: true` runs Deque's **axe-core** engine inside a headless Chromium
page. This is a real, industry-standard rules engine (the same one Lighthouse's
accessibility score is built on) — a big step up from raw-HTML heuristics.

**But automated scanning is inherently partial.** axe-core reliably catches
roughly **30–40 %** of WCAG success criteria (or about **57 %** of issues by
real-world volume per Deque's published research). The remainder needs manual
and assistive-technology testing. Most of what's *new* in WCAG 2.2 is not yet
automatable without excessive false positives (target-size is the main new-2.2
rule axe covers).

Because of this, **every response where `check_wcag: true` was requested
includes a fixed `wcag_disclaimer` string** stating exactly this. It ships in
the API response, not just this README. Never let a report reader conclude that
"axe-core found 0 violations" means "WCAG 2.2 compliant."

**Expected overlap:** axe will re-flag some things Phase 1's heuristics already
catch (e.g. missing alt text shows up as both `images-missing-alt` and axe's
`image-alt`; missing `<html lang>` as both `missing-lang-attribute` and axe's
`html-has-lang`). This overlap is **intentional and not deduplicated** — the two
systems answer different questions (fast heuristic triage vs. rendered-DOM
rules), and fragile cross-system dedup logic would do more harm than good.

**Runtime tradeoff:** WCAG scanning renders every 200-status page in a real
browser, so it is the slowest part of an audit. To keep large sites from timing
out, the scan (a) launches ONE Chromium instance and scans several pages **in
parallel** (tabs), and (b) waits for the page `load` event rather than
`networkidle` — `networkidle` never settles on pages with analytics/chat/tracking
connections and used to burn the full per-page timeout on every page. It stays
opt-in — leave `check_wcag` off for a fast SEO/security-only pass.

**Tuning for large or slow sites** (all optional env vars on the service):

| Var | Default | Effect |
|---|---|---|
| `AUDIT_WCAG_CONCURRENCY` | `4` | Pages scanned at once. Raise for speed if the box has RAM/CPU; lower to be gentle. |
| `AUDIT_WCAG_PAGE_TIMEOUT_MS` | `20000` | Max wait for a page to load before scanning whatever rendered. |

Broken-link checking also runs its (capped-at-200) HTTP checks concurrently. On
the **web** side, the proxy's overall wait is `AUDIT_REQUEST_TIMEOUT_MS` (default
`600000` = 10 min); raise it if you audit very large sites. If you still hit the
ceiling, drop `max_pages` or run a fast pass with `check_wcag` off first.

### Updating the vendored axe-core

axe-core is pinned to **4.10.3** and lives at `audit/vendor/axe.min.js`. Pin
deliberately; don't track `latest`. To repin, check
<https://cdnjs.com/libraries/axe-core> for the current release and run:

```bash
curl -sL -o audit/vendor/axe.min.js \
  https://cdnjs.cloudflare.com/ajax/libs/axe-core/<VERSION>/axe.min.js
```

## Broken-link checking

With `check_broken_links: true`, every internal link found on every
successfully-fetched page is collected, deduped, capped at 200 outbound checks,
and HEAD-checked (falling back to GET if a server returns `405`). Any link that
returns 4xx/5xx (or errors) is reported as a `broken-internal-link` (severity
`high`) on **each** source page that linked to it. Off by default (it's slower).

## Document Builder export

`POST /audit/export/document-builder` re-runs the audit fresh (stateless — no
caching) and returns a **bare `document` object** (a one-off document, not a
reusable template) ready for ByteFlow's Document Builder.

**How to use the output:** go to `/internal/documents` → the main Documents list
page → the **"Import JSON"** button, and paste the response. Do **not** use the
"+ New document" dialog's "Import template" button — that expects the *wrapped
template* shape, whereas this exporter deliberately produces the bare one-off
`document` object.

The report is structured as: cover → executive summary → WordPress & site-wide
findings → page-by-page findings → duplicate-content findings → closing.
Per-page tables show the 8 highest-severity items with a "+N more" note beyond
that (it's a summary, not the raw JSON dump). Pass `client_name` to print the
client's name on the cover page.

## Response shape (`/audit`)

Top level: `site`, `crawled_at`, `wordpress` (detection + version + REST API),
`site_findings[]`, `pages[]` (each with `issues[]` and, when scanned,
`wcag_violations[]`), `duplicates` (titles / meta_descriptions / content),
`summary` (severity counts + pages crawled/failed), and `wcag_disclaimer`
(present only when `check_wcag` was true).

Severity scale: `critical | high | medium | low | info`. axe's own impact scale
(`critical | serious | moderate | minor`) is preserved on each WCAG violation
and also mapped onto the service scale for the top-level `summary` counts.

## Smoke tests

A reproducible static fixture site under `fixture_site/` exercises every check.
Serve it with `python3 -m http.server 8931 --directory fixture_site` and point
an audit at `http://localhost:8931/`. See the phase build docs
(`01_BASE_AUDIT_SERVICE.md`, `02_WCAG_AXE_INTEGRATION.md`,
`03_DOCUMENT_BUILDER_EXPORT.md`) for the exact expected findings.

## Implementation notes / deviations from the original spec

- **Broken-link HEAD requests** use `curl_cffi.requests.head` (curl_cffi is
  Scrapling's own HTTP backend). Scrapling's `Fetcher` has no `.head` method in
  0.4.11, so the spec's `Fetcher.head` isn't available; the GET fallback still
  goes through `Fetcher.get`. Same HTTP engine, same behavior the spec intended.
- **axe-core is vendored in-repo** at `audit/vendor/axe.min.js` and copied into
  the image, rather than `curl`-ed inside the Dockerfile. `python:3.12-slim` has
  no `curl`, and committing the pinned file is fully reproducible and offline-
  buildable — it honors the spec's core requirement (no runtime CDN dependency)
  more robustly. Refresh instructions are above.
- The WCAG smoke-test fixture adds one bare `<input type="text">`: axe (per the
  accessible-name spec) treats a `placeholder` as a fallback accessible name, so
  the spec's placeholder-only input does not trip the label rule — the bare
  input makes the `wcag412`/`cat.forms` violation unambiguous.
