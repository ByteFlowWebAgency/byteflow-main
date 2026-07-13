'use client';

// Shared confirmation dialog for destructive/consequential internal-tool actions
// (CRM deletions, lost-reason prompt, budget deletion, restore-from-backup). Optional
// required text input via promptLabel. The confirm action may be async — failures
// render inline and keep the dialog open, so a failed action is never mistaken for a
// completed one. Escape cancels.

import { useEffect, useState } from 'react';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  /** When set, a required text field is shown and its value passed to onConfirm. */
  promptLabel?: string;
  promptPlaceholder?: string;
  promptDefault?: string;
  onConfirm: (promptValue: string) => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger,
  promptLabel,
  promptPlaceholder,
  promptDefault,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [promptValue, setPromptValue] = useState(promptDefault ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const confirm = async () => {
    if (busy || (promptLabel && !promptValue.trim())) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(promptValue.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — try again.');
      setBusy(false);
    }
  };

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
        {promptLabel && (
          <div className={styles.field}>
            <label
              htmlFor="it-confirm-prompt"
              className={`${styles.label} ${styles.required}`}
            >
              {promptLabel}
            </label>
            <input
              id="it-confirm-prompt"
              className={styles.input}
              type="text"
              value={promptValue}
              placeholder={promptPlaceholder}
              onChange={(e) => setPromptValue(e.target.value)}
              autoFocus
            />
          </div>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            autoFocus={!promptLabel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={danger ? styles.dangerButton : styles.confirmButton}
            disabled={busy || Boolean(promptLabel && !promptValue.trim())}
            onClick={confirm}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
