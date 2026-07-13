'use client';

import type { Dispatch } from 'react';
import styles from './ProposalForm.module.css';
import DocumentAppearanceSection from '@/components/internal-tools/themes/DocumentAppearanceSection';
import ClientInfoSection from './ClientInfoSection';
import ServicesSection from './ServicesSection';
import PhasesSection from './PhasesSection';
import PricingSection from './PricingSection';
import LineItemsSection from './LineItemsSection';
import ScopeSection from './ScopeSection';
import TermsSection from './TermsSection';
import type { ProposalAction } from '../ProposalToolApp';
import type { ProposalData } from '@/lib/proposal-tool/types';
import type { ProposalTotals } from '@/lib/proposal-tool/pricingMath';

export interface SectionProps {
  proposal: ProposalData;
  dispatch: Dispatch<ProposalAction>;
}

/**
 * Parse a non-negative whole-dollar amount from a text input. Negative and
 * non-numeric input collapses to 0 (05-SCREENS.md acceptance criteria).
 */
export function parseAmount(raw: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

interface ProposalFormProps extends SectionProps {
  totals: ProposalTotals;
  serviceOptions: string[];
}

export default function ProposalForm({
  proposal,
  totals,
  serviceOptions,
  dispatch,
}: ProposalFormProps) {
  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <DocumentAppearanceSection
        idPrefix="pt"
        themeId={proposal.themeId}
        onThemeChange={(themeId) => dispatch({ type: 'setTheme', themeId })}
      />
      <ClientInfoSection proposal={proposal} dispatch={dispatch} />
      <ServicesSection
        proposal={proposal}
        dispatch={dispatch}
        serviceOptions={serviceOptions}
      />
      <PhasesSection proposal={proposal} dispatch={dispatch} />
      <PricingSection proposal={proposal} dispatch={dispatch} />
      <LineItemsSection proposal={proposal} dispatch={dispatch} totals={totals} />
      <ScopeSection proposal={proposal} dispatch={dispatch} />
      <TermsSection proposal={proposal} dispatch={dispatch} />
    </form>
  );
}
