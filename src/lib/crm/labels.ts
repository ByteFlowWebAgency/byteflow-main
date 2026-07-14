// Display metadata for the CRM model: canonical stage order for the pipeline board,
// and human labels for every enum the screens render. Model-layer only — no React.

import type { ActivityKind, ConnectionSource, DealStage } from './types';

/** Working-board order (03-CRM-SCREENS.md); "lost" is kept apart from the main flow. */
export const PIPELINE_STAGES: DealStage[] = [
  'lead',
  'conversation',
  'audit-sent',
  'proposal-sent',
  'negotiation',
  'won',
];

export const ALL_STAGES: DealStage[] = [...PIPELINE_STAGES, 'lost'];

export const STAGE_LABELS: Record<DealStage, string> = {
  lead: 'Lead',
  conversation: 'Conversation',
  'audit-sent': 'Audit sent',
  'proposal-sent': 'Proposal sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export const SOURCE_LABELS: Record<ConnectionSource, string> = {
  'warm-intro': 'Warm intro',
  networking: 'Networking',
  'cold-outreach': 'Cold outreach',
  inbound: 'Inbound',
  'existing-client': 'Existing client',
  other: 'Other',
};

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  note: 'Note',
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  'document-sent': 'Document sent',
};

export const ACTIVITY_KINDS = Object.keys(ACTIVITY_KIND_LABELS) as ActivityKind[];
export const CONNECTION_SOURCES = Object.keys(SOURCE_LABELS) as ConnectionSource[];
