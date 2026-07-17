'use client';

import { useMemo, useState } from 'react';
import type { Organization } from '@/lib/crm/types';
import styles from './meetings.module.css';

/**
 * Searchable CRM organization picker — the manual-override control from
 * 04-CRM-LINKING.md step 4, used inline by the meetings list and by the grid's detail
 * popover, so a wrong or missing match is fixed without leaving the page.
 */
export default function OrgPicker({
  organizations,
  selectedId,
  onPick,
  busy,
}: {
  organizations: Organization[];
  selectedId?: string;
  onPick: (organizationId: string | null) => void;
  busy?: boolean;
}) {
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...organizations].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter((o) => o.name.toLowerCase().includes(q));
  }, [organizations, query]);

  return (
    <div className={styles.picker}>
      <input
        type="search"
        className={styles.search}
        placeholder="Search organizations…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search CRM organizations"
        disabled={busy}
      />
      <div className={styles.options} role="listbox" aria-label="CRM organizations">
        {matches.map((org) => (
          <button
            key={org.id}
            type="button"
            role="option"
            aria-selected={org.id === selectedId}
            className={`${styles.option} ${org.id === selectedId ? styles.optionActive : ''}`}
            onClick={() => onPick(org.id)}
            disabled={busy}
          >
            {org.name}
          </button>
        ))}
        {matches.length === 0 && (
          <span className={`${styles.option} ${styles.optionNone}`}>
            No organization matches “{query}”.
          </span>
        )}
        {/* Explicitly unmatching is a real answer, not an absence of one: it records "this
            isn't a client meeting" so the automatic matcher stops guessing at it. */}
        <button
          type="button"
          className={`${styles.option} ${styles.optionNone}`}
          onClick={() => onPick(null)}
          disabled={busy}
        >
          Not a client meeting — leave unmatched
        </button>
      </div>
    </div>
  );
}
