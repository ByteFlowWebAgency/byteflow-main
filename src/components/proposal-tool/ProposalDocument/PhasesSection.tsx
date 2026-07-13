'use client';

import styles from './ProposalDocument.module.css';
import type { EngagementPhase } from '@/lib/proposal-tool/types';

export default function PhasesSection({ phases }: { phases: EngagementPhase[] }) {
  return (
    <section className={styles.section}>
      <div data-pdf-block data-pdf-keep-next>
        <h2 className={styles.sectionHeading}>How we&rsquo;ll work together</h2>
      </div>
      <div className={styles.phaseList}>
        {phases.map((phase, index) => (
          <article key={phase.name} className={styles.phaseCard} data-pdf-block>
            <div className={styles.phaseIndex}>{String(index + 1).padStart(2, '0')}</div>
            <div>
              <h3 className={styles.phaseName}>
                {phase.name}
                {phase.durationWeeks ? (
                  <span className={styles.phaseDuration}>
                    {' '}
                    · {phase.durationWeeks} {phase.durationWeeks === 1 ? 'week' : 'weeks'}
                  </span>
                ) : null}
              </h3>
              <p className={styles.body}>{phase.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
