'use client';

import { useState } from 'react';
import styles from './AuditForm.module.css';
import type { AuditSectionProps } from './AuditForm';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  SEVERITY_LABELS,
  SEVERITY_ORDER,
} from '@/lib/audit-tool/labels';
import type { AuditFinding } from '@/lib/audit-tool/types';

/**
 * Read an image file into a data URL, downscaled to a sane width so a full-size photo
 * doesn't balloon the in-memory state or the exported PDF. Client-side only — nothing is
 * uploaded or stored anywhere.
 */
function readScreenshot(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const maxWidth = 1200;
      const scale = Math.min(1, maxWidth / image.naturalWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      const context = canvas.getContext('2d');
      if (!context) return reject(new Error('canvas unavailable'));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('unreadable image'));
    };
    image.src = url;
  });
}

function FindingCard({
  finding,
  index,
  dispatch,
}: {
  finding: AuditFinding;
  index: number;
  dispatch: AuditSectionProps['dispatch'];
}) {
  const update = (patch: Partial<Omit<AuditFinding, 'id'>>) =>
    dispatch({ type: 'updateFinding', id: finding.id, patch });

  return (
    <div className={styles.findingCard}>
      <div className={styles.findingHeader}>
        <input
          className={`${styles.input} ${styles.findingTitleInput}`}
          type="text"
          value={finding.title}
          placeholder="Finding title — short and specific"
          aria-label={`Finding ${index + 1} title`}
          onChange={(e) => update({ title: e.target.value })}
        />
        <select
          className={`${styles.select} ${styles.severitySelect}`}
          value={finding.severity}
          aria-label={`Finding ${index + 1} severity`}
          onChange={(e) => update({ severity: e.target.value as AuditFinding['severity'] })}
        >
          {SEVERITY_ORDER.map((severity) => (
            <option key={severity} value={severity}>
              {SEVERITY_LABELS[severity]}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.removeButton}
          aria-label={`Remove finding ${index + 1}`}
          onClick={() => dispatch({ type: 'removeFinding', id: finding.id })}
        >
          ×
        </button>
      </div>

      <div className={styles.field}>
        <label htmlFor={`au-desc-${finding.id}`} className={styles.label}>
          What&rsquo;s wrong
        </label>
        <textarea
          id={`au-desc-${finding.id}`}
          className={styles.textarea}
          rows={3}
          value={finding.description}
          onChange={(e) => update({ description: e.target.value })}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={`au-rec-${finding.id}`} className={styles.label}>
          Recommendation
        </label>
        <textarea
          id={`au-rec-${finding.id}`}
          className={styles.textarea}
          rows={2}
          value={finding.recommendation}
          onChange={(e) => update({ recommendation: e.target.value })}
        />
      </div>

      <div className={styles.screenshotRow}>
        {finding.screenshotDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- in-memory data URL, next/image adds nothing
          <img
            src={finding.screenshotDataUrl}
            alt="Attached screenshot preview"
            className={styles.screenshotThumb}
          />
        )}
        <input
          type="file"
          accept="image/*"
          className={styles.fileInput}
          aria-label={`Finding ${index + 1} screenshot`}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              update({ screenshotDataUrl: await readScreenshot(file) });
            } catch {
              e.target.value = '';
            }
          }}
        />
        {finding.screenshotDataUrl && (
          <button
            type="button"
            className={styles.textButton}
            onClick={() => update({ screenshotDataUrl: undefined })}
          >
            Remove screenshot
          </button>
        )}
      </div>
    </div>
  );
}

function CategoryGroup({
  category,
  findings,
  dispatch,
}: {
  category: (typeof CATEGORY_ORDER)[number];
  findings: AuditFinding[];
  dispatch: AuditSectionProps['dispatch'];
}) {
  // Disclosure state is local so re-renders never fight the user's own toggling.
  const [open, setOpen] = useState(false);

  return (
    <details
      className={styles.categoryGroup}
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className={styles.categorySummary}>
        <span>
          {CATEGORY_LABELS[category]}
          {findings.length > 0 && (
            <span className={styles.categoryCount}>{findings.length}</span>
          )}
        </span>
      </summary>
      <div className={styles.categoryBody}>
        {findings.map((finding, index) => (
          <FindingCard key={finding.id} finding={finding} index={index} dispatch={dispatch} />
        ))}
        <button
          type="button"
          className={styles.addButton}
          style={{ marginTop: findings.length > 0 ? 10 : 0 }}
          onClick={() => dispatch({ type: 'addFinding', id: crypto.randomUUID(), category })}
        >
          + Add {CATEGORY_LABELS[category]} finding
        </button>
      </div>
    </details>
  );
}

export default function FindingsSection({ audit, dispatch }: AuditSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Findings</h2>
      {CATEGORY_ORDER.map((category) => (
        <CategoryGroup
          key={category}
          category={category}
          findings={audit.findings.filter((f) => f.category === category)}
          dispatch={dispatch}
        />
      ))}
    </section>
  );
}
