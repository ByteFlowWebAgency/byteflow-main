// Document templates: named starting configurations for NEW proposals/audits. A
// template bundles a theme choice + cover setting + pre-filled placeholder structure.
// Documents never reference templates afterwards — applying one deep-copies with fresh
// ids — so renaming/deleting a template can never touch existing documents.

import type { ProposalData, Pricing, PhaseName } from '@/lib/proposal-tool/types';
import type { AuditData } from '@/lib/audit-tool/types';

export type TemplateDocumentType = 'proposal' | 'audit';

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  documentType: TemplateDocumentType;
  /** Theme the new document starts with (resolved at use; deleted → classic). */
  themeId: string;
  includeCoverPage: boolean;
  /** Pre-filled structure only — bracketed placeholders, zero real data. */
  defaultContent: Partial<ProposalData> | Partial<AuditData>;
}

const PHASE_NAMES: PhaseName[] = ['Discover', 'Build', 'Scale'];
const AUDIT_CATEGORIES = [
  'technical-seo',
  'on-page-seo',
  'local-seo-gbp',
  'accessibility',
  'design-ux',
  'performance-security',
];
const AUDIT_SEVERITIES = ['critical', 'high', 'medium', 'low', 'good'];

type Check = (value: unknown) => string | null;

const isString: Check = (v) => (typeof v === 'string' ? null : 'must be a string');
const isBool: Check = (v) => (typeof v === 'boolean' ? null : 'must be true/false');
const isFiniteNumber: Check = (v) =>
  typeof v === 'number' && Number.isFinite(v) ? null : 'must be a number';

function checkObject(
  value: unknown,
  path: string,
  fields: Record<string, { check: Check; optional?: boolean }>,
): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return `${path} must be an object`;
  }
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const spec = fields[key];
    if (!spec) return `${path}.${key} is not a recognized field`;
    if (raw === undefined) continue;
    const problem = spec.check(raw);
    if (problem) return `${path}.${key} ${problem}`;
  }
  for (const [key, spec] of Object.entries(fields)) {
    if (!spec.optional && (value as Record<string, unknown>)[key] === undefined) {
      return `${path}.${key} is missing`;
    }
  }
  return null;
}

function arrayOf(itemCheck: (item: unknown, path: string) => string | null, path: string): Check {
  return (v) => {
    if (!Array.isArray(v)) return 'must be an array';
    for (let i = 0; i < v.length; i++) {
      const problem = itemCheck(v[i], `${path}[${i}]`);
      if (problem) return `— ${problem}`;
    }
    return null;
  };
}

const clientFields = {
  clientName: { check: isString },
  contactName: { check: isString },
  contactEmail: { check: isString },
  organizationType: { check: isString, optional: true },
};

function checkPricing(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return 'must be an object';
  const pricing = value as Partial<Pricing> & { model?: unknown };
  switch (pricing.model) {
    case 'flat':
      return checkObject(value, 'pricing', {
        model: { check: isString },
        totalAmount: { check: isFiniteNumber },
        paymentSchedule: { check: isString },
      });
    case 'retainer':
      return checkObject(value, 'pricing', {
        model: { check: isString },
        monthlyAmount: { check: isFiniteNumber },
        termMonths: { check: isFiniteNumber },
        includedScope: { check: isString },
      });
    case 'hybrid':
      return checkObject(value, 'pricing', {
        model: { check: isString },
        setupAmount: { check: isFiniteNumber },
        monthlyAmount: { check: isFiniteNumber },
        termMonths: { check: isFiniteNumber },
        includedScope: { check: isString },
      });
    default:
      return 'pricing.model must be flat, retainer, or hybrid';
  }
}

