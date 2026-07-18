from __future__ import annotations

from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import Dict, List, Optional
from urllib.parse import urldefrag, urljoin, urlparse

from curl_cffi import requests as _creq
from scrapling.fetchers import Fetcher, FetcherSession

from audit.checks import _issue, run_page_checks
from audit.models import (
    WCAG_COVERAGE_DISCLAIMER,
    AuditRequest,
    AuditResponse,
    DuplicateGroup,
    Duplicates,
    Issue,
    PageResult,
    Summary,
    WordPressInfo,
)
from audit.site_checks import detect_wordpress, run_site_checks

MAX_CHILD_SITEMAPS = 10
MAX_LINKS_CHECKED = 200  # cap outbound broken-link HTTP checks to avoid runaway crawls
BROKEN_LINK_WORKERS = 10  # concurrent broken-link HTTP checks


def _link_status(link: str, timeout: int) -> Optional[int]:
    """HEAD-check a single link, falling back to a GET if the server rejects
    HEAD with a 405. scrapling's Fetcher has no ``.head`` in this version, so
    the HEAD is issued via curl_cffi (the very HTTP backend scrapling wraps);
    the GET fallback goes through Fetcher for consistency with the rest of the
    crawl. Returns the final HTTP status code, or ``None`` if the request
    raised (DNS failure, connection refused, timeout, ...)."""
    try:
        resp = _creq.head(link, timeout=timeout, allow_redirects=True)
        if resp.status_code == 405:
            return Fetcher.get(link, timeout=timeout).status
        return resp.status_code
    except Exception:
        return None


def _same_domain(url: str, base_netloc: str) -> bool:
    try:
        return urlparse(url).netloc == base_netloc
    except Exception:
        return False


def _discover_from_sitemap(sitemap_url: str, timeout: int, base_netloc: str, depth: int = 0) -> List[str]:
    urls: List[str] = []
    try:
        page = Fetcher.get(sitemap_url, timeout=timeout)
    except Exception:
        return urls
    if page.status != 200:
        return urls

    locs = page.css("loc::text").getall()
    if not locs:
        return urls

    is_index = bool(page.css("sitemapindex")) or bool(page.css("sitemap"))
    if is_index and depth == 0:
        for child in locs[:MAX_CHILD_SITEMAPS]:
            urls += _discover_from_sitemap(child.strip(), timeout, base_netloc, depth=1)
    else:
        urls += [loc.strip() for loc in locs if _same_domain(loc.strip(), base_netloc)]
    return urls


def _discover_urls(base_url: str, max_pages: int, timeout: int) -> List[str]:
    base_netloc = urlparse(base_url).netloc
    sitemap_candidates = []

    try:
        robots = Fetcher.get(urljoin(base_url, "/robots.txt"), timeout=timeout)
        if robots.status == 200:
            for line in robots.body.decode("utf-8", errors="ignore").splitlines():
                if line.lower().startswith("sitemap:"):
                    sitemap_candidates.append(line.split(":", 1)[1].strip())
    except Exception:
        pass

    if not sitemap_candidates:
        sitemap_candidates = [urljoin(base_url, "/sitemap.xml"), urljoin(base_url, "/sitemap_index.xml")]

    all_urls: List[str] = []
    for candidate in sitemap_candidates:
        found = _discover_from_sitemap(candidate, timeout, base_netloc)
        if found:
            all_urls += found

    # de-dupe, preserve order
    seen = set()
    deduped = []
    for u in all_urls:
        if u not in seen:
            seen.add(u)
            deduped.append(u)

    if deduped:
        return deduped[:max_pages]

    # Fallback: no sitemap found anywhere -> crawl links off the homepage.
    # Dedupe base_url out of the homepage's own links: WP homepages self-link to
    # "/" (logo / "Home" nav), and urljoin(base_url, "/") == base_url exactly, so
    # without this the homepage would be crawled twice and produce phantom
    # duplicate-title/meta/content findings. Order-preserving dedup, then cap.
    try:
        home = Fetcher.get(base_url, timeout=timeout)
        links = home.css("a::attr(href)").getall()
        resolved = {urljoin(base_url, h) for h in links}
        same_site = [u for u in resolved if _same_domain(u, base_netloc)]
        return list(dict.fromkeys([base_url] + same_site))[:max_pages]
    except Exception:
        return [base_url]


