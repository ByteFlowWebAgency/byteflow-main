'use client';

import styles from './ProposalDocument.module.css';
import { formatDate } from './DocumentHeader';
import type { ProposalData } from '@/lib/proposal-tool/types';

function validThrough(createdAt: string, validDays: number): string {
  if (!createdAt) return '—';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '—';
  date.setDate(date.getDate() + validDays);
  return formatDate(date.toISOString());
}

export default function TermsFooter({ proposal }: { proposal: ProposalData }) {
  const paymentTerms = proposal.paymentTerms.trim();
  const notes = proposal.notes?.trim();

  return (
    <>
      <section className={styles.section} data-pdf-block>
        <h2 className={styles.sectionHeading}>Terms</h2>
        <dl className={styles.terms}>
          <div className={styles.termRow}>
            <dt>Payment terms</dt>
            <dd>{paymentTerms || '[Payment terms]'}</dd>
          </div>
          <div className={styles.termRow}>
            <dt>Validity</dt>
            <dd>
              This proposal is valid through{' '}
              {validThrough(proposal.createdAt, proposal.proposalValidDays)} (
              {proposal.proposalValidDays} days).
            </dd>
          </div>
          {notes && (
            <div className={styles.termRow}>
              <dt>Notes</dt>
              <dd>{notes}</dd>
            </div>
          )}
        </dl>
      </section>

      <footer className={styles.docFooter} data-pdf-block>
        <p className={styles.footerBrand}>BYTEFLOW Solutions</p>
        <p className={styles.footerLine}>
          Software engineering for teams that take shipping seriously.
        </p>
        <p className={styles.footerLine}>
          byteflow.us · support@byteflowsolutions.com · Akron, Ohio
        </p>
      </footer>
    </>
  );
}
