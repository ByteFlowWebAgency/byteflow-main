import type { DocumentTemplate } from './templateTypes';
import type { ProposalData } from '@/lib/proposal-tool/types';
import type { AuditData } from '@/lib/audit-tool/types';

// The five shipped starting points. Placeholder content only (guardrail): bracketed
// instructions and $0 amounts, never anything resembling a real quote or finding.
// Item ids here are static markers — applying a template regenerates every id.

const STANDARD_PHASES: ProposalData['phases'] = [
  {
    name: 'Discover',
    description:
      '[Discovery: stakeholder conversations, current-state review, success criteria — replace with the engagement specifics]',
  },
  {
    name: 'Build',
    description:
      '[Build: design, implementation, and review cycles on the agreed scope — replace with the engagement specifics]',
  },
  {
    name: 'Scale',
    description:
      '[Scale: launch, measurement, handoff or ongoing growth work — replace with the engagement specifics]',
  },
];

const STANDARD_TERMS_NOTE =
  '[Standard terms: what is included, revision rounds, content responsibilities, ' +
  'ownership on final payment, timeline assumptions — replace with your language]';

const PROPOSAL_STANDARD: DocumentTemplate = {
  id: 'tpl-proposal-standard',
  name: 'Standard',
  description:
    'The three-phase engagement with flat pricing and standard terms placeholders.',
  isBuiltIn: true,
  documentType: 'proposal',
  themeId: 'classic',
  includeCoverPage: true,
  defaultContent: {
    phases: STANDARD_PHASES,
    pricing: { model: 'flat', totalAmount: 0, paymentSchedule: '[e.g. 50% upfront, 50% on completion]' },
    deliverables: ['[Deliverable — replace]', '[Deliverable — replace]'],
    paymentTerms: '[e.g. Net 15, due upon invoice]',
    proposalValidDays: 30,
    notes: STANDARD_TERMS_NOTE,
  } satisfies Partial<ProposalData>,
};

const PROPOSAL_RETAINER: DocumentTemplate = {
  id: 'tpl-proposal-retainer',
  name: 'Retainer',
  description: 'Monthly retainer pricing with included-scope placeholder language.',
  isBuiltIn: true,
  documentType: 'proposal',
  themeId: 'classic',
  includeCoverPage: true,
  defaultContent: {
    phases: STANDARD_PHASES,
    pricing: {
      model: 'retainer',
      monthlyAmount: 0,
      termMonths: 6,
      includedScope:
        '[What each month includes: support hours, maintenance, reporting cadence, response times — replace]',
    },
    deliverables: ['[Recurring deliverable — replace]', '[Recurring deliverable — replace]'],
    paymentTerms: '[e.g. Invoiced monthly in advance, Net 15]',
    proposalValidDays: 30,
    notes:
      '[Retainer terms: unused-hours policy, scope-change process, renewal and exit terms — replace with your language]',
  } satisfies Partial<ProposalData>,
};

const PROPOSAL_DARK_PITCH: DocumentTemplate = {
  id: 'tpl-proposal-dark-pitch',
  name: 'Dark Pitch',
  description:
    'The impressive-PDF variant: dark theme, full-bleed cover, three-phase structure.',
  isBuiltIn: true,
  documentType: 'proposal',
  themeId: 'dark',
  includeCoverPage: true,
  defaultContent: {
    phases: STANDARD_PHASES,
    pricing: { model: 'flat', totalAmount: 0, paymentSchedule: '[e.g. 50% upfront, 50% on completion]' },
    deliverables: ['[Deliverable — replace]', '[Deliverable — replace]'],
    paymentTerms: '[e.g. Net 15, due upon invoice]',
    proposalValidDays: 30,
    notes: STANDARD_TERMS_NOTE,
  } satisfies Partial<ProposalData>,
};

const placeholderFinding = (
  id: string,
  category: AuditData['findings'][number]['category'],
): AuditData['findings'][number] => ({
  id,
  category,
  severity: 'medium',
  title: '[Placeholder finding — replace with what you found]',
  description: '[What is actually wrong, in plain language]',
  recommendation: '[What ByteFlow would do about it]',
});

const AUDIT_FULL: DocumentTemplate = {
  id: 'tpl-audit-full',
  name: 'Full Site Audit',
  description: 'All six categories pre-seeded with one placeholder finding each.',
  isBuiltIn: true,
  documentType: 'audit',
  themeId: 'classic',
  includeCoverPage: true,
  defaultContent: {
    summary: '[One-paragraph overview of the audit: what was reviewed and the overall state of the site]',
    findings: [
      placeholderFinding('tpl-f1', 'technical-seo'),
      placeholderFinding('tpl-f2', 'on-page-seo'),
      placeholderFinding('tpl-f3', 'local-seo-gbp'),
      placeholderFinding('tpl-f4', 'accessibility'),
      placeholderFinding('tpl-f5', 'design-ux'),
      placeholderFinding('tpl-f6', 'performance-security'),
    ],
    topRecommendations: ['[Highest-impact fix — replace]', '[Second priority — replace]'],
  } satisfies Partial<AuditData>,
};

const AUDIT_LOCAL_SEO: DocumentTemplate = {
  id: 'tpl-audit-local-seo',
  name: 'Local SEO Snapshot',
  description:
    'The quick cold-outreach audit: Local SEO/GBP and on-page categories pre-seeded.',
  isBuiltIn: true,
  documentType: 'audit',
  themeId: 'classic',
  includeCoverPage: true,
  defaultContent: {
    summary:
      '[Quick snapshot of local search visibility: Google Business Profile, on-page signals, and the fastest wins]',
    findings: [
      placeholderFinding('tpl-f1', 'local-seo-gbp'),
      placeholderFinding('tpl-f2', 'local-seo-gbp'),
      placeholderFinding('tpl-f3', 'on-page-seo'),
    ],
    topRecommendations: ['[Fastest local-visibility win — replace]'],
  } satisfies Partial<AuditData>,
};

export const BUILT_IN_TEMPLATES: readonly DocumentTemplate[] = [
  PROPOSAL_STANDARD,
  PROPOSAL_RETAINER,
  PROPOSAL_DARK_PITCH,
  AUDIT_FULL,
  AUDIT_LOCAL_SEO,
];

export function getBuiltInTemplate(id: string): DocumentTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((template) => template.id === id);
}