/** Whitelist validation of a proposal template's defaultContent. */
export function validateProposalContent(value: unknown): string | null {
  return checkObject(value, 'defaultContent', {
    // identity fields are never templated
    projectTitle: { check: isString, optional: true },
    client: {
      check: (v) => checkObject(v, 'client', clientFields),
      optional: true,
    },
    services: {
      check: arrayOf(
        (item, path) =>
          checkObject(item, path, {
            id: { check: isString },
            label: { check: isString },
            isCustom: { check: isBool },
          }),
        'services',
      ),
      optional: true,
    },
    phases: {
      check: arrayOf(
        (item, path) =>
          checkObject(item, path, {
            name: {
              check: (v) =>
                PHASE_NAMES.includes(v as PhaseName) ? null : 'must be Discover/Build/Scale',
            },
            description: { check: isString },
            durationWeeks: { check: isFiniteNumber, optional: true },
          }),
        'phases',
      ),
      optional: true,
    },
    pricing: { check: checkPricing, optional: true },
    lineItems: {
      check: arrayOf(
        (item, path) =>
          checkObject(item, path, {
            id: { check: isString },
            description: { check: isString },
            amount: { check: isFiniteNumber },
            recurring: { check: isBool },
          }),
        'lineItems',
      ),
      optional: true,
    },
    deliverables: { check: arrayOf((i, p) => isString(i) && `${p} must be a string`, 'deliverables'), optional: true },
    paymentTerms: { check: isString, optional: true },
    proposalValidDays: { check: isFiniteNumber, optional: true },
    notes: { check: isString, optional: true },
  });
}

/** Whitelist validation of an audit template's defaultContent. */
export function validateAuditContent(value: unknown): string | null {
  return checkObject(value, 'defaultContent', {
    siteUrl: { check: isString, optional: true },
    client: { check: (v) => checkObject(v, 'client', clientFields), optional: true },
    auditedBy: { check: isString, optional: true },
    summary: { check: isString, optional: true },
    findings: {
      check: arrayOf(
        (item, path) =>
          checkObject(item, path, {
            id: { check: isString },
            category: {
              check: (v) =>
                AUDIT_CATEGORIES.includes(v as string) ? null : 'is not an audit category',
            },
            severity: {
              check: (v) =>
                AUDIT_SEVERITIES.includes(v as string) ? null : 'is not a severity',
            },
            title: { check: isString },
            description: { check: isString },
            recommendation: { check: isString },
            screenshotDataUrl: { check: isString, optional: true },
          }),
        'findings',
      ),
      optional: true,
    },
    topRecommendations: {
      check: arrayOf((i, p) => isString(i) && `${p} must be a string`, 'topRecommendations'),
      optional: true,
    },
  });
}

/**
 * Field-by-field validation for template JSON crossing a trust boundary (import,
 * localStorage). All-or-nothing; returns a fresh object built from recognized fields.
 */
export function validateTemplate(
  input: unknown,
): { template: DocumentTemplate; error?: never } | { template?: never; error: string } {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { error: 'Template must be a JSON object.' };
  }
  const raw = input as Record<string, unknown>;
  if (typeof raw.id !== 'string' || raw.id.trim() === '') {
    return { error: 'Template is missing a string "id".' };
  }
  if (typeof raw.name !== 'string' || raw.name.trim() === '' || raw.name.length > 80) {
    return { error: 'Template "name" must be a non-empty string of at most 80 characters.' };
  }
  if (typeof raw.description !== 'string' || raw.description.length > 300) {
    return { error: 'Template "description" must be a string of at most 300 characters.' };
  }
  if (raw.documentType !== 'proposal' && raw.documentType !== 'audit') {
    return { error: 'documentType must be "proposal" or "audit".' };
  }
  if (typeof raw.themeId !== 'string' || raw.themeId.trim() === '') {
    return { error: 'themeId must be a non-empty string.' };
  }
  if (typeof raw.includeCoverPage !== 'boolean') {
    return { error: 'includeCoverPage must be true or false.' };
  }
  const contentProblem =
    raw.documentType === 'proposal'
      ? validateProposalContent(raw.defaultContent ?? {})
      : validateAuditContent(raw.defaultContent ?? {});
  if (contentProblem) {
    return { error: `Template content is invalid: ${contentProblem}.` };
  }
  return {
    template: {
      id: raw.id.trim(),
      name: raw.name.trim(),
      description: raw.description,
      // Imported/stored templates are never built-in, whatever the JSON claims.
      isBuiltIn: false,
      documentType: raw.documentType,
      themeId: raw.themeId,
      includeCoverPage: raw.includeCoverPage,
      defaultContent: JSON.parse(JSON.stringify(raw.defaultContent ?? {})) as
        | Partial<ProposalData>
        | Partial<AuditData>,
    },
  };
}
