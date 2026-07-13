import type { AuditCategory, AuditSeverity } from './types';

// Reader-facing labels for the code-friendly type keys, per 03-DATA-MODEL-AUDIT.md.
// CATEGORY_ORDER is the display order in both the form and the document.

export const CATEGORY_ORDER: AuditCategory[] = [
  'technical-seo',
  'on-page-seo',
  'local-seo-gbp',
  'accessibility',
  'design-ux',
  'performance-security',
];

export const CATEGORY_LABELS: Record<AuditCategory, string> = {
  'technical-seo': 'Technical SEO',
  'on-page-seo': 'On-Page SEO',
  'local-seo-gbp': 'Local SEO & Google Business Profile',
  accessibility: 'Accessibility',
  'design-ux': 'Design & User Experience',
  'performance-security': 'Performance & Security',
};

/** Problems in descending urgency, plus "good" as a first-class positive finding. */
export const SEVERITY_ORDER: AuditSeverity[] = ['critical', 'high', 'medium', 'low', 'good'];

export const SEVERITY_LABELS: Record<AuditSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  good: 'Working well',
};
