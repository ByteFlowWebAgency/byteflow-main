'use client';

import styles from './ProposalForm.module.css';
import { parseAmount, type SectionProps } from './ProposalForm';

export default function TermsSection({ proposal, dispatch }: SectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Terms</h2>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label htmlFor="pt-payterms" className={styles.label}>
            Payment terms
          </label>
          <input
            id="pt-payterms"
            className={styles.input}
            type="text"
            value={proposal.paymentTerms}
            placeholder="e.g. Net 15, due upon invoice"
            onChange={(e) => dispatch({ type: 'set', patch: { paymentTerms: e.target.value } })}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="pt-validity" className={styles.label}>
            Proposal valid for (days)
          </label>
          <input
            id="pt-validity"
            className={styles.input}
            type="number"
            min={0}
            step={1}
            value={proposal.proposalValidDays}
            onChange={(e) =>
              dispatch({
                type: 'set',
                patch: { proposalValidDays: Math.round(parseAmount(e.target.value)) },
              })
            }
          />
        </div>

        <div className={`${styles.field} ${styles.fieldWide}`}>
          <label htmlFor="pt-notes" className={styles.label}>
            Notes / fine print (optional)
          </label>
          <textarea
            id="pt-notes"
            className={styles.textarea}
            value={proposal.notes ?? ''}
            onChange={(e) => dispatch({ type: 'set', patch: { notes: e.target.value } })}
          />
        </div>
      </div>
    </section>
  );
}
