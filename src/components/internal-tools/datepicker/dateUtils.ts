// Local-calendar date helpers for the branded pickers. Everything works in the browser's
// local timezone and (de)serializes to the same string shapes the native inputs used —
// so swapping the pickers in changes nothing about what gets stored.
//   date      → "YYYY-MM-DD"
//   month     → "YYYY-MM"
//   datetime  → "YYYY-MM-DDTHH:mm"

export const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Parse "YYYY-MM-DD" as a local date; null if malformed or not a real calendar date. */
export function parseYmd(value: string | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  const [y, mo, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) {
    return null;
  }
  return date;
}

export function toYmd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parse "YYYY-MM" into { year, month0 } (month0 = 0-based); null if malformed. */
export function parseYm(value: string | undefined): { year: number; month0: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year: Number(match[1]), month0: month - 1 };
}

export function toYm(year: number, month0: number): string {
  return `${year}-${pad(month0 + 1)}`;
}

/** Split "YYYY-MM-DDTHH:mm" (or a bare date) into its date and time halves. */
export function splitDateTime(value: string | undefined): { date: string; time: string } {
  if (!value) return { date: '', time: '' };
  const [date, time = ''] = value.split('T');
  return { date, time: time.slice(0, 5) };
}

export function joinDateTime(date: string, time: string): string {
  if (!date) return '';
  return `${date}T${time || '00:00'}`;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setDate(1); // avoid month-length overflow (e.g. Jan 31 + 1mo)
  next.setMonth(next.getMonth() + months);
  return next;
}

/**
 * The 42 dates (6 weeks) covering the given month, starting on the Sunday on or before
 * the 1st — the standard month-grid layout.
 */
export function monthGrid(year: number, month0: number): Date[] {
  const first = new Date(year, month0, 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** "July 1, 2026" for a date value; falls back to em dash for empty/invalid. */
export function formatLongDate(value: string | undefined): string {
  const date = parseYmd(value);
  if (!date) return '';
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export const TIME_STEP_MINUTES = 15;

/** Parse "HH:mm" into { hour, minute }; null if malformed or out of range. */
export function parseHm(value: string | undefined): { hour: number; minute: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function toHm(hour: number, minute: number): string {
  return `${pad(hour)}:${pad(minute)}`;
}

/** "HH:mm" (24h, on-the-quarter-hour) slots covering a full day, for the time picker list. */
export function timeSlots(): string[] {
  const count = (24 * 60) / TIME_STEP_MINUTES;
  return Array.from({ length: count }, (_, i) => {
    const minutes = i * TIME_STEP_MINUTES;
    return toHm(Math.floor(minutes / 60), minutes % 60);
  });
}

/** Nearest quarter-hour slot at or after now, e.g. for the picker's "Now" shortcut. */
export function nearestTimeSlot(date: Date = new Date()): string {
  const total = date.getHours() * 60 + Math.ceil(date.getMinutes() / TIME_STEP_MINUTES) * TIME_STEP_MINUTES;
  const clamped = Math.min(total, 24 * 60 - TIME_STEP_MINUTES);
  return toHm(Math.floor(clamped / 60), clamped % 60);
}

/** "2:30 PM" for a "HH:mm" value; '' for empty/invalid. */
export function formatTimeLabel(value: string | undefined): string {
  const parsed = parseHm(value);
  if (!parsed) return '';
  const period = parsed.hour < 12 ? 'AM' : 'PM';
  const hour12 = parsed.hour % 12 === 0 ? 12 : parsed.hour % 12;
  return `${hour12}:${pad(parsed.minute)} ${period}`;
}
