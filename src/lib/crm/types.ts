// CRM data model, verbatim from 02-CRM-DATA-MODEL.md. Everything persists through the
// storage adapter (lib/internal-tools/storage) — these are pure types, no behavior.

export type ConnectionSource =
  | 'warm-intro' // someone made an introduction
  | 'networking' // met at an event/org (NSBE, chamber, community orgs, etc.)
  | 'cold-outreach' // ByteFlow reached out cold
  | 'inbound' // they found ByteFlow
  | 'existing-client' // expansion/repeat from a current client
  | 'other';

export interface Organization {
  id: string;
  name: string;
  website?: string;
  orgType?: string; // free text: "nonprofit", "barbershop", "CDC", etc.
  notes?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string; // their title/role at the org
  organizationId?: string; // optional — some contacts aren't tied to an org yet
  source: ConnectionSource;
  // Who made the intro, if source === "warm-intro" — this is the "from who" thread
  // Tyrone specifically wants to track; render it as a link to that contact wherever
  // it appears.
  referredByContactId?: string;
  notes?: string;
  createdAt: string;
}

export type DealStage =
  | 'lead' // identified, not yet spoken to
  | 'conversation' // initial conversation happened
  | 'audit-sent' // audit/diagnostic material delivered
  | 'proposal-sent' // proposal delivered
  | 'negotiation' // active back-and-forth on scope/price
  | 'won' // signed / paid partnership
  | 'lost'; // closed without winning — keep, don't delete (why-lost in lostReason)

export interface Deal {
  id: string;
  title: string; // "SCCoC site rebuild", not just the org name
  organizationId?: string;
  primaryContactId?: string;
  stage: DealStage;
  estimatedValue?: number; // USD; optional — early-stage deals often don't have one
  services?: string[]; // which ByteFlow practices are in play (shared services list)
  lostReason?: string; // required (short free text) when stage is set to "lost"
  nextStep?: string; // one line: the single next action
  nextStepDue?: string; // ISO date, optional
  // Appended automatically on every stage change — how long things sit per stage is
  // real pipeline intelligence later.
  stageHistory: { stage: DealStage; at: string }[];
  createdAt: string;
  updatedAt: string;
}

export type ActivityKind = 'note' | 'call' | 'email' | 'meeting' | 'document-sent';

export interface Activity {
  id: string;
  dealId?: string; // at least one of dealId/contactId must be set
  contactId?: string;
  kind: ActivityKind;
  summary: string; // one line
  detail?: string; // free text
  at: string; // ISO datetime, defaults to now, editable (backfilling is normal use)
  createdAt: string;
}