def _severity_counts(all_issues: List[Dict]) -> Counter:
    return Counter(i["severity"] for i in all_issues)


def run_audit(request: AuditRequest) -> AuditResponse:
    base_url = str(request.url)
    base_netloc = urlparse(base_url).netloc
    timeout = request.timeout

    site_issue_dicts, rest_api_available = run_site_checks(base_url, timeout)

    urls = _discover_urls(base_url, request.max_pages, timeout)

    pages: List[PageResult] = []
    all_issue_dicts: List[Dict] = list(site_issue_dicts)
    titles_map = defaultdict(list)
    descriptions_map = defaultdict(list)
    fingerprints_map = defaultdict(list)
    link_sources: Dict[str, List[str]] = defaultdict(list)  # internal link -> pages that linked to it
    pages_failed = 0
    homepage_response = None

    with FetcherSession(impersonate="chrome", stealthy_headers=True, timeout=timeout, retries=1) as session:
        for url in urls:
            try:
                page = session.get(url)
            except Exception as exc:
                pages_failed += 1
                pages.append(PageResult(url=url, status=None, title=None, issues=[
                    Issue(id="fetch-failed", severity="high", title="Could not fetch page",
                          detail=str(exc), url=url)
                ]))
                continue

            if url == base_url or homepage_response is None:
                homepage_response = page

            if page.status != 200:
                pages_failed += 1
                pages.append(PageResult(url=url, status=page.status, title=None, issues=[
                    Issue(id="non-200-status", severity="high", title=f"Page returned HTTP {page.status}",
                          detail="A page listed in the sitemap did not return a normal 200 response.", url=url)
                ]))
                continue

            issue_dicts, data = run_page_checks(page, url)
            all_issue_dicts += issue_dicts

            if data["title"]:
                titles_map[data["title"]].append(url)
            if data["description"]:
                descriptions_map[data["description"]].append(url)
            fingerprints_map[data["fingerprint"]].append(url)

            if request.check_broken_links:
                for href in page.css("a::attr(href)").getall():
                    resolved, _frag = urldefrag(urljoin(url, href))  # drop #fragments
                    if resolved and _same_domain(resolved, base_netloc):
                        link_sources[resolved].append(url)

            pages.append(PageResult(
                url=url,
                status=page.status,
                title=data["title"] or None,
                issues=[Issue(**i) for i in issue_dicts],
            ))

    # Broken-link checking (opt-in via request.check_broken_links). We dedupe
    # the outbound HTTP checks (each distinct link is fetched at most once, even
    # if many pages reference it) but deliberately do NOT dedupe the resulting
    # issues: a broken link is reported once on every source page that linked to
    # it. Outbound checks are capped at MAX_LINKS_CHECKED to bound large sites.
    broken_link_dicts: List[Dict] = []
    if request.check_broken_links and link_sources:
        links_to_check = list(link_sources.keys())[:MAX_LINKS_CHECKED]
        # Check links concurrently — these are independent blocking HTTP calls,
        # so a small thread pool collapses wall-time on link-heavy sites (an
        # otherwise sequential 200-link pass could take minutes).
        statuses: Dict[str, Optional[int]] = {}
        with ThreadPoolExecutor(max_workers=BROKEN_LINK_WORKERS) as pool:
            futures = {pool.submit(_link_status, link, timeout): link for link in links_to_check}
            for fut in as_completed(futures):
                statuses[futures[fut]] = fut.result()  # _link_status never raises; None on error
        for link in links_to_check:  # rebuild issues in a deterministic order
            status = statuses.get(link)
            if status is None or status >= 400:
                where = f"HTTP {status}" if status is not None else "a connection error"
                detail = f"Internal link to {link} returned {where} — the link appears broken."
                for source in dict.fromkeys(link_sources[link]):  # unique source pages, order-preserving
                    broken_link_dicts.append(_issue(
                        "broken-internal-link", "high", "Broken internal link", detail, source))
        all_issue_dicts += broken_link_dicts

        # Attach each broken-link issue to the PageResult of the page it was found on.
        if broken_link_dicts:
            page_by_url = {p.url: p for p in pages}
            for d in broken_link_dicts:
                pr = page_by_url.get(d["url"])
                if pr is not None:
                    pr.issues.append(Issue(**d))

    # Duplicate detection across the crawled set
    dup_titles = [DuplicateGroup(value=t, urls=u) for t, u in titles_map.items() if len(u) > 1]
    dup_descs = [DuplicateGroup(value=d, urls=u) for d, u in descriptions_map.items() if len(u) > 1]
    dup_content = [DuplicateGroup(value=f, urls=u) for f, u in fingerprints_map.items() if len(u) > 1]

    for group in dup_titles:
        all_issue_dicts.append({
            "id": "duplicate-title", "severity": "medium", "title": "Duplicate title tag across pages",
            "detail": f"{len(group.urls)} pages share the exact same <title>: \"{group.value}\"",
            "url": group.urls[0],
        })
    for group in dup_descs:
        all_issue_dicts.append({
            "id": "duplicate-meta-description", "severity": "medium", "title": "Duplicate meta description across pages",
            "detail": f"{len(group.urls)} pages share the exact same meta description.",
            "url": group.urls[0],
        })
    for group in dup_content:
        all_issue_dicts.append({
            "id": "duplicate-content", "severity": "medium", "title": "Near-duplicate page content",
            "detail": f"{len(group.urls)} pages have near-identical body text — possible template/boilerplate "
                      "pages or accidental duplicates.",
            "url": group.urls[0],
        })

    wp_info_dict = {"detected": False, "version": None, "generator_raw": None}
    if homepage_response is not None:
        wp_info_dict = detect_wordpress(homepage_response)
    wp_info = WordPressInfo(**wp_info_dict, rest_api_available=rest_api_available)

    # WCAG 2.2 scan via axe-core (opt-in, browser-rendered, several sec/page).
    # Only scan pages that already returned a 200 in the HTTP pass — no point
    # rendering a page that 404'd. Overlap with Phase 1's heuristic a11y checks
    # (e.g. both flag missing alt text) is expected; we deliberately do NOT
    # dedupe between the two systems (see README). Imported lazily so the rest
    # of the service — and the non-WCAG code path — never needs Playwright.
    wcag_disclaimer = None
    if request.check_wcag:
        from audit.wcag import run_axe_scan, to_wcag_violation

        ok_urls = [p.url for p in pages if p.status == 200]
        axe_raw = run_axe_scan(ok_urls, request.wcag_tags)
        page_by_url = {p.url: p for p in pages}
        for scanned_url, raw_violations in axe_raw.items():
            pr = page_by_url.get(scanned_url)
            if pr is not None:
                pr.wcag_violations = [to_wcag_violation(r) for r in raw_violations]
        wcag_disclaimer = WCAG_COVERAGE_DISCLAIMER

    counts = _severity_counts(all_issue_dicts)
    if request.check_wcag:
        # Roll axe violations into the top-level severity counts (via the mapped
        # severity) so the summary reflects true risk, not just Phase 1 findings.
        from audit.wcag import severity_for_impact
        for pr in pages:
            for violation in (pr.wcag_violations or []):
                counts[severity_for_impact(violation.impact)] += 1

    summary = Summary(
        critical=counts.get("critical", 0),
        high=counts.get("high", 0),
        medium=counts.get("medium", 0),
        low=counts.get("low", 0),
        info=counts.get("info", 0),
        pages_crawled=len(urls) - pages_failed,
        pages_failed=pages_failed,
    )

    return AuditResponse(
        site=base_url,
        crawled_at=datetime.now(timezone.utc),
        wordpress=wp_info,
        site_findings=[Issue(**i) for i in site_issue_dicts],
        pages=pages,
        duplicates=Duplicates(titles=dup_titles, meta_descriptions=dup_descs, content=dup_content),
        summary=summary,
        wcag_disclaimer=wcag_disclaimer,
    )
