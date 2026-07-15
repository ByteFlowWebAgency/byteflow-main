'use client';

// Branded datetime picker — drop-in for <input type="datetime-local">. Value/onChange
// speak "YYYY-MM-DDTHH:mm". Composes the branded DatePicker (calendar popover) with the
// branded TimePicker (quarter-hour list popover). Choosing a date with no time yet
// defaults the time to now, so a logged activity always has a sensible timestamp.

import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import styles from './picker.module.css';
import { joinDateTime, nearestTimeSlot, splitDateTime } from './dateUtils';

interface DateTimePickerProps {
  dateId?: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  disabled?: boolean;
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
            onChange(nextDate ? joinDateTime(nextDate, time || nearestTimeSlot()) : '')
          }
        />
      </div>
      <div className={styles.dateTimeTime}>
        <TimePicker
          value={time}
          disabled={disabled}
          ariaLabel={ariaLabel ? `${ariaLabel} time` : 'Time'}
          onChange={(nextTime) => onChange(date ? joinDateTime(date, nextTime) : '')}
        />
      </div>
    </div>
  );
}
