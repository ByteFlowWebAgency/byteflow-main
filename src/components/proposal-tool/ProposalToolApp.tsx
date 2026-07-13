'use client';

import { useEffect, useMemo, useReducer } from 'react';
import './tokens.css';
import styles from './ProposalToolApp.module.css';
import ProposalForm from './ProposalForm/ProposalForm';
import { createDefaultProposal } from '@/lib/proposal-tool/defaults';
import { calculateTotals } from '@/lib/proposal-tool/pricingMath';
import { validateProposal } from '@/lib/proposal-tool/validate';
import type {
  ClientInfo,
  EngagementPhase,
  LineItem,
  PhaseName,
  Pricing,
  PricingModel,
  ProposalData,
} from '@/lib/proposal-tool/types';

export type ProposalAction =
  | { type: 'init'; id: string; createdAt: string }
  | {
      type: 'set';
      patch: Partial<
        Pick<ProposalData, 'projectTitle' | 'paymentTerms' | 'proposalValidDays' | 'notes'>
      >;
    }
  | { type: 'setClient'; patch: Partial<ClientInfo> }
  | { type: 'toggleService'; label: string }
  | { type: 'addCustomService'; id: string; label: string }
  | { type: 'removeService'; id: string }
  | { type: 'setPhase'; name: PhaseName; patch: Partial<Omit<EngagementPhase, 'name'>> }
  | { type: 'removePhase'; name: PhaseName }
  | { type: 'restorePhase'; name: PhaseName }
  | { type: 'setPricingModel'; model: PricingModel }
  | { type: 'setPricing'; patch: Partial<Omit<Pricing, 'model'>> }
  | { type: 'addLineItem'; id: string }
  | { type: 'updateLineItem'; id: string; patch: Partial<Omit<LineItem, 'id'>> }
  | { type: 'removeLineItem'; id: string }
  | { type: 'addDeliverable' }
  | { type: 'updateDeliverable'; index: number; value: string }
  | { type: 'removeDeliverable'; index: number };

const PHASE_ORDER: PhaseName[] = ['Discover', 'Build', 'Scale'];

const PHASE_PLACEHOLDERS: Record<PhaseName, string> = {
  Discover: '[Describe the Discover phase for this engagement]',
  Build: '[Describe the Build phase for this engagement]',
  Scale: '[Describe the Scale phase for this engagement]',
};

/** Switch pricing model, carrying overlapping amounts across so typed values survive. */
function switchPricingModel(previous: Pricing, model: PricingModel): Pricing {
  const monthly = 'monthlyAmount' in previous ? previous.monthlyAmount : 0;
  const term = 'termMonths' in previous ? previous.termMonths : 6;
  const scope = 'includedScope' in previous ? previous.includedScope : '';
  switch (model) {
    case 'flat':
      return {
        model: 'flat',
        totalAmount: previous.model === 'hybrid' ? previous.setupAmount : 0,
        paymentSchedule: previous.model === 'flat' ? previous.paymentSchedule : '',
      };
    case 'retainer':
      return { model: 'retainer', monthlyAmount: monthly, termMonths: term, includedScope: scope };
    case 'hybrid':
      return {
        model: 'hybrid',
        setupAmount: previous.model === 'flat' ? previous.totalAmount : 0,
        monthlyAmount: monthly,
        termMonths: term,
        includedScope: scope,
      };
  }
}

