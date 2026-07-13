'use client';

import styles from './AuditForm.module.css';
import type { AuditSectionProps } from './AuditForm';

export default function TopRecommendationsSection({ audit, dispatch }: AuditSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Top recommendations</h2>

      <div className={styles.rowList}>
        {audit.topRecommendations.map((rec, index) => (
          // Index keys are safe: rows are only appended/removed via the buttons and
          // values live in controlled inputs keyed off state.
          <div key={index} className={styles.itemRow}>
            <input
              className={`${styles.input} ${styles.itemGrow}`}
              type="text"
              value={rec}
              placeholder={`Priority ${index + 1}`}
              aria-label={`Top recommendation ${index + 1}`}
              onChange={(e) =>
                dispatch({ type: 'updateRecommendation', index, value: e.target.value })
              }
            />
            <button
              type="button"
              className={styles.removeButton}
              aria-label={`Remove top recommendation ${index + 1}`}
              onClick={() => dispatch({ type: 'removeRecommendation', index })}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={styles.addButton}
        style={{ marginTop: audit.topRecommendations.length > 0 ? 12 : 0 }}
        onClick={() => dispatch({ type: 'addRecommendation' })}
      >
        + Add recommendation
      </button>

      <p className={styles.hint}>
        3–5 items — the &ldquo;if you fix nothing else, fix these&rdquo; list, shown as its
        own callout in the report.
      </p>
    </section>
  );
}
