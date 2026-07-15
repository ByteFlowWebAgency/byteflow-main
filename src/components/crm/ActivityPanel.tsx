'use client';

// Activity timeline + inline "log activity" form, shared by the deal detail and the
// contact detail (03-CRM-SCREENS.md). Newest first; the date is editable so last
// week's conversation can be backfilled.

import { useMemo, useState } from 'react';
import styles from './CrmApp.module.css';
import { useCrm } from './CrmContext';
import DateTimePicker from '@/components/internal-tools/datepicker/DateTimePicker';
import { ACTIVITY_KIND_LABELS, ACTIVITY_KINDS } from '@/lib/crm/labels';
import type { Activity, ActivityKind } from '@/lib/crm/types';

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatActivityDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ActivityPanel({
  dealId,
  contactId,
  linkLabel,
}: {
  dealId?: string;
  contactId?: string;
  /** Renders next to each entry: resolves the "other" reference, e.g. deal title on a contact timeline. */
  linkLabel?: (activity: Activity) => string | null;
}) {
  const { data, saveActivity } = useCrm();
  const [kind, setKind] = useState<ActivityKind>('note');
  const [summary, setSummary] = useState('');
  const [detail, setDetail] = useState('');
  const [at, setAt] = useState(() => toLocalInputValue(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entries = useMemo(
    () =>
      data.activities
        .filter((a) => (dealId ? a.dealId === dealId : a.contactId === contactId))
        .sort((a, b) => Date.parse(b.at) - Date.parse(a.at)),
    [data.activities, dealId, contactId],
  );

  const log = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || !summary.trim()) return;
    const atDate = new Date(at);
    setSaving(true);
    setError(null);
    try {
      await saveActivity({
        id: crypto.randomUUID(),
        dealId,
        contactId,
        kind,
        summary: summary.trim(),
        detail: detail.trim() || undefined,
        at: (Number.isNaN(atDate.getTime()) ? new Date() : atDate).toISOString(),
        createdAt: new Date().toISOString(),
      });
      setSummary('');
      setDetail('');
      setAt(toLocalInputValue(new Date()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the activity.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.section} aria-label="Activity log">
      <h3 className={styles.sectionTitle}>Activity</h3>

      <form onSubmit={log} className={styles.fieldGrid}>
        <div className={styles.field}>
          <label htmlFor="act-kind" className={styles.label}>
            Type
          </label>
          <select
            id="act-kind"
            className={styles.select}
            value={kind}
            onChange={(e) => setKind(e.target.value as ActivityKind)}
          >
            {ACTIVITY_KINDS.map((k) => (
              <option key={k} value={k}>
                {ACTIVITY_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="act-at" className={styles.label}>
            When
          </label>
          <DateTimePicker
            dateId="act-at"
            value={at}
            onChange={setAt}
            ariaLabel="Activity date"
          />
        </div>
        <div className={`${styles.field} ${styles.fieldWide}`}>
          <label htmlFor="act-summary" className={`${styles.label} ${styles.required}`}>
            Summary
          </label>
          <input
            id="act-summary"
            className={styles.input}
            type="text"
            value={summary}
            placeholder="One line — e.g. Intro call, went well"
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>
        <div className={`${styles.field} ${styles.fieldWide}`}>
          <label htmlFor="act-detail" className={styles.label}>
            Detail
          </label>
          <textarea
            id="act-detail"
            className={styles.textarea}
            value={detail}
            rows={2}
            onChange={(e) => setDetail(e.target.value)}
          />
        </div>
        <div className={`${styles.fieldWide} ${styles.formActions}`}>
          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className={styles.addButton}
            disabled={saving || !summary.trim()}
          >
            {saving ? 'Logging…' : 'Log activity'}
          </button>
        </div>
      </form>

      <div className={styles.activityList} style={{ marginTop: 16 }}>
        {entries.length === 0 && (
          <p className={styles.hint}>Nothing logged yet — calls, emails, and notes land here.</p>
        )}
        {entries.map((activity) => {
          const link = linkLabel?.(activity);
          return (
            <article key={activity.id} className={styles.activityItem}>
              <div className={styles.activityHead}>
                <span className={styles.activityKind}>
                  {ACTIVITY_KIND_LABELS[activity.kind] ?? activity.kind}
                </span>
                <span className={styles.activitySummary}>{activity.summary}</span>
              </div>
              <span className={styles.activityMeta}>
                {formatActivityDate(activity.at)}
                {link ? ` · ${link}` : ''}
              </span>
              {activity.detail && (
                <p className={styles.activityDetail}>{activity.detail}</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
