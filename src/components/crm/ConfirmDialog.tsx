'use client';

// Confirmation dialog used for destructive CRM actions and the lost-reason prompt.
// Optional required text input (promptLabel) covers "why was this lost?". The confirm
// action may be async — failures render inline and keep the dialog open, so a failed
// delete/restore is never mistaken for a completed one.

import { useEffect, useState } from 'react';
import styles from './CrmApp.module.css';

export interface ConfirmDialogProps {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  /** When set, a required text field is shown and its value passed to onConfirm. */
  promptLabel?: string;
  promptPlaceholder?: string;
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
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [promptValue, setPromptValue] = useState('');
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
        <h2 className={styles.dialogTitle}>{title}</h2>
        <p className={styles.dialogBody}>{body}</p>
        {promptLabel && (
          <div className={styles.field}>
            <label htmlFor="crm-confirm-prompt" className={`${styles.label} ${styles.required}`}>
              {promptLabel}
            </label>
            <input
              id="crm-confirm-prompt"
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
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
        <div className={styles.formActions}>
          <button type="button" className={styles.ghostButton} onClick={onCancel} autoFocus={!promptLabel}>
            Cancel
          </button>
          <button
            type="button"
            className={danger ? styles.dangerButton : styles.primaryButton}
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
