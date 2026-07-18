"""
Individual audit checks. Every page-level check function takes a scrapling
Response (or Selector) plus the URL it came from, and returns a list of Issue
dicts. Kept as plain functions (not classes) so new checks are just "add a
function + register it in PAGE_CHECKS".
"""
from __future__ import annotations

import hashlib
import re
from typing import Dict, List
from urllib.parse import urlparse

TEST_URL_PATTERNS = ("/test", "/staging", "/temp", "/tmp", "/draft", "?p=", "/wp-admin")
TEST_TITLE_PATTERNS = ("test page", "do not use", "lorem ipsum", "coming soon", "sample page")


def _issue(id_, severity, title, detail, url=None):
    return {"id": id_, "severity": severity, "title": title, "detail": detail, "url": url}


def check_title(page, url) -> (List[Dict], str):
    issues = []
    title = (page.css("title::text").get() or "").strip()
    if not title:
        issues.append(_issue("missing-title", "high", "Missing <title> tag",
                              "Page has no <title>, which hurts click-through from search results.", url))
    elif len(title) > 60:
        issues.append(_issue("title-too-long", "low", "Title tag too long",
                              f"Title is {len(title)} chars; Google typically truncates past ~60.", url))
    elif len(title) < 15:
        issues.append(_issue("title-too-short", "low", "Title tag very short",
                              f"Title is only {len(title)} chars — likely not descriptive enough.", url))
    return issues, title


def check_meta_description(page, url) -> (List[Dict], str):
    issues = []
    desc = (page.css('meta[name="description"]::attr(content)').get() or "").strip()
    if not desc:
        issues.append(_issue("missing-meta-description", "medium", "Missing meta description",
                              "No meta description found; search engines will auto-generate a snippet.", url))
    elif len(desc) > 160:
        issues.append(_issue("meta-description-too-long", "low", "Meta description too long",
                              f"Description is {len(desc)} chars; likely truncated past ~160.", url))
    elif len(desc) < 50:
        issues.append(_issue("meta-description-too-short", "low", "Meta description very short",
                              f"Description is only {len(desc)} chars.", url))
    return issues, desc


def check_h1(page, url) -> List[Dict]:
    h1s = page.css("h1")
    count = len(h1s)
    if count == 0:
        return [_issue("missing-h1", "high", "Missing H1",
                        "No <h1> found on this page — hurts on-page SEO structure and accessibility.", url)]
    if count > 1:
        return [_issue("multiple-h1", "medium", "Multiple H1 tags",
                        f"Found {count} <h1> tags; a page should generally have exactly one.", url)]
    return []


def check_canonical(page, url) -> List[Dict]:
    canonical = page.css('link[rel="canonical"]::attr(href)').get()
    if not canonical:
        return [_issue("missing-canonical", "low", "Missing canonical tag",
                        "No canonical link tag found; can contribute to duplicate-content issues.", url)]
    return []


def check_robots_meta(page, url) -> List[Dict]:
    robots = (page.css('meta[name="robots"]::attr(content)').get() or "").lower()
    if "noindex" in robots:
        return [_issue("noindex-but-in-sitemap", "medium", "Page is noindex but listed in sitemap",
                        "This page is marked noindex yet appears in the sitemap — sends mixed signals to crawlers.",
                        url)]
    return []


def check_opengraph(page, url) -> List[Dict]:
    has_og = bool(page.css('meta[property="og:title"]').get()) or bool(page.css('meta[property="og:image"]').get())
    if not has_og:
        return [_issue("missing-opengraph", "low", "Missing Open Graph tags",
                        "No og:title/og:image found — social shares will render with no preview card.", url)]
    return []


def check_structured_data(page, url) -> List[Dict]:
    ld_json = page.css('script[type="application/ld+json"]')
    if not ld_json:
        return [_issue("no-structured-data", "info", "No structured data (JSON-LD) found",
                        "Adding schema.org markup can improve rich-result eligibility.", url)]
    return []


def check_images_alt(page, url) -> List[Dict]:
    imgs = page.css("img")
    if not imgs:
        return []
    missing = 0
    for img in imgs:
        alt = img.attrib.get("alt")
        if alt is None or not alt.strip():
            missing += 1
    if missing:
        return [_issue("images-missing-alt", "medium", "Images missing alt text",
                        f"{missing} of {len(imgs)} <img> tags have no (or empty) alt text — accessibility/WCAG issue.",
                        url)]
    return []


def check_lang_attribute(page, url) -> List[Dict]:
    lang = page.css("html::attr(lang)").get()
    if not lang:
        return [_issue("missing-lang-attribute", "low", "Missing lang attribute on <html>",
                        "Screen readers rely on this to choose pronunciation rules — basic WCAG issue.", url)]
    return []


def check_empty_links(page, url) -> List[Dict]:
    empty = 0
    for a in page.css("a"):
        text = (a.text or "").strip()
        aria = a.attrib.get("aria-label")
        title_attr = a.attrib.get("title")
        has_img = bool(a.css("img"))
        if not text and not aria and not title_attr and not has_img:
            empty += 1
    if empty:
        return [_issue("empty-links", "medium", "Empty links found",
                        f"{empty} <a> tag(s) have no visible text, aria-label, title, or image — "
                        "screen readers announce these as just \"link\".", url)]
    return []


def check_test_or_staging_content(page, title, url) -> List[Dict]:
    path = urlparse(url).path.lower() + "?" + urlparse(url).query.lower()
    title_lower = (title or "").lower()
    hit_url = any(p in path for p in TEST_URL_PATTERNS)
    hit_title = any(p in title_lower for p in TEST_TITLE_PATTERNS)
    if hit_url or hit_title:
        return [_issue("possible-test-or-staging-content", "high",
                        "Possible leftover test/staging page still live",
                        "URL or title pattern matches common test/placeholder content that shouldn't be public.",
                        url)]
    return []


def check_pdf_links(page, url) -> List[Dict]:
    pdf_links = [h for h in page.css("a::attr(href)").getall() if h.lower().split("?")[0].endswith(".pdf")]
    if pdf_links:
        return [_issue("pdf-documents-found", "info", "Links to PDF documents found",
                        f"{len(pdf_links)} link(s) to PDFs on this page — worth a manual check that content "
                        "inside isn't locked behind a viewer or missing from indexable text.", url)]
    return []


def content_fingerprint(page) -> str:
    """Rough hash of visible body text, used to flag near-duplicate pages."""
    text = " ".join(t.strip() for t in page.css("body ::text").getall() if t and t.strip())
    text = re.sub(r"\s+", " ", text)[:2000]
    return hashlib.sha1(text.encode("utf-8", errors="ignore")).hexdigest()


PAGE_CHECK_FUNCS = [
    check_h1,
    check_canonical,
    check_robots_meta,
    check_opengraph,
    check_structured_data,
    check_images_alt,
    check_lang_attribute,
    check_empty_links,
    check_pdf_links,
]


def run_page_checks(page, url: str) -> (List[Dict], Dict):
    """Runs every page-level check and returns (issues, extracted_data)."""
    issues: List[Dict] = []

    title_issues, title = check_title(page, url)
    issues += title_issues

    desc_issues, description = check_meta_description(page, url)
    issues += desc_issues

    for fn in PAGE_CHECK_FUNCS:
        issues += fn(page, url)

    issues += check_test_or_staging_content(page, title, url)

    data = {
        "title": title,
        "description": description,
        "fingerprint": content_fingerprint(page),
    }
    return issues, data
