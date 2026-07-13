import type { ProposalData } from './types';

export interface ValidationResult {
  valid: boolean;
  /** Human-readable names of the required fields still missing/invalid. */
  missing: string[];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Required before PDF export (05-SCREENS.md): project title, client name, and a
 * plausible contact email. Everything else may be blank — the document renders
 * placeholders instead.
 */
export function validateProposal(proposal: ProposalData): ValidationResult {
  const missing: string[] = [];
  if (!proposal.projectTitle.trim()) missing.push('project title');
  if (!proposal.client.clientName.trim()) missing.push('client name');
  if (!proposal.client.contactEmail.trim()) {
    missing.push('contact email');
  } else if (!EMAIL_PATTERN.test(proposal.client.contactEmail.trim())) {
    missing.push('valid contact email');
  }
  return { valid: missing.length === 0, missing };
}
