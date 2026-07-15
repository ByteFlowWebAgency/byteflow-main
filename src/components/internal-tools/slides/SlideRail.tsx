'use client';

// The slide rail: a labeled entry per slide (per docs/slides/03-EDITOR-SCREEN.md, "a
// thumbnail or labeled entry" — labeled entries are explicitly sufficient), reorder via
// up/down, duplicate, delete-with-confirm, and "Add slide" opening the template picker.
//
// The delete-confirmation dialog itself is NOT rendered here — see DeckEditorApp, which
// renders it outside the sticky rail wrapper. `position: sticky` (on that wrapper)
// unconditionally creates a new CSS stacking context, which traps a nested
// `position: fixed` dialog's z-index inside it — the dialog would still be positioned
// correctly (full viewport) but paint BENEATH the canvas, since the whole sticky
// subtree loses the outer stacking comparison to its later DOM-order sibling. Confirmed
// by screenshot + elementsFromPoint during Phase 5 verification, not assumed.

import styles from './SlideRail.module.css';
import { TEMPLATE_LABELS } from '@/lib/slides/templateLabels';
import type { Slide } from '@/lib/slides/types';

function slideSnippet(slide: Slide): string {
  switch (slide.templateId) {
    case 'testimonial':
      return slide.content.quote || 'No quote yet';
    case 'bigStat':
      return slide.content.statLabel || 'No label yet';
    case 'fullBleedImage':
      return slide.content.caption || 'No caption';
    default: {
      const title = (slide.content as { title?: string }).title;
      return title || 'Untitled';
    }
  }
}

export default function SlideRail({
  slides,
  selectedIndex,
  onSelect,
  onReorder,
  onDuplicate,
  onRequestDelete,
  onAddClick,
}: {
  slides: Slide[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onReorder: (index: number, dir: -1 | 1) => void;
  onDuplicate: (index: number) => void;
  onRequestDelete: (index: number) => void;
  onAddClick: () => void;
}) {
  return (
    <div className={styles.rail} aria-label="Slides">
      {slides.map((slide, i) => (
        <div key={slide.id} className={`${styles.item} ${i === selectedIndex ? styles.itemActive : ''}`}>
          <button
            type="button"
            className={styles.itemButton}
            onClick={() => onSelect(i)}
            aria-current={i === selectedIndex ? 'true' : undefined}
          >
            <div className={styles.itemIndex}>
              {i + 1} · {TEMPLATE_LABELS[slide.templateId].name}
            </div>
            <div className={styles.itemName}>{slideSnippet(slide)}</div>
          </button>
          <div className={styles.itemControls}>
            <div className={styles.iconRow}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => onReorder(i, -1)}
                disabled={i === 0}
                aria-label="Move slide up"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => onReorder(i, 1)}
                disabled={i === slides.length - 1}
                aria-label="Move slide down"
                title="Move down"
              >
                ↓
              </button>
            </div>
            <div className={styles.iconRow}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => onDuplicate(i)}
                aria-label="Duplicate slide"
                title="Duplicate"
              >
                ⧉
              </button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => onRequestDelete(i)}
                disabled={slides.length <= 1}
                aria-label="Delete slide"
                title="Delete"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}

      <button type="button" className={styles.addButton} onClick={onAddClick}>
        + Add slide
      </button>
    </div>
  );
}
