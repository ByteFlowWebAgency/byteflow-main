'use client';

import styles from './ProposalForm.module.css';
import type { SectionProps } from './ProposalForm';

export default function ScopeSection({ proposal, dispatch }: SectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Scope / deliverables</h2>

      <div className={styles.rowList}>
        {proposal.deliverables.map((deliverable, index) => (
          // Index keys are safe here: rows are only appended/removed via the buttons,
          // and values live in controlled inputs keyed off state.
          <div key={index} className={styles.itemRow}>
            <input
              className={`${styles.input} ${styles.itemGrow}`}
              type="text"
              value={deliverable}
              placeholder={`Deliverable ${index + 1}`}
              aria-label={`Deliverable ${index + 1}`}
              onChange={(e) =>
                dispatch({ type: 'updateDeliverable', index, value: e.target.value })
              }
            />
            <button
              type="button"
              className={styles.removeButton}
              aria-label={`Remove deliverable ${index + 1}`}
              onClick={() => dispatch({ type: 'removeDeliverable', index })}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={styles.addButton}
        onClick={() => dispatch({ type: 'addDeliverable' })}
      >
        + Add deliverable
      </button>
    </section>
  );
}
