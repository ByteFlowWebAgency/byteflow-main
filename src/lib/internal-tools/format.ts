/**
 * Human date for the branded documents, e.g. "July 13, 2026". Accepts a full ISO
 * timestamp or a bare YYYY-MM-DD (date inputs) — bare dates are parsed as local calendar
 * dates, not UTC, so they never display off-by-one in US timezones. Em dash for
 * empty/invalid input (documents render placeholders, never crash).
 */
export function formatDisplayDate(iso: string): string {
  if (!iso) return '—';
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
