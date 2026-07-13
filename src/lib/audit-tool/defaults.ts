import type { AuditData } from './types';

// Per guardrails: no real site URLs, client names, or findings ship as defaults —
// everything starts blank or as a bracketed placeholder.

/**
 * A fresh, empty-but-valid audit. id/createdAt/auditDate start empty and are assigned by
 * AuditToolApp on mount — this runs during SSR and again at hydration, so it must be
 * deterministic (same pattern as the proposal tool's createDefaultProposal).
 */
export function createDefaultAudit(): AuditData {
  return {
    id: '',
    createdAt: '',
    siteUrl: '',
    client: {
      clientName: '',
      contactName: '',
      contactEmail: '',
    },
    auditDate: '',
    auditedBy: 'ByteFlow Solutions',
    summary: '[One-paragraph overview of the audit: what was reviewed and the overall state of the site]',
    findings: [],
    topRecommendations: [],
  };
}
