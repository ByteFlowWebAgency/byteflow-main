"""
Checks that only need to run once per site (not once per page): WordPress
fingerprinting, and a handful of well-known WP exposure/hardening checks.
"""
from __future__ import annotations

import re
from typing import Dict, List, Tuple

from scrapling.fetchers import Fetcher

from audit.checks import _issue

GENERATOR_RE = re.compile(r"WordPress\s+([\d.]+)", re.IGNORECASE)


def detect_wordpress(homepage) -> Dict:
    """Runs against the already-fetched homepage response."""
    generator = homepage.css('meta[name="generator"]::attr(content)').get() or ""
    version_match = GENERATOR_RE.search(generator)
    has_wp_paths = bool(homepage.body and (b"wp-content" in homepage.body or b"wp-includes" in homepage.body))

    return {
        "detected": bool(version_match) or has_wp_paths,
        "version": version_match.group(1) if version_match else None,
        "generator_raw": generator or None,
    }


def _safe_get(session_or_fetcher, url, timeout):
    try:
        return session_or_fetcher.get(url, timeout=timeout)
    except Exception:
        return None


def run_site_checks(base_url: str, timeout: int = 20) -> Tuple[List[Dict], bool]:
    """
    One-off checks that hit specific known WP paths. Returns (issues, rest_api_available).
    Uses plain Fetcher.get since these are one-off, independent requests.
    """
    issues: List[Dict] = []
    base_url = base_url.rstrip("/")

    readme = _safe_get(Fetcher, f"{base_url}/readme.html", timeout)
    if readme is not None and readme.status == 200 and b"WordPress" in (readme.body or b""):
        issues.append(_issue(
            "wp-readme-exposed", "medium", "readme.html is publicly accessible",
            "WordPress's default readme.html reveals the exact version installed, which is useful "
            "recon info for anyone targeting known vulnerabilities. Usually blocked via .htaccess or firewall rule.",
            f"{base_url}/readme.html",
        ))

    xmlrpc = _safe_get(Fetcher, f"{base_url}/xmlrpc.php", timeout)
    if xmlrpc is not None and xmlrpc.status == 200:
        issues.append(_issue(
            "xmlrpc-enabled", "low", "xmlrpc.php is enabled",
            "xmlrpc.php is reachable and has historically been used for brute-force/amplification attacks. "
            "Not always a problem (some plugins need it), but worth confirming it's needed.",
            f"{base_url}/xmlrpc.php",
        ))

    uploads = _safe_get(Fetcher, f"{base_url}/wp-content/uploads/", timeout)
    if uploads is not None and uploads.status == 200 and b"Index of" in (uploads.body or b""):
        issues.append(_issue(
            "directory-listing-exposed", "high", "Directory listing enabled on uploads folder",
            "/wp-content/uploads/ returns a browsable file index instead of a 403 — exposes every "
            "uploaded file/media path directly.",
            f"{base_url}/wp-content/uploads/",
        ))

    rest_api_available = False
    wp_json = _safe_get(Fetcher, f"{base_url}/wp-json/", timeout)
    if wp_json is not None and wp_json.status == 200:
        try:
            data = wp_json.json()
            rest_api_available = isinstance(data, dict) and ("namespaces" in data or "name" in data)
        except Exception:
            rest_api_available = False

    return issues, rest_api_available
