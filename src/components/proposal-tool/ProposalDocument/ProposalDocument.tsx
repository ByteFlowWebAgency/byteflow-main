'use client';

import { forwardRef } from 'react';
import styles from './ProposalDocument.module.css';
import DocumentHeader from './DocumentHeader';
import PhasesSection from './PhasesSection';
import InvestmentTable from './InvestmentTable';
import TermsFooter from './TermsFooter';
import type { ProposalData } from '@/lib/proposal-tool/types';
import type { ProposalTotals } from '@/lib/proposal-tool/pricingMath';

interface ProposalDocumentProps {
  proposal: ProposalData;
  totals: ProposalTotals;
}

/** Join labels as "a", "a and b", or "a, b, and c" for the overview sentence. */
function joinLabels(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? '';
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}

/**
 * The client-ready proposal document — the single visual source of truth for both the
 * on-screen preview and the exported PDF (which captures this exact DOM). Renders
 * placeholders for anything not yet filled in; never crashes on empty state.
 *
 * Elements marked data-pdf-block are treated as unbreakable by the PDF paginator.
 */
const ProposalDocument = forwardRef<HTMLDivElement, ProposalDocumentProps>(
  function ProposalDocument({ proposal, totals }, ref) {
    const clientName = proposal.client.clientName.trim() || '[Client name]';
    const projectTitle = proposal.projectTitle.trim() || '[Project title]';
    const serviceLabels = proposal.services
      .map((s) => s.label.trim())
      .filter(Boolean);
    const deliverables = proposal.deliverables
      .map((d) => d.trim())
      .filter(Boolean);

    return (
      <div ref={ref} className={styles.document} data-pdf-document>
        <DocumentHeader proposal={proposal} />

        <section className={styles.section} data-pdf-block>
          <h2 className={styles.sectionHeading}>Overview</h2>
          <p className={styles.body}>
            This proposal outlines ByteFlow&rsquo;s approach to {projectTitle} for{' '}
            {clientName}
            {serviceLabels.length > 0 && <>, covering {joinLabels(serviceLabels)}</>}. It
            describes how we&rsquo;ll work together, what will be delivered, and what the
            engagement costs.
          </p>
        </section>

        {proposal.phases.length > 0 && <PhasesSection phases={proposal.phases} />}

        <section className={styles.section}>
          <div data-pdf-block data-pdf-keep-next>
            <h2 className={styles.sectionHeading}>Scope of work</h2>
            {deliverables.length === 0 && (
              <p className={styles.placeholder}>[Add deliverables to define the scope]</p>
            )}
          </div>
          {deliverables.length > 0 && (
            <ul className={styles.deliverables}>
              {deliverables.map((item, index) => (
                <li key={index} className={styles.deliverable} data-pdf-block>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </section>

        <InvestmentTable proposal={proposal} totals={totals} />

        <TermsFooter proposal={proposal} />
      </div>
    );
  },
);

export default ProposalDocument;
export { joinLabels };
