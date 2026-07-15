'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Contact, Organization } from '@/lib/crm/types';
import type { ResolvedMeeting } from '@/lib/meetings/types';
import { checkOrganizationReadiness } from '@/lib/meetings/readiness';
import DocStatusBadge from './DocStatusBadge';
import OrgPicker from './OrgPicker';
import styles from './meetings.module.css';

/**
 * ONE dialog, launched from both the meetings list row and the calendar grid chip
 * (07-MISSING-DOCUMENT-FLOW.md: "Both call the same flow — build it once, launch it from
 * both places"), and it is also the shared event-detail popover 06-CALENDAR-VIEW.md asks the
 * grid and list to reuse rather than duplicate.
 *
 * It walks the same guided path the spec describes, in order, and refuses to skip a step:
 *   1. No CRM match      → link one. Document generation is NOT offered; there'd be nothing
 *                          to fill it with, and an unattributed document defeats the point.
 *   2. Matched, bad data → stop, list exactly what's wrong, deep-link to the record. Never
 *                          auto-fill: this step exists to catch bad data before it reaches
 *                          a client-facing document.
 *   3. Matched, clean    → into the Document Builder, pre-filled from the CRM record.
 */
export default function MeetingDialog({
  meeting,
  organizations,
  contacts,
  onAssign,
  onClose,
}: {
  meeting: ResolvedMeeting;
  organizations: Organization[];
  contacts: Contact[];
  onAssign: (organizationId: string | null) => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reassigning, setReassigning] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const org = meeting.match
    ? organizations.find((o) => o.id === meeting.match?.organizationId)
    : undefined;

  const readiness = useMemo(
    () => (org ? checkOrganizationReadiness(org, contacts) : null),
    [org, contacts],
  );

  async function assign(organizationId: string | null) {
    setBusy(true);
    setError(null);
    try {
      await onAssign(organizationId);
      setReassigning(false);
    } catch {
      setError('Could not save that. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const when = new Date(meeting.event.startsAt);
  const timeLabel = meeting.event.isAllDay
    ? when.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    : when.toLocaleString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

  // Step 3's destination: the Document Builder, told which client this is for. The list page
  // reads ?forOrg and pre-fills the new document from that CRM record.
  const buildHref = org ? `/internal/documents?forOrg=${org.id}` : '/internal/documents';

  return (
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label={meeting.event.title}>
        <div>
          <h2 className={styles.dialogTitle}>{meeting.event.title}</h2>
          <p className={styles.dialogMeta}>{timeLabel}</p>
        </div>

        <div className={styles.dialogRow}>
          <span className={styles.label}>Client</span>
          <DocStatusBadge status={meeting.docStatus} />
        </div>

        {/* --- step 1: no CRM match ------------------------------------------------- */}
        {!meeting.match || reassigning ? (
          <>
            <p className={styles.dialogMeta}>
              {meeting.match
                ? `Currently linked to ${meeting.match.organizationName}. Pick a different organization:`
                : meeting.isManual
                  ? 'This meeting is marked as “not a client meeting”. Link it to an organization to change that:'
                  : 'This meeting isn’t linked to a CRM record yet. Link one to see whether their paperwork is ready:'}
            </p>
            <OrgPicker
              organizations={organizations}
              selectedId={meeting.match?.organizationId}
              onPick={assign}
              busy={busy}
            />
            <p className={styles.dialogMeta}>
              Not in the CRM yet? <Link href="/internal/crm" className={styles.docLink}>Add them first</Link>.
            </p>
          </>
        ) : (
          <>
            <p className={styles.dialogMeta}>
              <strong>{meeting.match.organizationName}</strong>
              {meeting.match.contactName ? ` · ${meeting.match.contactName}` : ''}
              {meeting.match.source === 'manual'
                ? ' — linked by hand'
                : meeting.match.signal === 'contact-email'
                  ? ' — matched on an attendee’s email'
                  : meeting.match.signal === 'org-domain'
                    ? ' — matched on the attendee’s email domain'
                    : ' — matched on the meeting title'}
            </p>

            {/* --- step 2: CRM record completeness ---------------------------------- */}
            {readiness && !readiness.ok ? (
              <>
                <div className={styles.problemList}>
                  <span className={styles.label}>Fix the CRM record first</span>
                  {readiness.problems.map((p, i) => (
                    <span key={i} className={styles.problem}>
                      • {p.message}{' '}
                      <Link href={`/internal/crm?${p.link.kind}=${p.link.id}`} className={styles.docLink}>
                        Open record
                      </Link>
                    </span>
                  ))}
                </div>
                <p className={styles.dialogMeta}>
                  A document built from this would carry the same gaps, so generation is held
                  until they’re sorted.
                </p>
              </>
            ) : meeting.docStatus === 'ready' ? (
              <>
                <span className={styles.label}>Documents for this client</span>
                <div className={styles.docList}>
                  {meeting.documents.map((doc) => (
                    <Link key={doc.id} href={`/internal/documents/${doc.id}`} className={styles.docLink}>
                      {doc.name}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              /* --- step 3: clean record, no document yet -------------------------- */
              <p className={styles.dialogMeta}>
                The CRM record looks complete
                {readiness?.keyContact ? ` (${readiness.keyContact.name})` : ''}, but there’s no
                document for this client yet.
              </p>
            )}
          </>
        )}

        {error && <p className={styles.errorNote}>{error}</p>}

        <div className={styles.actions}>
          <button ref={closeRef} type="button" className={styles.ghostButton} onClick={onClose}>
            Close
          </button>
          {meeting.match && !reassigning && (
            <button
              type="button"
              className={styles.ghostButton}
              onClick={() => setReassigning(true)}
              disabled={busy}
            >
              Change client
            </button>
          )}
          {/* Only offered once there IS a linked record AND its data is clean. */}
          {meeting.match && !reassigning && readiness?.ok && (
            <Link href={buildHref} className={styles.primaryButton}>
              {meeting.docStatus === 'ready' ? 'New document' : 'Prepare document'}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
