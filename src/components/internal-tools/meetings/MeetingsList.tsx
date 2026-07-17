'use client';

import type { ResolvedMeeting } from '@/lib/meetings/types';
import DocStatusBadge from './DocStatusBadge';
import styles from './meetings.module.css';

/**
 * The 7-day list (05-MEETINGS-WIDGET.md) — "what's coming up and am I ready", not a
 * browsing surface. Sorted ascending, grouped by day, today visually distinct.
 *
 * Pure presentation: it slices the data its parent already fetched. It does not fetch, so
 * it cannot become a second Calendar API call path.
 */

function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

export default function MeetingsList({
  meetings,
  onOpen,
}: {
  meetings: ResolvedMeeting[];
  onOpen: (meeting: ResolvedMeeting) => void;
}) {
  if (meetings.length === 0) {
    return <p className={styles.empty}>Nothing on the calendar for the next 7 days.</p>;
  }

  const today = new Date().toDateString();
  const groups: { key: string; items: ResolvedMeeting[] }[] = [];
  for (const meeting of meetings) {
    const key = dayKey(meeting.event.startsAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(meeting);
    else groups.push({ key, items: [meeting] });
  }

  return (
    <div>
      {groups.map((group) => {
        const isToday = group.key === today;
        const date = new Date(group.key);
        return (
          <section key={group.key}>
            <h3 className={`${styles.dayHeading} ${isToday ? styles.todayHeading : ''}`}>
              {isToday ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'long' })}
              <span className={styles.dayHeadingDate}>
                {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </h3>
            {group.items.map((meeting) => (
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
                    {meeting.match
                      ? meeting.match.organizationName
                      : meeting.isManual
                        ? 'Not a client meeting'
                        : 'Unmatched — click to link a client'}
                  </span>
                </span>
                <DocStatusBadge status={meeting.docStatus} />
              </button>
            ))}
          </section>
        );
      })}
    </div>
  );
}
