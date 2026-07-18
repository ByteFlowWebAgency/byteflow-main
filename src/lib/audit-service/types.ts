// TypeScript mirror of the Python audit service's Pydantic models
// (wp-audit-service/audit/models.py). Kept intentionally in sync with that file;
// it is the wire contract between this app and the FastAPI service.

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** Request body accepted by POST /audit (and the export endpoints). */
export interface AuditRequestInput {
  url: string;
  max_pages?: number;
  check_broken_links?: boolean;
  check_wcag?: boolean;
  wcag_tags?: string[];
  timeout?: number;
}

export interface Issue {
  id: string;
  severity: string; // critical | high | medium | low | info
  title: string;
  detail: string;
  url?: string | null;
}

export interface WordPressInfo {
  detected: boolean;
  version?: string | null;
  generator_raw?: string | null;
  rest_api_available: boolean;
}

export interface WcagNode {
  html: string;
  target: string[];
  failure_summary?: string | null;
}

export interface WcagViolation {
  id: string;
  impact: string; // critical | serious | moderate | minor (axe's own scale)
  description: string;
  help: string;
  help_url: string;
  wcag_tags: string[];
  nodes: WcagNode[];
}

export interface PageResult {
  url: string;
  status?: number | null;
  title?: string | null;
  issues: Issue[];
  wcag_violations?: WcagViolation[] | null;
}

export interface DuplicateGroup {
  value: string;
  urls: string[];
}

export interface Duplicates {
  titles: DuplicateGroup[];
  meta_descriptions: DuplicateGroup[];
  content: DuplicateGroup[];
}

export interface AuditSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  pages_crawled: number;
  pages_failed: number;
}

export interface AuditResponse {
  site: string;
  crawled_at: string; // ISO datetime
  wordpress: WordPressInfo;
  site_findings: Issue[];
  pages: PageResult[];
  duplicates: Duplicates;
  summary: AuditSummary;
  wcag_disclaimer?: string | null;
}
