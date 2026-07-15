'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCrm } from '@/components/crm/CrmContext';
import type { ResolvedMeeting } from '@/lib/meetings/types';
import MeetingsList from './MeetingsList';
import CalendarGrid from './CalendarGrid';
import MeetingDialog from './MeetingDialog';
import DayListDialog from './DayListDialog';
import styles from './meetings.module.css';

/**
 * Owns the meetings data for BOTH views.
 *
 * This is what makes two of the specs' gates true by construction rather than by
 * discipline: there is exactly one fetch (`/api/meetings`, one range covering both views),
 * so the grid's month navigation cannot start a competing request against the list's data;
 * and a reassignment made in either view updates the one array both render from, so it
 * shows up in the other immediately with no reload.
 */

const DAY_MS = 86_400_000;

/** The 7-day list window. */
function listWindow(now: Date): { from: Date; to: Date } {
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  return { from, to: new Date(from.getTime() + 7 * DAY_MS) };
}

/** The 6-week window a month grid actually displays, neighbours included. */
function gridWindow(month: Date): { from: Date; to: Date } {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const from = new Date(first);
  from.setDate(1 - first.getDay());
  from.setHours(0, 0, 0, 0);
  return { from, to: new Date(from.getTime() + 42 * DAY_MS) };
}

export default function MeetingsSection({ connected }: { connected: boolean }) {
  const { data } = useCrm();
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [meetings, setMeetings] = useState<ResolvedMeeting[]>([]);
  const [loading, setLoading] = useState(connected);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<ResolvedMeeting | null>(null);
  const [dayList, setDayList] = useState<{ day: Date; items: ResolvedMeeting[] } | null>(null);

  // ONE range covering both views, so switching tabs never refetches and the list always
  // has its 7 days even while the grid is parked on a different month.
  const range = useMemo(() => {
    const list = listWindow(new Date());
    const grid = gridWindow(month);
    return {
      from: new Date(Math.min(list.from.getTime(), grid.from.getTime())),
      to: new Date(Math.max(list.to.getTime(), grid.to.getTime())),
    };
  }, [month]);

  const load = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/meetings?from=${range.from.toISOString()}&to=${range.to.toISOString()}`,
        { cache: 'no-store' },
      );
      const body = await response.json();
      if (!response.ok) {
        setError(
          body?.error?.code === 'NOT_CONNECTED'
            ? 'Google Calendar isn’t connected.'
            : 'Could not load meetings.',
        );
        setMeetings([]);
        return;
      }
      setMeetings((body.data ?? []) as ResolvedMeeting[]);
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, [connected, range]);

  useEffect(() => {
    void load();
  }, [load]);

  /** The manual override. Both views route through here → one persisted source of truth. */
  const assign = useCallback(
    async (meeting: ResolvedMeeting, organizationId: string | null) => {
      const response = await fetch('/api/meetings/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: meeting.event.id,
          startsAt: meeting.event.startsAt,
          organizationId,
        }),
      });
      if (!response.ok) throw new Error('assign failed');
      // Refetch rather than patch locally: the doc status depends on the newly linked org's
      // documents, which only the server knows. Both views re-render from the result.
      await load();
      setOpen(null);
    },
    [load],
  );

  const listMeetings = useMemo(() => {
    const { from, to } = listWindow(new Date());
    return meetings.filter((m) => {
      const t = new Date(m.event.startsAt).getTime();
      return t >= from.getTime() && t < to.getTime();
    });
  }, [meetings]);

  const gridMeetings = useMemo(() => {
    const { from, to } = gridWindow(month);
    return meetings.filter((m) => {
      const t = new Date(m.event.startsAt).getTime();
      return t >= from.getTime() && t < to.getTime();
    });
  }, [meetings, month]);

  if (!connected) return null;

  const isCurrentMonth =
    month.getMonth() === new Date().getMonth() && month.getFullYear() === new Date().getFullYear();

  return (
    <div className={styles.card}>
      <div className={styles.viewSwitch}>
        <button
          type="button"
          className={`${styles.switchButton} ${view === 'list' ? styles.switchActive : ''}`}
          onClick={() => setView('list')}
          aria-pressed={view === 'list'}
        >
          Next 7 days
        </button>
        <button
          type="button"
          className={`${styles.switchButton} ${view === 'grid' ? styles.switchActive : ''}`}
          onClick={() => setView('grid')}
          aria-pressed={view === 'grid'}
        >
          Calendar
        </button>
        <span className={styles.spacer} />
        {view === 'grid' && (
          <>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className={styles.rangeLabel}>
              {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              aria-label="Next month"
            >
              ›
            </button>
            {/* Only offered once you've navigated away — otherwise it's a no-op button. */}
            {!isCurrentMonth && (
              <button
                type="button"
                className={styles.navButton}
                onClick={() => {
                  const d = new Date();
                  setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                }}
              >
                Today
              </button>
            )}
          </>
        )}
      </div>

      {error ? (
        <p className={styles.errorNote}>{error}</p>
      ) : loading && meetings.length === 0 ? (
        <p className={styles.empty}>Loading meetings…</p>
      ) : view === 'list' ? (
        // Bounded pane: a busy week must not grow the hub past one screen.
        <div className={styles.listScroll}>
          <MeetingsList meetings={listMeetings} onOpen={setOpen} />
        </div>
      ) : (
        <CalendarGrid
          month={month}
          meetings={gridMeetings}
          onOpen={setOpen}
          onShowDay={(day, items) => setDayList({ day, items })}
        />
      )}

      {open && (
        <MeetingDialog
          meeting={open}
          organizations={data.organizations}
          contacts={data.contacts}
          onAssign={(organizationId) => assign(open, organizationId)}
          onClose={() => setOpen(null)}
        />
      )}
      {dayList && (
        <DayListDialog
          day={dayList.day}
          meetings={dayList.items}
          onOpen={(m) => {
            setDayList(null);
            setOpen(m);
          }}
          onClose={() => setDayList(null)}
        />
      )}
    </div>
  );
}
