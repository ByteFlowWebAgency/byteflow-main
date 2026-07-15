'use client';

// Branded time picker — a drop-in replacement for <input type="time">. Value/onChange
// speak "HH:mm" (24h). Popover shows a scrollable list of quarter-hour slots; arrow keys
// move by slot, Page Up/Down jump by an hour, Enter/Space select, Escape closes.

import { useCallback, useEffect, useRef, useState } from 'react';
import PopoverField from './PopoverField';
import styles from './picker.module.css';
import { formatTimeLabel, nearestTimeSlot, timeSlots } from './dateUtils';

interface TimePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

const SLOTS = timeSlots();

function TimeBody({
  value,
  onPick,
}: {
  value: string;
  onPick: (value: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string>(() =>
    SLOTS.includes(value) ? value : nearestTimeSlot(),
  );

  const focusSlot = useCallback((slot: string) => {
    listRef.current
      ?.querySelector<HTMLButtonElement>(`[data-slot="${slot}"]`)
      ?.focus({ preventScroll: false });
  }, []);

  // On open, move focus to the active slot (scrolled into view by the browser's own
  // focus handling, same as DatePicker/MonthPicker's mount-focus).
  useEffect(() => {
    focusSlot(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const move = (slot: string) => {
    setActive(slot);
    requestAnimationFrame(() => focusSlot(slot));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const index = SLOTS.indexOf(active);
    const deltas: Record<string, number> = {
      ArrowUp: -1,
      ArrowDown: 1,
      PageUp: -4,
      PageDown: 4,
    };
    if (event.key in deltas) {
      event.preventDefault();
      const next = Math.max(0, Math.min(SLOTS.length - 1, index + deltas[event.key]));
      move(SLOTS[next]);
    }
  };

  return (
    <>
      <div ref={listRef} className={styles.timeList} role="listbox" aria-label="Time" onKeyDown={onKeyDown}>
        {SLOTS.map((slot) => {
          const isSelected = slot === value;
          const isActive = slot === active;
          return (
            <button
              key={slot}
              type="button"
              data-slot={slot}
              role="option"
              tabIndex={isActive ? 0 : -1}
              aria-selected={isSelected}
              className={`${styles.timeSlot} ${isSelected ? styles.timeSlotSelected : ''}`}
              onClick={() => onPick(slot)}
            >
              {formatTimeLabel(slot)}
            </button>
          );
        })}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.footerButton} onClick={() => onPick(nearestTimeSlot())}>
          Now
        </button>
        <button type="button" className={styles.footerButton} onClick={() => onPick('')}>
          Clear
        </button>
      </div>
    </>
  );
}

export default function TimePicker({
  id,
  value,
  onChange,
  placeholder = 'Select a time',
  ariaLabel,
  disabled,
}: TimePickerProps) {
  return (
    <PopoverField
      id={id}
      ariaLabel={ariaLabel}
      placeholder={placeholder}
      displayValue={formatTimeLabel(value)}
      disabled={disabled}
      popoverLabel="Choose a time"
      icon="clock"
    >
      {({ close }) => (
        <TimeBody
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
