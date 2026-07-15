'use client';

// The "Add slide" picker: a single flat grid of all 25 templates — no categories, no
// grouping, no tabs (docs/slides/00-GUARDRAILS.md / 03-EDITOR-SCREEN.md). Search-by-typing
// is a nice-to-have on top of the full flat list, not a replacement for it.

import { useState } from 'react';
import styles from './SlideTemplatePicker.module.css';
import { SLIDE_TEMPLATE_IDS } from '@/lib/slides/types';
import { TEMPLATE_LABELS } from '@/lib/slides/templateLabels';
import type { SlideTemplateId } from '@/lib/slides/types';

export default function SlideTemplatePicker({
  onPick,
  onClose,
}: {
  onPick: (templateId: SlideTemplateId) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const visible = q
    ? SLIDE_TEMPLATE_IDS.filter((id) => TEMPLATE_LABELS[id].name.toLowerCase().includes(q))
    : SLIDE_TEMPLATE_IDS;

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Add slide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.heading}>Add slide</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search 25 templates…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {visible.length === 0 ? (
          <p className={styles.empty}>No templates match &ldquo;{query}&rdquo;.</p>
        ) : (
          <div className={styles.grid}>
            {visible.map((id) => (
              <button key={id} type="button" className={styles.card} onClick={() => onPick(id)}>
                <span className={styles.cardName}>{TEMPLATE_LABELS[id].name}</span>
                <span className={styles.cardDescription}>{TEMPLATE_LABELS[id].description}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
