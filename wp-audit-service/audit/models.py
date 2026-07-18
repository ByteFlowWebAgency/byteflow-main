from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl

WCAG_COVERAGE_DISCLAIMER = (
    "Automated scanning (axe-core) reliably catches roughly 30-40% of WCAG "
    "success criteria, or about 57% of issues by real-world volume per "
    "Deque's published research. The remainder requires manual and "
    "assistive-technology testing. Treat this as a fast, defensible first "
    "pass, not a compliance certification."
)


class AuditRequest(BaseModel):
    url: HttpUrl = Field(..., description="Root URL of the WordPress site to audit")
    max_pages: int = Field(40, ge=1, le=300, description="Max pages to crawl from the sitemap")
    check_broken_links: bool = Field(
        False, description="If true, HEAD-check every internal link found on every page (slower)"
    )
    check_wcag: bool = Field(
        False, description="Run a real WCAG 2.2 scan via axe-core (slower, needs browser rendering)"
    )
    wcag_tags: List[str] = Field(
        default_factory=lambda: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        description="axe-core rule tags to run",
    )
    timeout: int = Field(20, ge=5, le=60, description="Per-request timeout in seconds")


class Issue(BaseModel):
    id: str
    severity: str  # critical | high | medium | low | info
    title: str
    detail: str
    url: Optional[str] = None


class WcagNode(BaseModel):
    html: str
    target: List[str]
    failure_summary: Optional[str] = None


class WcagViolation(BaseModel):
    id: str
    impact: str  # critical | serious | moderate | minor (axe's own scale)
    description: str
    help: str
    help_url: str
    wcag_tags: List[str]  # e.g. ["wcag2aa", "wcag143"]
    nodes: List[WcagNode]


class WordPressInfo(BaseModel):
    detected: bool = False
    version: Optional[str] = None
    generator_raw: Optional[str] = None
    rest_api_available: bool = False


class PageResult(BaseModel):
    url: str
    status: Optional[int] = None
    title: Optional[str] = None
    issues: List[Issue] = Field(default_factory=list)
    wcag_violations: Optional[List[WcagViolation]] = None


class DuplicateGroup(BaseModel):
    value: str
    urls: List[str]


class Duplicates(BaseModel):
    titles: List[DuplicateGroup] = Field(default_factory=list)
    meta_descriptions: List[DuplicateGroup] = Field(default_factory=list)
    content: List[DuplicateGroup] = Field(default_factory=list)


class Summary(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0
    pages_crawled: int = 0
    pages_failed: int = 0


class AuditResponse(BaseModel):
    site: str
    crawled_at: datetime
    wordpress: WordPressInfo
    site_findings: List[Issue] = Field(default_factory=list)
    pages: List[PageResult] = Field(default_factory=list)
    duplicates: Duplicates
    summary: Summary
    wcag_disclaimer: Optional[str] = None  # set to WCAG_COVERAGE_DISCLAIMER only when check_wcag was true
