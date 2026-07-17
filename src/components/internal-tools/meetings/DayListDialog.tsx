'use client';

import { useEffect, useRef } from 'react';
import type { ResolvedMeeting } from '@/lib/meetings/types';
import DocStatusBadge from './DocStatusBadge';
import styles from './meetings.module.css';

/** Everything on one day — where the grid's "+N more" goes, rather than squashing the cell. */
export default function DayListDialog({
  day,
  meetings,
  onOpen,
  onClose,
}: {
  day: Date;
  meetings: ResolvedMeeting[];
  onOpen: (meeting: ResolvedMeeting) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.dialog} role="dialog" aria-modal="true">
        <h2 className={styles.dialogTitle}>
          {day.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </h2>
        <div>
          {meetings.map((meeting) => (
            <button
              key={meeting.event.id}
              type="button"
              className={styles.row}
              onClick={() => onOpen(meeting)}
            >
              <span className={styles.rowTime}>
                {meeting.event.isAllDay
                  ? 'All day'
                  : new Date(meeting.event.startsAt).toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
              </span>
              <span className={styles.rowMain}>
                <span className={styles.rowTitle}>{meeting.event.title}</span>
                <span className={`${styles.rowOrg} ${!meeting.match ? styles.rowUnmatched : ''}`}>
                  {meeting.match ? meeting.match.organizationName : 'Unmatched'}
                </span>
              </span>
              <DocStatusBadge status={meeting.docStatus} />
            </button>
          ))}
        </div>
        <div className={styles.actions}>
          <button ref={closeRef} type="button" className={styles.ghostButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
