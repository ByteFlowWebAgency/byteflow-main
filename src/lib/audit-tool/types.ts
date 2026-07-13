// Data shapes for the internal site-audit tool. Same contract pattern as the proposal
// tool: one AuditData value in React state drives both the input form and the rendered
// audit document.

import type { ClientContact } from '@/lib/internal-tools/clientInfo';

export type AuditSeverity = 'critical' | 'high' | 'medium' | 'low' | 'good';

export type AuditCategory =
  | 'technical-seo'
  | 'on-page-seo'
  | 'local-seo-gbp'
  | 'accessibility'
  | 'design-ux'
  | 'performance-security';

export interface AuditFinding {
  id: string;
  category: AuditCategory;
  severity: AuditSeverity;
  /** Short and specific — "Missing meta descriptions on 6 of 8 pages". */
  title: string;
  /** What's actually wrong, in plain language. */
  description: string;
  /** What ByteFlow would do about it. */
  recommendation: string;
  /**
   * Optional screenshot as a data URL (file input → FileReader, client-side only —
   * lives in form state, no upload or storage anywhere).
   */
  screenshotDataUrl?: string;
}

export interface AuditData {
  /** Generated client-side on mount (same SSR-safe pattern as the proposal tool). */
  id: string;
  /** ISO date string. */
  createdAt: string;
  siteUrl: string;
  client: ClientContact;
  /** ISO date — may differ from createdAt if drafted ahead of time. */
  auditDate: string;
  /** Defaults to "ByteFlow Solutions", editable. */
  auditedBy: string;
  /** Tyrone's own overview paragraph — never auto-generated. */
  summary: string;
  findings: AuditFinding[];
  /** 3–5 prioritized "if you do nothing else, do these" action items. */
  topRecommendations: string[];
  /** Document theme id — same semantics as ProposalData.themeId. */
  themeId: string;
  /** Render the shared cover page as page 1 of the document. */
  includeCoverPage: boolean;
}
