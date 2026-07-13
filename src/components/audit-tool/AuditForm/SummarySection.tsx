'use client';

import styles from './AuditForm.module.css';
import type { AuditSectionProps } from './AuditForm';

export default function SummarySection({ audit, dispatch }: AuditSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Summary</h2>
      <div className={styles.field}>
        <label htmlFor="au-summary" className={styles.label}>
          Overview paragraph — your words, printed verbatim at the top of the report
        </label>
        <textarea
          id="au-summary"
          className={styles.textarea}
          rows={5}
          value={audit.summary}
          onChange={(e) => dispatch({ type: 'set', patch: { summary: e.target.value } })}
        />
      </div>
    </section>
  );
}
