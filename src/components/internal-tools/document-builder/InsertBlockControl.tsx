'use client';

import { useState } from 'react';
import styles from './editor.module.css';
import { BLOCK_TYPES, BLOCK_LABELS, type BlockType } from '@/lib/document-builder/types';

/** The "+" affordance between blocks (and at page end): opens a block-type picker. */
export default function InsertBlockControl({ onInsert }: { onInsert: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.insert}>
      <button
        type="button"
        className={styles.insertButton}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Insert a block here"
      >
        + Insert block
      </button>
      {open && (
        <div className={styles.insertMenu} role="menu">
          {BLOCK_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              role="menuitem"
              className={styles.insertMenuItem}
              onClick={() => {
                onInsert(type);
                setOpen(false);
              }}
            >
              {BLOCK_LABELS[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
