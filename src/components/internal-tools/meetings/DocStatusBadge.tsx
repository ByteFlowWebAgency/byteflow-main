import type { DocStatus } from '@/lib/meetings/types';
import styles from './meetings.module.css';

/**
 * THE document-status indicator. 06-CALENDAR-VIEW.md requires the grid to reuse the list's
 * indicator rather than grow a second one with different visuals — so both import this.
 *
 * Accessibility: never colour alone (02-DASHBOARD-CLEANUP.md). Each state pairs a distinct
 * glyph with a distinct word, so it reads correctly in greyscale and to a screen reader.
 */
const COPY: Record<DocStatus, { label: string; glyph: string; className: string; title: string }> = {
  ready: {
    label: 'Ready',
    glyph: '✓',
    className: 'badgeReady',
    title: 'A document is linked to this client',
  },
  'needs-prep': {
    label: 'Needs prep',
    glyph: '!',
    className: 'badgeNeedsPrep',
    title: 'This client has no document yet',
  },
  unknown: {
    label: 'No client',
    glyph: '?',
    className: 'badgeUnknown',
    title: 'Not linked to a CRM record, so document status is unknown',
  },
};

export default function DocStatusBadge({ status }: { status: DocStatus }) {
  const copy = COPY[status];
  return (
    <span className={`${styles.badge} ${styles[copy.className]}`} title={copy.title}>
      <span aria-hidden>{copy.glyph}</span>
      {copy.label}
    </span>
  );
}
