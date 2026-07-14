'use client';

// Branded month picker — drop-in for <input type="month">. Value/onChange speak
// "YYYY-MM". Popover shows a year with a 12-month grid, year navigation, and arrow-key
// support (←/→ by month, ↑/↓ by row, PageUp/Down by year).

import { useCallback, useEffect, useRef, useState } from 'react';
import PopoverField from './PopoverField';
import styles from './picker.module.css';
import { MONTHS, MONTHS_SHORT, parseYm, toYm } from './dateUtils';

interface MonthPickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

function MonthBody({
  value,
  onPick,
}: {
  value: string;
  onPick: (value: string) => void;
}) {
  const parsed = parseYm(value);
  const now = new Date();
  const [year, setYear] = useState<number>(parsed?.year ?? now.getFullYear());
  const [active, setActive] = useState<number>(parsed?.month0 ?? now.getMonth());
  const gridRef = useRef<HTMLDivElement>(null);

  const focusCell = useCallback((month0: number) => {
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-month="${month0}"]`)
      ?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    focusCell(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const move = (month0: number) => {
    setActive(month0);
    requestAnimationFrame(() => focusCell(month0));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const deltas: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -3,
      ArrowDown: 3,
    };
    if (event.key in deltas) {
      event.preventDefault();
      move(Math.max(0, Math.min(11, active + deltas[event.key])));
    } else if (event.key === 'PageUp') {
      event.preventDefault();
      setYear((y) => y - 1);
      requestAnimationFrame(() => focusCell(active));
    } else if (event.key === 'PageDown') {
      event.preventDefault();
      setYear((y) => y + 1);
      requestAnimationFrame(() => focusCell(active));
    }
  };

  return (
    <>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.navButton}
          aria-label="Previous year"
          onClick={() => setYear((y) => y - 1)}
        >
          ‹
        </button>
        <span className={styles.headerLabel}>{year}</span>
        <button
          type="button"
          className={styles.navButton}
          aria-label="Next year"
          onClick={() => setYear((y) => y + 1)}
        >
          ›
        </button>
      </div>

      <div className={styles.monthGrid} role="grid" onKeyDown={onKeyDown}>
        {MONTHS_SHORT.map((label, month0) => {
          const isSelected = parsed?.year === year && parsed?.month0 === month0;
          const isActive = month0 === active;
          return (
            <button
              key={label}
              type="button"
              data-month={month0}
              role="gridcell"
              tabIndex={isActive ? 0 : -1}
              aria-label={`${MONTHS[month0]} ${year}`}
              aria-selected={isSelected}
              className={`${styles.month} ${isSelected ? styles.monthSelected : ''}`}
              onClick={() => onPick(toYm(year, month0))}
            >
              {label}
            </button>
          );
        })}
      </div>
    </>
  );
}

export default function MonthPicker({
  id,
  value,
  onChange,
  placeholder = 'Select a month',
  ariaLabel,
  disabled,
}: MonthPickerProps) {
  const parsed = parseYm(value);
  const display = parsed ? `${MONTHS[parsed.month0]} ${parsed.year}` : '';

  return (
    <PopoverField
      id={id}
      ariaLabel={ariaLabel}
      placeholder={placeholder}
      displayValue={display}
      disabled={disabled}
      popoverLabel="Choose a month"
    >
      {({ close }) => (
        <MonthBody
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
