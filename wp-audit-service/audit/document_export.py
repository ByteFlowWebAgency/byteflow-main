"""
Convert an AuditResponse into the ByteFlow Document Builder's bare `document`
JSON (a one-off document, not a reusable template), suitable for the Documents
list page's "Import JSON" button.

The target schema is an external contract we do not control — see
03_DOCUMENT_BUILDER_EXPORT.md. The importer rejects the WHOLE file on any
structural error (unknown page.kind / block.type, non-array pages/blocks), so
this module only ever emits the documented page kinds and block types, always
keeps table rows rectangular, and only uses the allowed HTML tags in
richText/callout. Content is coerced (not rejected) by the importer, so the
discipline that matters here is structural exactness.
"""
from __future__ import annotations

import html
from typing import List

from audit.models import AuditResponse, Issue, PageResult

# Service severity scale (critical..info) and axe's impact scale, ranked so we
# can keep the "highest-severity first" ordering when truncating long lists.
SEVERITY_RANK = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
IMPACT_RANK = {"critical": 0, "serious": 1, "moderate": 2, "minor": 3}

MAX_TABLE_ROWS = 8   # per-page issue/WCAG tables are summaries, not raw dumps
MAX_DUP_URLS = 5     # affected-URL lists in the duplicates tables


# --- block constructors (one per allowed block type we use) ------------------

def _heading(level: int, text: str) -> dict:
    return {"type": "heading", "level": level, "text": text}


def _rich_text(inner_html: str) -> dict:
    return {"type": "richText", "html": inner_html}


def _callout(inner_html: str) -> dict:
    return {"type": "callout", "html": inner_html}


def _table(header: List[str], rows: List[List[str]]) -> dict:
    return {"type": "table", "header": header, "rows": rows}


def _key_value_list(items: List[dict]) -> dict:
    return {"type": "keyValueList", "items": items}


def _page_break() -> dict:
    return {"type": "pageBreak"}


# --- small helpers -----------------------------------------------------------

def _p(text: str) -> str:
    """Wrap plain text in a <p> for a richText/callout html field, HTML-escaping
    the text so stray characters (e.g. '<img>' inside a finding detail) can't
    break the markup or get silently stripped by the importer's sanitizer."""
    return f"<p>{html.escape(text)}</p>"


def _truncate(text: str, limit: int) -> str:
    return text if len(text) <= limit else text[:limit]


def _issue_rows(issues: List[Issue]):
    """Return (rows, extra_count) for an issue table, highest-severity first and
    capped at MAX_TABLE_ROWS."""
    ordered = sorted(issues, key=lambda i: SEVERITY_RANK.get(i.severity, 99))
    shown = ordered[:MAX_TABLE_ROWS]
    rows = [[i.severity.upper(), i.title, i.detail] for i in shown]
    return rows, len(ordered) - len(shown)


def _wcag_rows(violations):
    """Return (rows, extra_count) for a WCAG table, highest-impact first and
    capped at MAX_TABLE_ROWS."""
    ordered = sorted(violations, key=lambda v: IMPACT_RANK.get(v.impact, 99))
    shown = ordered[:MAX_TABLE_ROWS]
    rows = [[v.impact, v.id, v.help] for v in shown]
    return rows, len(ordered) - len(shown)


# --- page builders -----------------------------------------------------------

def _cover_page(audit: AuditResponse, client_name: str) -> dict:
    dt = audit.crawled_at
    readable_date = f"{dt:%B} {dt.day}, {dt.year}"  # e.g. "July 18, 2026"
    return {
        "kind": "cover",
        "blocks": [],
        "coverFields": {
            "title": f"{audit.site} — Site Audit Report",
            "subtitle": "AUTOMATED SITE AUDIT",
            "clientName": client_name or "",
            "date": _truncate(readable_date, 40),
        },
    }


def _section_title_page(title: str, eyebrow: str = "", subtitle: str = "") -> dict:
    fields = {"title": title}
    if eyebrow:
        fields["eyebrow"] = eyebrow
    if subtitle:
        fields["subtitle"] = subtitle
    return {"kind": "sectionTitle", "blocks": [], "sectionTitleFields": fields}


def _executive_summary_page(audit: AuditResponse) -> dict:
    s = audit.summary
    blocks: List[dict] = [
        _heading(2, "Executive Summary"),
        _key_value_list([
            {"label": "Critical", "value": str(s.critical)},
            {"label": "High", "value": str(s.high)},
            {"label": "Medium", "value": str(s.medium)},
            {"label": "Low", "value": str(s.low)},
            {"label": "Info", "value": str(s.info)},
            {"label": "Pages Crawled", "value": str(s.pages_crawled)},
            {"label": "Pages Failed", "value": str(s.pages_failed)},
        ]),
    ]
    if audit.wcag_disclaimer:
        blocks.append(_callout(_p(audit.wcag_disclaimer)))
    return {"kind": "content", "blocks": blocks}


