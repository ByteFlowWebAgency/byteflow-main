'use client';

import { useState } from 'react';
import styles from './editor.module.css';
import { PAGE_KIND_LABELS, type DocumentPage, type PageKind } from '@/lib/document-builder/types';

interface PageRailProps {
  pages: DocumentPage[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onAddPage: (kind: PageKind) => void;
  onMovePage: (index: number, dir: -1 | 1) => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  hasCover: boolean;
}

function pageLabel(page: DocumentPage): string {
  if (page.kind === 'cover') return page.coverFields?.title || 'Cover';
  if (page.kind === 'sectionTitle') return page.sectionTitleFields?.title || 'Section';
  return PAGE_KIND_LABELS[page.kind];
}

/** Left rail: labeled, kind-distinguished page entries; add / reorder / duplicate / delete. */
export default function PageRail({
  pages,
  selectedIndex,
  onSelect,
  onAddPage,
  onMovePage,
  onDuplicatePage,
  onDeletePage,
  hasCover,
}: PageRailProps) {
  const [addOpen, setAddOpen] = useState(false);
  return (
    <aside className={styles.rail} aria-label="Pages">
      <ol className={styles.railList}>
        {pages.map((page, index) => {
          const pinnedCover = page.kind === 'cover';
          return (
            <li key={page.id}>
              <div
                className={`${styles.railItem} ${index === selectedIndex ? styles.railItemActive : ''} ${styles[`kind_${page.kind}`] ?? ''}`}
              >
                <button
                  type="button"
                  className={styles.railItemMain}
                  data-page-index={index}
                  onClick={() => onSelect(index)}
                  aria-current={index === selectedIndex}
                >
                  <span className={styles.railNum}>{index + 1}</span>
                  <span className={styles.railKind}>{PAGE_KIND_LABELS[page.kind]}</span>
                  <span className={styles.railName}>{pageLabel(page)}</span>
                </button>
                <div className={styles.railItemControls}>
                  <button
                    type="button"
                    onClick={() => onMovePage(index, -1)}
                    disabled={index === 0 || (hasCover && index === 1)}
                    aria-label="Move page up"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onMovePage(index, 1)}
                    disabled={index === pages.length - 1 || pinnedCover}
                    aria-label="Move page down"
                    title="Move down"
                  >
                    ↓
                  </button>
                  {!pinnedCover && (
                    <button type="button" onClick={() => onDuplicatePage(index)} aria-label="Duplicate page" title="Duplicate">
                      ⧉
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeletePage(index)}
                    disabled={pages.length <= 1}
                    aria-label="Delete page"
                    title="Delete"
                    className={styles.railDelete}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className={styles.railAdd}>
        <button
          type="button"
          className={styles.railAddButton}
          onClick={() => setAddOpen((v) => !v)}
          aria-expanded={addOpen}
        >
          + Add page
        </button>
        {addOpen && (
          <div className={styles.railAddMenu} role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onAddPage('content');
                setAddOpen(false);
              }}
            >
              Blank content page
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onAddPage('sectionTitle');
                setAddOpen(false);
              }}
            >
              Section title page
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onAddPage('closing');
                setAddOpen(false);
              }}
            >
              Closing page
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
