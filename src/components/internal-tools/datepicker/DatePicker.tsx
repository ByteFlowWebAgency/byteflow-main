'use client';

// Branded date picker — a drop-in replacement for <input type="date">. Value and onChange
// both speak "YYYY-MM-DD". Full keyboard support inside the calendar: arrows move by
// day/week, PageUp/PageDown by month, Enter/Space select, Escape closes.

import { useCallback, useEffect, useRef, useState } from 'react';
import PopoverField from './PopoverField';
import styles from './picker.module.css';
import {
  MONTHS,
  WEEKDAYS,
  addDays,
  addMonths,
  formatLongDate,
  monthGrid,
  parseYmd,
  sameDay,
  toYmd,
} from './dateUtils';

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

// The popover contents. Mounted fresh each time the popover opens (PopoverField only
// renders children while open), so its state always starts from the current value and a
// mount effect can deterministically move focus into the grid.
function CalendarBody({
  value,
  onPick,
}: {
  value: string;
  onPick: (value: string) => void;
}) {
  const selected = parseYmd(value);
  const [active, setActive] = useState<Date>(() => selected ?? new Date());
  const gridRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  const focusCell = useCallback((date: Date) => {
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-date="${toYmd(date)}"]`)
      ?.focus({ preventScroll: true });
  }, []);

  // On open, move focus to the active day so keyboard users land in the grid.
  useEffect(() => {
    focusCell(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const move = (next: Date) => {
    setActive(next);
    requestAnimationFrame(() => focusCell(next));
  };

  const onGridKeyDown = (event: React.KeyboardEvent) => {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(active, -1),
      ArrowRight: () => addDays(active, 1),
      ArrowUp: () => addDays(active, -7),
      ArrowDown: () => addDays(active, 7),
      PageUp: () => addMonths(active, -1),
      PageDown: () => addMonths(active, 1),
    };
    const next = moves[event.key];
    if (next) {
      event.preventDefault();
      move(next());
    }
  };

  return (
    <>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.navButton}
          aria-label="Previous month"
          onClick={() => setActive(addMonths(active, -1))}
        >
          ‹
        </button>
        <span className={styles.headerLabel}>
          {MONTHS[active.getMonth()]} {active.getFullYear()}
        </span>
        <button
          type="button"
          className={styles.navButton}
          aria-label="Next month"
          onClick={() => setActive(addMonths(active, 1))}
        >
          ›
        </button>
      </div>

      <div className={styles.weekRow} aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day} className={styles.weekday}>
            {day}
          </span>
        ))}
      </div>

      <div ref={gridRef} className={styles.dayGrid} role="grid" onKeyDown={onGridKeyDown}>
        {monthGrid(active.getFullYear(), active.getMonth()).map((day) => {
          const outside = day.getMonth() !== active.getMonth();
          const isSelected = selected ? sameDay(day, selected) : false;
          const isActive = sameDay(day, active);
          const isToday = sameDay(day, today);
          return (
            <button
              key={toYmd(day)}
              type="button"
              data-date={toYmd(day)}
              role="gridcell"
              tabIndex={isActive ? 0 : -1}
              aria-selected={isSelected}
              aria-label={`${MONTHS[day.getMonth()]} ${day.getDate()}, ${day.getFullYear()}`}
              className={[
                styles.day,
                outside ? styles.dayOutside : '',
                isToday ? styles.dayToday : '',
                isSelected ? styles.daySelected : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onPick(toYmd(day))}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.footerButton}
          onClick={() => onPick(toYmd(new Date()))}
        >
          Today
        </button>
        <button
          type="button"
          className={styles.footerButton}
          onClick={() => onPick('')}
        >
          Clear
        </button>
      </div>
    </>
  );
}

export default function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Select a date',
  ariaLabel,
  disabled,
}: DatePickerProps) {
  return (
    <PopoverField
      id={id}
      ariaLabel={ariaLabel}
      placeholder={placeholder}
      displayValue={formatLongDate(value)}
      disabled={disabled}
      popoverLabel="Choose a date"
    >
      {({ close }) => (
        <CalendarBody
          value={value}
          onPick={(next) => {
            onChange(next);
            close();
          }}
        />
      )}
    </PopoverField>
  );
}
