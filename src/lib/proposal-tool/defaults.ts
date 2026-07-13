import type { ProposalData } from './types';

// Per 00-GUARDRAILS: nothing in this file may resemble a real quote. Placeholders are
// bracketed instructions, client fields are blank, and every amount starts at 0.

/**
 * Fallback service labels — the six practices as titled on the marketing site's services
 * page. The proposal tool page first tries to read the live list from the same Contentful
 * entries the services page renders; this list is only used when that fetch is
 * unavailable (local dev without credentials, Contentful outage).
 */
export const STANDARD_SERVICES: string[] = [
  'Enterprise Software Solutions',
  'Custom Development',
  'AI Integration',
  'Cloud Solutions',
  'SEO & Digital Growth',
  'Consulting & Host Management',
];

/** Standard proposal validity window, editable per proposal. */
export const DEFAULT_VALID_DAYS = 30;

/**
 * A fresh, empty-but-valid proposal: blank client, the three standard phases with
 * example-marked placeholder descriptions, flat pricing at $0, no line items or
 * deliverables yet.
 *
 * id/createdAt start empty and are assigned by ProposalToolApp on mount — this function
 * runs during SSR and again at hydration, so it must be deterministic (a randomUUID or
 * new Date() here would produce a server/client hydration mismatch).
 */
export function createDefaultProposal(): ProposalData {
  return {
    id: '',
    createdAt: '',
    projectTitle: '',
    client: {
      clientName: '',
      contactName: '',
      contactEmail: '',
      organizationType: '',
    },
    services: [],
    phases: [
      {
        name: 'Discover',
        description: '[Describe the Discover phase for this engagement]',
      },
      {
        name: 'Build',
        description: '[Describe the Build phase for this engagement]',
      },
      {
        name: 'Scale',
        description: '[Describe the Scale phase for this engagement]',
      },
    ],
    pricing: {
      model: 'flat',
      totalAmount: 0,
      paymentSchedule: '',
    },
    lineItems: [],
    deliverables: [],
    paymentTerms: '',
    proposalValidDays: DEFAULT_VALID_DAYS,
    notes: '',
  };
}
