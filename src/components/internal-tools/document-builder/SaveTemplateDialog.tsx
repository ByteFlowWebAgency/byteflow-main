'use client';

import { useState } from 'react';
import styles from './chooser.module.css';

interface SaveTemplateDialogProps {
  existingNames: string[];
  /** Returns an error string to show inline, or null on success (dialog then closes). */
  onSave: (name: string, description: string, category: string, overwrite: boolean) => string | null;
  onCancel: () => void;
}

export default function SaveTemplateDialog({ existingNames, onSave, onCancel }: SaveTemplateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Custom');
  const [error, setError] = useState('');
  const [armed, setArmed] = useState(false);

  const collision = existingNames.some((n) => n.toLowerCase() === name.trim().toLowerCase());

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('A template name is required.');
      return;
    }
    if (collision && !armed) {
      setArmed(true);
      return;
    }
    const result = onSave(trimmed, description, category.trim() || 'Custom', armed && collision);
    if (result) setError(result);
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Save as template">
      <div className={styles.dialog}>
        <h2 className={styles.dialogTitle}>Save as template</h2>
        <label className={styles.field}>
          <span>Name</span>
          <input
            type="text"
            value={name}
            maxLength={80}
            onChange={(e) => {
              setName(e.target.value);
              setArmed(false);
              setError('');
            }}
            autoFocus
          />
        </label>
        <label className={styles.field}>
          <span>Description</span>
          <input type="text" value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Category</span>
          <input type="text" value={category} maxLength={60} onChange={(e) => setCategory(e.target.value)} />
        </label>
        {collision && armed && (
          <p className={styles.warn} role="alert">
            A template named “{name.trim()}” already exists. Click again to overwrite it.
          </p>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.dialogActions}>
          <button type="button" className={styles.ghostBtn} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={styles.primaryBtn} onClick={submit}>
            {collision && armed ? 'Overwrite template' : 'Save template'}
          </button>
        </div>
      </div>
    </div>
  );
}
