'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CalendarConnection.module.css';

/** POSTs the disconnect (never a GET — a link or an <img> must not be able to revoke). */
export default function DisconnectButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  async function disconnect() {
    setFailed(false);
    try {
      const response = await fetch('/api/google/disconnect', { method: 'POST' });
      if (!response.ok) {
        setFailed(true);
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setFailed(true);
    }
  }

  return (
    <span className={styles.actionStack}>
      <button
        type="button"
        className={styles.disconnect}
        onClick={disconnect}
        disabled={pending}
      >
        {pending ? 'Disconnecting…' : 'Disconnect'}
      </button>
      {failed ? (
        <span className={styles.actionError} role="alert">
          Couldn’t disconnect.
        </span>
      ) : null}
    </span>
  );
}
