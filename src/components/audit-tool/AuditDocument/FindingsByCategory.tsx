'use client';

import styles from './AuditDocument.module.css';
import { CATEGORY_LABELS, CATEGORY_ORDER, SEVERITY_LABELS } from '@/lib/audit-tool/labels';
import type { AuditFinding } from '@/lib/audit-tool/types';

const SEVERITY_CLASS: Record<AuditFinding['severity'], string> = {
  critical: styles.sevCritical,
  high: styles.sevHigh,
  medium: styles.sevMedium,
  low: styles.sevLow,
  good: styles.sevGood,
};

export default function FindingsByCategory({ findings }: { findings: AuditFinding[] }) {
  if (findings.length === 0) {
    return (
      <section className={styles.section} data-pdf-block>
        <h2 className={styles.sectionHeading}>Findings</h2>
        <p className={styles.placeholder}>[Add findings to build the report]</p>
      </section>
    );
  }

  return (
    <>
      {CATEGORY_ORDER.map((category) => {
        const categoryFindings = findings.filter((f) => f.category === category);
        if (categoryFindings.length === 0) return null;
        return (
          <section key={category} className={styles.section}>
            <div data-pdf-block data-pdf-keep-next>
              <h2 className={styles.sectionHeading}>{CATEGORY_LABELS[category]}</h2>
            </div>
            <div className={styles.findingList}>
              {categoryFindings.map((finding) => (
                <article
                  key={finding.id}
                  className={`${styles.finding} ${SEVERITY_CLASS[finding.severity]}`}
                  data-pdf-block
                >
                  <div className={styles.findingHeader}>
                    <h3 className={styles.findingTitle}>
                      {finding.title.trim() || '[Finding title]'}
                    </h3>
                    <span className={`${styles.badge} ${SEVERITY_CLASS[finding.severity]}`}>
                      {SEVERITY_LABELS[finding.severity]}
                    </span>
                  </div>
                  {finding.description.trim() && (
                    <p className={styles.body}>{finding.description}</p>
                  )}
                  {finding.recommendation.trim() && (
                    <p className={styles.recommendation}>
                      <span className={styles.recommendationLabel}>
                        {finding.severity === 'good' ? 'Keep doing' : 'Recommendation'}
                      </span>
                      {finding.recommendation}
                    </p>
                  )}
                  {finding.screenshotDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- in-memory data URL
                    <img
                      src={finding.screenshotDataUrl}
                      alt={`Screenshot: ${finding.title.trim() || 'finding evidence'}`}
                      className={styles.screenshot}
                    />
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
