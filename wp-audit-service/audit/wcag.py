"""
Real WCAG 2.2 scanning via axe-core, run inside a headless Chromium browser.

Phase 1's accessibility checks (missing-lang-attribute, empty-links,
images-missing-alt) are raw-HTML heuristics. This module runs Deque's axe-core
rules engine against a fully rendered DOM, so contrast ratios, computed
visibility, accessible-name computation, and target size (things that require
real CSS/layout) are evaluated properly instead of guessed at.

Performance: pages are scanned CONCURRENTLY (a bounded number of tabs in one
browser) and navigation waits for the `load` event rather than `networkidle`.
`networkidle` never settles on pages that hold open analytics / chat / tracking
connections, so it used to burn the full per-page timeout on every page and made
large sites time out; `load` still gives axe a fully styled DOM (needed for
contrast/layout) without waiting on background chatter.

Coverage is deliberately partial and honest about it — see
WCAG_COVERAGE_DISCLAIMER in audit/models.py, which ships in the API response
whenever a WCAG scan was requested.
"""
from __future__ import annotations

import asyncio
import os
from typing import Dict, List, Optional

from playwright.async_api import TimeoutError as PlaywrightTimeoutError
from playwright.async_api import async_playwright

from audit.models import WcagNode, WcagViolation

# axe-core is vendored (see README / Dockerfile), never fetched from a CDN at
# request time. Resolve relative to THIS file so it works no matter what the
# process's current working directory happens to be.
AXE_SCRIPT_PATH = os.path.join(os.path.dirname(__file__), "vendor", "axe.min.js")

# axe's own impact scale -> the critical/high/medium/low scale the rest of the
# service uses. Note axe has no "info" level; we don't invent one.
IMPACT_TO_SEVERITY = {
    "critical": "critical",
    "serious": "high",
    "moderate": "medium",
    "minor": "low",
}

DEFAULT_CONCURRENCY = 6      # tabs scanned at once — balances speed vs. memory
DEFAULT_PAGE_TIMEOUT_MS = 12000  # heavy real-world pages seldom need longer to be styled


def severity_for_impact(impact: str) -> str:
    """Map an axe impact string onto the service-wide severity scale. Anything
    unexpected (or a null impact) falls back to 'medium' rather than being
    dropped from the summary counts."""
    return IMPACT_TO_SEVERITY.get(impact or "", "medium")


def _env_int(name: str, default: int, lo: int, hi: int) -> int:
    try:
        return max(lo, min(hi, int(os.environ[name])))
    except (KeyError, ValueError):
        return default


def _axe_failed(exc: Exception) -> dict:
    return {
        "id": "axe-scan-failed", "impact": "moderate",
        "description": str(exc), "help": "Could not complete axe scan",
        "helpUrl": "", "tags": [], "nodes": [],
    }


async def _scan_one(browser, sem, url: str, tags: List[str], timeout_ms: int):
    """Scan a single URL in its own page (a tab), bounded by the semaphore."""
    async with sem:
        page = await browser.new_page()
        try:
            try:
                # `load` (not `networkidle`): fires once CSS/images are in — which is
                # what axe needs for contrast/layout — WITHOUT waiting on analytics/
                # chat beacons that keep the network busy indefinitely.
                await page.goto(url, timeout=timeout_ms, wait_until="load")
            except PlaywrightTimeoutError:
                # A genuinely slow page: scan whatever has rendered by now rather
                # than failing the whole page. The DOM/CSS is usually already there.
                pass
            await page.add_script_tag(path=AXE_SCRIPT_PATH)
            axe_results = await page.evaluate(
                """(tags) => axe.run(document, { runOnly: { type: 'tag', values: tags } })""",
                tags,
            )
            return url, axe_results.get("violations", [])
        except Exception as exc:  # noqa: BLE001 - report the failure, don't crash the whole audit
            return url, [_axe_failed(exc)]
        finally:
            await page.close()


async def _scan_all(urls: List[str], tags: List[str], timeout_ms: int, concurrency: int):
    sem = asyncio.Semaphore(concurrency)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        try:
            pairs = await asyncio.gather(
                *(_scan_one(browser, sem, url, tags, timeout_ms) for url in urls)
            )
        finally:
            await browser.close()
    return dict(pairs)


def run_axe_scan(
    urls: List[str],
    tags: List[str],
    timeout_ms: Optional[int] = None,
    concurrency: Optional[int] = None,
) -> Dict[str, List[dict]]:
    """Run axe-core against each URL and return {url: [raw_violation_dict, ...]}.

    ONE Chromium instance is launched for the whole scan; up to `concurrency`
    pages are scanned in parallel (override with AUDIT_WCAG_CONCURRENCY). A URL
    whose scan blows up gets a single synthetic 'axe-scan-failed' violation
    rather than silently disappearing from the report.

    Called synchronously from the (sync, thread-pooled) FastAPI endpoint, so it
    spins up its own event loop via asyncio.run — safe because the worker thread
    has no running loop of its own.
    """
    if not urls:
        return {}
    timeout_ms = timeout_ms or _env_int("AUDIT_WCAG_PAGE_TIMEOUT_MS", DEFAULT_PAGE_TIMEOUT_MS, 3000, 60000)
    concurrency = concurrency or _env_int("AUDIT_WCAG_CONCURRENCY", DEFAULT_CONCURRENCY, 1, 16)
    # Visible in `docker compose logs audit-service` — also confirms THIS (parallel,
    # load-wait) code is the one running, not a stale image.
    print(
        f"[wcag] scanning {len(urls)} page(s) with concurrency={concurrency}, "
        f"page_timeout={timeout_ms}ms (wait_until=load)",
        flush=True,
    )
    return asyncio.run(_scan_all(urls, tags, timeout_ms, concurrency))


def to_wcag_violation(raw: dict) -> WcagViolation:
    """Convert one raw axe violation dict into a WcagViolation model, translating
    axe's field names (helpUrl, failureSummary) to ours and coercing axe's
    target arrays (occasionally nested for shadow-DOM / cross-frame selectors)
    into a flat list of strings."""
    nodes = [
        WcagNode(
            html=n.get("html", "") or "",
            target=[str(t) for t in (n.get("target") or [])],
            failure_summary=n.get("failureSummary"),
        )
        for n in (raw.get("nodes") or [])
    ]
    return WcagViolation(
        id=raw.get("id", "") or "",
        impact=raw.get("impact") or "minor",
        description=raw.get("description", "") or "",
        help=raw.get("help", "") or "",
        help_url=raw.get("helpUrl", "") or "",
        wcag_tags=[str(t) for t in (raw.get("tags") or [])],
        nodes=nodes,
    )