function reducer(proposal: ProposalData, action: ProposalAction): ProposalData {
  switch (action.type) {
    case 'init':
      return { ...proposal, id: action.id, createdAt: action.createdAt };
    case 'set':
      return { ...proposal, ...action.patch };
    case 'setClient':
      return { ...proposal, client: { ...proposal.client, ...action.patch } };
    case 'toggleService': {
      const existing = proposal.services.find(
        (s) => !s.isCustom && s.label === action.label,
      );
      return {
        ...proposal,
        services: existing
          ? proposal.services.filter((s) => s !== existing)
          : [
              ...proposal.services,
              { id: `std-${action.label}`, label: action.label, isCustom: false },
            ],
      };
    }
    case 'addCustomService': {
      const label = action.label.trim();
      if (!label) return proposal;
      return {
        ...proposal,
        services: [...proposal.services, { id: action.id, label, isCustom: true }],
      };
    }
    case 'removeService':
      return { ...proposal, services: proposal.services.filter((s) => s.id !== action.id) };
    case 'setPhase':
      return {
        ...proposal,
        phases: proposal.phases.map((phase) =>
          phase.name === action.name ? { ...phase, ...action.patch } : phase,
        ),
      };
    case 'removePhase':
      return { ...proposal, phases: proposal.phases.filter((p) => p.name !== action.name) };
    case 'restorePhase': {
      if (proposal.phases.some((p) => p.name === action.name)) return proposal;
      const restored = [
        ...proposal.phases,
        { name: action.name, description: PHASE_PLACEHOLDERS[action.name] },
      ];
      restored.sort((a, b) => PHASE_ORDER.indexOf(a.name) - PHASE_ORDER.indexOf(b.name));
      return { ...proposal, phases: restored };
    }
    case 'setPricingModel':
      return { ...proposal, pricing: switchPricingModel(proposal.pricing, action.model) };
    case 'setPricing':
      return { ...proposal, pricing: { ...proposal.pricing, ...action.patch } as Pricing };
    case 'addLineItem':
      return {
        ...proposal,
        lineItems: [
          ...proposal.lineItems,
          { id: action.id, description: '', amount: 0, recurring: false },
        ],
      };
    case 'updateLineItem':
      return {
        ...proposal,
        lineItems: proposal.lineItems.map((item) =>
          item.id === action.id ? { ...item, ...action.patch } : item,
        ),
      };
    case 'removeLineItem':
      return {
        ...proposal,
        lineItems: proposal.lineItems.filter((item) => item.id !== action.id),
      };
    case 'addDeliverable':
      return { ...proposal, deliverables: [...proposal.deliverables, ''] };
    case 'updateDeliverable':
      return {
        ...proposal,
        deliverables: proposal.deliverables.map((d, i) =>
          i === action.index ? action.value : d,
        ),
      };
    case 'removeDeliverable':
      return {
        ...proposal,
        deliverables: proposal.deliverables.filter((_, i) => i !== action.index),
      };
  }
}

interface ProposalToolAppProps {
  serviceOptions: string[];
}

export default function ProposalToolApp({ serviceOptions }: ProposalToolAppProps) {
  const [proposal, dispatch] = useReducer(reducer, undefined, createDefaultProposal);

  // id/createdAt are assigned post-mount; createDefaultProposal must stay deterministic
  // for SSR/hydration.
  useEffect(() => {
    if (!proposal.id) {
      dispatch({
        type: 'init',
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
    }
  }, [proposal.id]);

  const totals = useMemo(() => calculateTotals(proposal), [proposal]);
  const validation = useMemo(() => validateProposal(proposal), [proposal]);

  return (
    <div className={`bfScope ${styles.app}`}>
      <header className={styles.toolbar}>
        <div>
          <p className={styles.eyebrow}>ByteFlow Internal</p>
          <h1 className={styles.title}>Proposal Tool</h1>
        </div>
        <div className={styles.toolbarActions}>
          {!validation.valid && (
            <p className={styles.validationHint} role="status">
              To export: add {validation.missing.join(', ')}.
            </p>
          )}
        </div>
      </header>

      <div className={styles.panes}>
        <section className={styles.formPane} aria-label="Proposal form">
          <ProposalForm
            proposal={proposal}
            totals={totals}
            serviceOptions={serviceOptions}
            dispatch={dispatch}
          />
        </section>
        <section className={styles.documentPane} aria-label="Proposal preview">
          <div className={styles.documentPlaceholder}>
            Live document preview arrives in the next build phase.
          </div>
        </section>
      </div>
    </div>
  );
}