def _site_wide_page(audit: AuditResponse) -> dict:
    blocks: List[dict] = []
    wp = audit.wordpress
    if wp.detected:
        blocks.append(_key_value_list([
            {"label": "WordPress version", "value": wp.version or "Unknown"},
            {"label": "REST API available", "value": "Yes" if wp.rest_api_available else "No"},
        ]))

    if audit.site_findings:
        rows = [[i.severity.upper(), i.title, i.detail] for i in audit.site_findings]
        blocks.append(_table(["Severity", "Finding", "Detail"], rows))
    else:
        # Never emit a table with zero rows — use prose instead.
        blocks.append(_rich_text(_p("No site-wide WordPress or exposure issues were detected.")))

    return {"kind": "content", "blocks": blocks}


def _page_findings_page(pages: List[PageResult]) -> dict:
    """One content page holding every page's findings group, separated by
    pageBreaks so groups don't run together in the PDF."""
    groups: List[List[dict]] = []
    for page in pages:
        if not page.issues:
            continue  # skip clean pages entirely
        group: List[dict] = [_heading(3, page.title or page.url)]

        rows, extra = _issue_rows(page.issues)
        group.append(_table(["Severity", "Issue", "Detail"], rows))
        if extra > 0:
            group.append(_rich_text(_p(f"+{extra} more issues — see full JSON export for the complete list.")))

        if page.wcag_violations:
            wrows, wextra = _wcag_rows(page.wcag_violations)
            group.append(_table(["Impact", "Rule", "Help"], wrows))
            if wextra > 0:
                group.append(_rich_text(
                    _p(f"+{wextra} more WCAG violations — see full JSON export for the complete list.")))

        groups.append(group)

    # Flatten groups, inserting a pageBreak between (not after) each group.
    blocks: List[dict] = []
    for idx, group in enumerate(groups):
        if idx > 0:
            blocks.append(_page_break())
        blocks.extend(group)

    return {"kind": "content", "blocks": blocks}


def _duplicates_page(audit: AuditResponse) -> dict:
    dups = audit.duplicates
    blocks: List[dict] = []

    def dup_table(groups):
        rows = []
        for g in groups:
            urls = g.urls
            shown = ", ".join(urls[:MAX_DUP_URLS])
            if len(urls) > MAX_DUP_URLS:
                shown += f" +{len(urls) - MAX_DUP_URLS} more"
            rows.append([g.value, shown])
        return _table(["Duplicate Value", "Affected URLs"], rows)

    if dups.titles:
        blocks.append(_heading(3, "Duplicate Titles"))
        blocks.append(dup_table(dups.titles))
    if dups.meta_descriptions:
        blocks.append(_heading(3, "Duplicate Meta Descriptions"))
        blocks.append(dup_table(dups.meta_descriptions))
    if dups.content:
        blocks.append(_heading(3, "Near-Duplicate Page Content"))
        blocks.append(dup_table(dups.content))

    return {"kind": "content", "blocks": blocks}


def _closing_page() -> dict:
    return {
        "kind": "closing",
        "blocks": [
            _rich_text(
                "<p>This audit was generated automatically. Findings marked high or "
                "critical are worth prioritizing first — happy to walk through any of "
                "this together.</p>"
            )
        ],
    }


# --- entry point -------------------------------------------------------------

def audit_to_document_builder_json(audit: AuditResponse, client_name: str = "") -> dict:
    """Return a bare `document` object (one-off shape) ready for the Document
    Builder's 'Import JSON' button."""
    pages: List[dict] = [
        _cover_page(audit, client_name),
        _executive_summary_page(audit),
        _section_title_page("WordPress & Site-Wide Findings", eyebrow="TECHNICAL AUDIT"),
        _site_wide_page(audit),
    ]

    # Page-by-page findings — only if at least one page actually has issues, so
    # we never emit an empty section divider + blank content page.
    if any(p.issues for p in audit.pages):
        pages.append(_section_title_page("Page-by-Page Findings", eyebrow="CRAWL RESULTS"))
        pages.append(_page_findings_page(audit.pages))

    # Duplicate-content findings — only if any duplicates exist at all.
    d = audit.duplicates
    if d.titles or d.meta_descriptions or d.content:
        pages.append(_section_title_page("Duplicate Content Findings"))
        pages.append(_duplicates_page(audit))

    pages.append(_closing_page())

    return {
        "name": _truncate(f"{audit.site} Audit Report", 120),
        "themeId": "classic",
        "pages": pages,
    }
