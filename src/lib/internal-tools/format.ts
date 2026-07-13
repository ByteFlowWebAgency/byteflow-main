/**
 * Format a dollar amount as USD with thousands separators and no cents unless the value
 * is non-whole: $4,500 — not $4,500.00 — but $4,500.50 when cents matter. The one
 * currency formatter for every internal tool (proposals, CRM, budgets).
 */
export function formatUsd(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const hasCents = Math.round(safe * 100) % 100 !== 0;
  return safe.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
}

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
