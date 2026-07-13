'use client';

// Branded datetime picker — drop-in for <input type="datetime-local">. Value/onChange
// speak "YYYY-MM-DDTHH:mm". Composes the branded DatePicker (calendar popover) with a
// native time field (small, and fine once color-scheme is dark). Choosing a date with no
// time yet defaults the time to now, so a logged activity always has a sensible timestamp.

import DatePicker from './DatePicker';
import styles from './picker.module.css';
import { joinDateTime, splitDateTime } from './dateUtils';

interface DateTimePickerProps {
  dateId?: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  disabled?: boolean;
}

function nowTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function DateTimePicker({
  dateId,
  value,
  onChange,
  ariaLabel,
  disabled,
}: DateTimePickerProps) {
  const { date, time } = splitDateTime(value);

  return (
    <div className={styles.dateTimeRow}>
      <div className={styles.dateTimeDate}>
        <DatePicker
          id={dateId}
          value={date}
          ariaLabel={ariaLabel}
          disabled={disabled}
          onChange={(nextDate) =>
            onChange(nextDate ? joinDateTime(nextDate, time || nowTime()) : '')
          }
        />
      </div>
      <input
        type="time"
        className={styles.timeInput}
        value={time}
        disabled={disabled}
        aria-label={ariaLabel ? `${ariaLabel} time` : 'Time'}
        onChange={(event) =>
          onChange(date ? joinDateTime(date, event.target.value) : '')
        }
      />
    </div>
  );
}
