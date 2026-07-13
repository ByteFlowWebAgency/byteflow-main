'use client';

import styles from './ProposalForm.module.css';
import { parseAmount, type SectionProps } from './ProposalForm';
import type { PhaseName } from '@/lib/proposal-tool/types';

const ALL_PHASES: PhaseName[] = ['Discover', 'Build', 'Scale'];

export default function PhasesSection({ proposal, dispatch }: SectionProps) {
  const removed = ALL_PHASES.filter(
    (name) => !proposal.phases.some((p) => p.name === name),
  );

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Engagement phases</h2>

      {proposal.phases.map((phase, index) => (
        <div key={phase.name} className={styles.phaseCard}>
          <div className={styles.phaseHeader}>
            <span className={styles.phaseName}>
              {String(index + 1).padStart(2, '0')} · {phase.name}
            </span>
            <button
              type="button"
              className={styles.removeButton}
              aria-label={`Remove ${phase.name} phase`}
              onClick={() => dispatch({ type: 'removePhase', name: phase.name })}
            >
              ×
            </button>
          </div>

          <div className={styles.field}>
            <label htmlFor={`pt-phase-${phase.name}`} className={styles.label}>
              Description
            </label>
            <textarea
              id={`pt-phase-${phase.name}`}
              className={styles.textarea}
              value={phase.description}
              onChange={(e) =>
                dispatch({
                  type: 'setPhase',
                  name: phase.name,
                  patch: { description: e.target.value },
                })
              }
            />
          </div>

          <div className={styles.field} style={{ marginTop: 10 }}>
            <label htmlFor={`pt-phase-weeks-${phase.name}`} className={styles.label}>
              Duration (weeks, optional)
            </label>
            <input
              id={`pt-phase-weeks-${phase.name}`}
              className={`${styles.input} ${styles.phaseDuration}`}
              type="number"
              min={0}
              step={1}
              value={phase.durationWeeks ?? ''}
              onChange={(e) =>
                dispatch({
                  type: 'setPhase',
                  name: phase.name,
                  patch: {
                    durationWeeks:
                      e.target.value === '' ? undefined : Math.round(parseAmount(e.target.value)),
                  },
                })
              }
            />
          </div>
        </div>
      ))}

      {removed.length > 0 && (
        <div className={styles.restoreRow}>
          <span>Removed:</span>
          {removed.map((name) => (
            <button
              key={name}
              type="button"
              className={styles.addButton}
              style={{ marginTop: 0 }}
              onClick={() => dispatch({ type: 'restorePhase', name })}
            >
              Restore {name}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
