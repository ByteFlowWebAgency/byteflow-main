// Budget computations (04-BUDGET-TRACKER.md): fixed, known formulas in typed code —
// sums, differences, percentages. Deliberately NOT a formula engine. Variance follows
// the expense-budget convention: planned − actual, so under budget is positive.

import { toCsv } from '@/lib/internal-tools/csv';
import type { Budget, BudgetItem } from './types';

export interface BudgetTotals {
  planned: number;
  actual: number;
  /** planned − actual: positive = under budget, negative = over. */
  variance: number;
  /** actual / planned as a 0–100+ percentage; null when nothing is planned. */
  percentSpent: number | null;
}

export function totalsOf(items: BudgetItem[]): BudgetTotals {
  const planned = items.reduce((sum, i) => sum + (Number.isFinite(i.planned) ? i.planned : 0), 0);
  const actual = items.reduce((sum, i) => sum + (Number.isFinite(i.actual) ? i.actual : 0), 0);
  return {
    planned,
    actual,
    variance: planned - actual,
    percentSpent: planned > 0 ? (actual / planned) * 100 : null,
  };
}

export interface CategoryGroup {
  category: string;
  items: BudgetItem[];
  totals: BudgetTotals;
}

/** Cluster items under category headers, categories ordered by first appearance. */
export function groupByCategory(items: BudgetItem[]): CategoryGroup[] {
  const groups = new Map<string, BudgetItem[]>();
  for (const item of items) {
    const key = item.category.trim() || 'Uncategorized';
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  return [...groups.entries()].map(([category, groupItems]) => ({
    category,
    items: groupItems,
    totals: totalsOf(groupItems),
  }));
}

/** Distinct categories already used in this budget, for the input autocomplete. */
export function categoriesOf(budget: Budget): string[] {
  return [...new Set(budget.items.map((i) => i.category.trim()).filter(Boolean))];
}

/** "2026-07" → "2026-08"; year boundary "2026-12" → "2027-01". Null for bad input. */
export function nextPeriodKey(period: string): string | null {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  return `${next.y}-${String(next.m).padStart(2, '0')}`;
}

/** The previous month key, for the month-over-month comparison. */
export function previousPeriodKey(period: string): string | null {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  return `${prev.y}-${String(prev.m).padStart(2, '0')}`;
}

/**
 * Duplicate for the "next month" workflow: items copied with fresh ids, `actual`
 * reset to 0 (planned carries over — that's the point), caller supplies name/period.
 */
export function duplicateBudget(
  source: Budget,
  overrides: { name: string; period?: string },
): Budget {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: overrides.name,
    kind: source.kind,
    period: overrides.period,
    items: source.items.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      actual: 0,
    })),
    createdAt: now,
    updatedAt: now,
  };
}

/** CSV export per budget: rows + a totals row (04-BUDGET-TRACKER.md). */
export function budgetCsv(budget: Budget): string {
  const totals = totalsOf(budget.items);
  const rows = budget.items.map((item) => [
    item.category,
    item.description,
    item.planned,
    item.actual,
    item.planned - item.actual,
    item.notes,
  ]);
  rows.push(['Total', '', totals.planned, totals.actual, totals.variance, '']);
  return toCsv(
    ['Category', 'Description', 'Planned (USD)', 'Actual (USD)', 'Variance (USD)', 'Notes'],
    rows,
  );
}
