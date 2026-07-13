'use client';

// One-click full backup + validated all-or-nothing restore (01-CONTEXT-AND-STORAGE.md).
// One JSON file covers CRM AND budget data. Restore validates the entire file before a
// single write and merges by id — it never deletes records that aren't in the file.

import { useRef, useState } from 'react';
import styles from './CrmApp.module.css';
import ConfirmDialog from './ConfirmDialog';
import { backupAll, restoreAll, validateBackup, type BackupFile } from '@/lib/internal-tools/storage/backup';
import { downloadJson } from '@/lib/internal-tools/csv';
import { describeCounts } from '@/lib/crm/references';

export default function BackupControls({ onRestored }: { onRestored: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<BackupFile | null>(null);

  const report = (text: string, isError: boolean) => {
    setMessage(text);
    setMessageIsError(isError);
  };

  const backup = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const file = await backupAll();
      const stamp = new Date().toISOString().slice(0, 10);
      downloadJson(`ByteFlow-internal-tools-backup-${stamp}.json`, file);
      report('Backup downloaded.', false);
    } catch (err) {
      report(
        err instanceof Error ? err.message : 'Backup failed — try again.',
        true,
      );
    } finally {
      setBusy(false);
    }
  };

  const pickRestoreFile = async (file: File) => {
    setMessage(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      report('That file is not valid JSON — nothing was restored.', true);
      return;
    }
    try {
      validateBackup(parsed);
    } catch (err) {
      report(
        err instanceof Error ? err.message : 'Invalid backup file — nothing was restored.',
        true,
      );
      return;
    }
    setPendingRestore(parsed);
  };

  const counts = (file: BackupFile) =>
    describeCounts([
      { count: file.data.organizations.length, noun: 'organization' },
      { count: file.data.contacts.length, noun: 'contact' },
      { count: file.data.deals.length, noun: 'deal' },
      { count: file.data.activities.length, noun: 'activity', plural: 'activities' },
      { count: file.data.budgets.length, noun: 'budget' },
    ]) || 'no records';

  return (
    <>
      <button type="button" className={styles.ghostButton} onClick={backup} disabled={busy}>
        {busy ? 'Working…' : 'Backup all data'}
      </button>
      <button
        type="button"
        className={styles.ghostButton}
        onClick={() => fileRef.current?.click()}
        disabled={busy}
      >
        Restore…
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void pickRestoreFile(file);
        }}
      />
      {message && (
        <span
          className={messageIsError ? styles.formError : styles.hint}
          role={messageIsError ? 'alert' : 'status'}
        >
          {message}
        </span>
      )}

      {pendingRestore && (
        <ConfirmDialog
          title="Restore from backup?"
          body={`This backup from ${new Date(pendingRestore.exportedAt).toLocaleString('en-US')} contains ${counts(pendingRestore)}. Restoring merges these records back in by id — it never deletes anything that isn't in the file.`}
          confirmLabel="Restore"
          onCancel={() => setPendingRestore(null)}
          onConfirm={async () => {
            const restored = await restoreAll(pendingRestore);
            setPendingRestore(null);
            report(
              `Restored ${restored.organizations + restored.contacts + restored.deals + restored.activities + restored.budgets} records.`,
              false,
            );
            onRestored();
          }}
        />
      )}
    </>
  );
}
