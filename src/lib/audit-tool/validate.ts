import type { AuditData } from './types';

export interface AuditValidationResult {
  valid: boolean;
  /** Human-readable names of the requirements still missing. */
  missing: string[];
}

/**
 * Required before PDF export (04-SCREENS-AUDIT.md): site URL, client/organization name,
 * and at least one finding — an audit with zero findings isn't a real audit.
 */
export function validateAudit(audit: AuditData): AuditValidationResult {
  const missing: string[] = [];
  if (!audit.siteUrl.trim()) missing.push('site URL');
  if (!audit.client.clientName.trim()) missing.push('client name');
  if (audit.findings.length === 0) missing.push('at least one finding');
  return { valid: missing.length === 0, missing };
}
