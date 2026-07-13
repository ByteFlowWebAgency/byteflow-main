// Data shapes for the internal proposal tool. These types are the contract between the
// input form (screen 1) and the rendered proposal document (screen 2) — both operate on a
// single ProposalData value held in React state.

import type { ClientContact } from '@/lib/internal-tools/clientInfo';

export type PricingModel = 'flat' | 'retainer' | 'hybrid';

export interface ClientInfo extends ClientContact {
  /** Optional context, e.g. "nonprofit", "small business". */
  organizationType?: string;
}

export interface ServiceLine {
  id: string;
  /**
   * Sourced from the same Contentful featureCards the marketing site's services page
   * renders, with a static fallback to the six standard practices when Contentful is
   * unavailable.
   */
  label: string;
  /** True if this is a one-off service typed into the form, not from the standard list. */
  isCustom: boolean;
}

export interface LineItem {
  id: string;
  description: string;
  /** USD, whole dollars. */
  amount: number;
  /** True if this item repeats each billing cycle (retainer/hybrid models). */
  recurring: boolean;
}

export interface FlatPricing {
  model: 'flat';
  totalAmount: number;
  /** Free text, e.g. "50% upfront, 50% on completion". */
  paymentSchedule: string;
}

export interface RetainerPricing {
  model: 'retainer';
  monthlyAmount: number;
  termMonths: number;
  /** Free text — what's included per month. */
  includedScope: string;
}

export interface HybridPricing {
  model: 'hybrid';
  setupAmount: number;
  monthlyAmount: number;
  termMonths: number;
  includedScope: string;
}

export type Pricing = FlatPricing | RetainerPricing | HybridPricing;

export type PhaseName = 'Discover' | 'Build' | 'Scale';

export interface EngagementPhase {
  name: PhaseName;
  description: string;
  durationWeeks?: number;
}

export interface ProposalData {
  /** Generated client-side (crypto.randomUUID()). */
  id: string;
  /** ISO date string. */
  createdAt: string;
  projectTitle: string;
  client: ClientInfo;
  services: ServiceLine[];
  /** Defaults to the three standard phases; each is editable and removable. */
  phases: EngagementPhase[];
  pricing: Pricing;
  lineItems: LineItem[];
  /** Scope/deliverables, one entry per bullet. */
  deliverables: string[];
  /** Free text, e.g. "Net 15, due upon invoice". */
  paymentTerms: string;
  /** "This proposal is valid for N days." */
  proposalValidDays: number;
  /** Free-text terms / fine print. */
  notes?: string;
  /**
   * Document theme id — a built-in ("classic", "dark") or a custom theme saved in the
   * theme editor. Documents store the id, not frozen values, so editing a custom theme
   * propagates; a deleted theme falls back to classic at render time.
   */
  themeId: string;
  /** Render the shared cover page as page 1 of the document. */
  includeCoverPage: boolean;
}
