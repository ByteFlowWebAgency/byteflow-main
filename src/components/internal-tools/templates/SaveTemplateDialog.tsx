'use client';

import { useEffect, useState } from 'react';
import styles from './SaveTemplateDialog.module.css';

interface SaveTemplateDialogProps {
  documentLabel: string;
  /** Existing custom-template names for this document type (overwrite detection). */
  existingNames: string[];
  /** Returns an error message to display, or null on success (dialog closes). */
  onSave: (name: string, description: string, overwrite: boolean) => string | null;
  onCancel: () => void;
}

/**
 * "Save as template" prompt: name (required) + description. Saving under an existing
 * custom template's name warns and requires a second, explicit confirmation click.
 */
export default function SaveTemplateDialog({
  documentLabel,
  existingNames,
  onSave,
  onCancel,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const collides = existingNames.some((n) => n.toLowerCase() === name.trim().toLowerCase());

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give the template a name.');
      return;
    }
    if (collides && !confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }
    const problem = onSave(trimmed, description.trim(), collides);
    if (problem) setError(problem);
  };

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Save as template"
      >
        <h2 className={styles.title}>Save as template</h2>
        <p className={styles.body}>
          Captures this {documentLabel}&rsquo;s theme, cover setting, and content as a
          reusable starting point. New documents get fresh copies — editing them never
          changes the template.
        </p>
        <div className={styles.field}>
          <label htmlFor="tpl-save-name" className={`${styles.label} ${styles.required}`}>
            Template name
          </label>
          <input
            id="tpl-save-name"
            className={styles.input}
            type="text"
            value={name}
            maxLength={80}
            autoFocus
            onChange={(event) => {
              setName(event.target.value);
              setConfirmOverwrite(false);
              setError(null);
            }}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="tpl-save-description" className={styles.label}>
            Description
          </label>
          <input
            id="tpl-save-description"
            className={styles.input}
            type="text"
            value={description}
            maxLength={300}
            placeholder="When to use this template"
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        {confirmOverwrite && (
          <p className={styles.warning} role="alert">
            A template named &ldquo;{name.trim()}&rdquo; already exists — saving again
            overwrites it.
          </p>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={styles.confirmButton} onClick={save}>
            {confirmOverwrite ? 'Overwrite template' : 'Save template'}
          </button>
        </div>
      </div>
    </div>
  );
}
