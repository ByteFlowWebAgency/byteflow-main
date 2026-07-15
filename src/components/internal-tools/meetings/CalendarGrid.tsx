'use client';

import { useMemo } from 'react';
import type { ResolvedMeeting } from '@/lib/meetings/types';
import styles from './meetings.module.css';

/**
 * A native month grid (06-CALENDAR-VIEW.md), built from the same event+match data as the
 * list. Deliberately NOT Google's iframe embed: that needs the calendar shared publicly to
 * render, is unstyled, and cannot carry the CRM/document context this whole feature is for.
 *
 * Pure presentation — its parent owns the data, so navigating months cannot start a
 * competing fetch against the list's.
 */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** More than this in one cell and the grid stops being readable — collapse to "+N more". */
const MAX_CHIPS = 2;

const STATUS_CLASS = {
  ready: styles.chipReady,
  'needs-prep': styles.chipNeedsPrep,
  unknown: styles.chipUnknown,
} as const;

const STATUS_WORD = {
  ready: 'Ready',
  'needs-prep': 'Needs prep',
  unknown: 'No client linked',
} as const;

/** The 6×7 window a month grid shows, including the leading/trailing days of its neighbours. */
export function monthGridDays(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function CalendarGrid({
  month,
  meetings,
  onOpen,
  onShowDay,
}: {
  month: Date;
  meetings: ResolvedMeeting[];
  onOpen: (meeting: ResolvedMeeting) => void;
  onShowDay: (day: Date, meetings: ResolvedMeeting[]) => void;
}) {
  const byDay = useMemo(() => {
    const map = new Map<string, ResolvedMeeting[]>();
    for (const meeting of meetings) {
      const key = new Date(meeting.event.startsAt).toDateString();
      const list = map.get(key) ?? [];
      list.push(meeting);
      map.set(key, list);
    }
    return map;
  }, [meetings]);

  const days = useMemo(() => monthGridDays(month), [month]);
  const today = new Date().toDateString();

  return (
    <div className={styles.grid}>
      {WEEKDAYS.map((d) => (
        <div key={d} className={styles.weekday}>
          {d}
        </div>
      ))}
      {days.map((day) => {
        const key = day.toDateString();
        const dayMeetings = byDay.get(key) ?? [];
        const outside = day.getMonth() !== month.getMonth();
        const isToday = key === today;
        const shown = dayMeetings.slice(0, MAX_CHIPS);
        const hidden = dayMeetings.length - shown.length;

        return (
          <div
            key={key}
            className={`${styles.cell} ${outside ? styles.cellOutside : ''} ${isToday ? styles.cellToday : ''}`}
          >
            <span className={styles.cellDate}>
              {day.getDate()}
              {isToday && <span className="sr-only"> (today)</span>}
            </span>
            {shown.map((meeting) => (
              <button
                key={meeting.event.id}
                type="button"
                className={`${styles.chip} ${STATUS_CLASS[meeting.docStatus]}`}
                onClick={() => onOpen(meeting)}
                // The chip is tiny, so the status word lives in the tooltip and the dialog —
                // the colour on its edge is a reminder, never the only signal.
                title={`${meeting.event.title} — ${
                  meeting.match ? meeting.match.organizationName : 'no client linked'
                } — ${STATUS_WORD[meeting.docStatus]}`}
              >
                <span className={styles.chipTitle}>{meeting.event.title}</span>
              </button>
            ))}
            {hidden > 0 && (
              <button
                type="button"
                className={styles.moreButton}
                onClick={() => onShowDay(day, dayMeetings)}
              >
                +{hidden} more
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
