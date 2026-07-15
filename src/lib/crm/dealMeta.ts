// Pure deal-status helpers for the pipeline board and summary strip.

import type { Activity, Deal } from './types';

export const STALE_AFTER_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Open = still being worked: not won, not lost. */
export function isOpen(deal: Deal): boolean {
  return deal.stage !== 'won' && deal.stage !== 'lost';
}

/** Overdue: nextStepDue is a past calendar date on an open deal. */
export function isOverdue(deal: Deal, now: Date): boolean {
  if (!deal.nextStepDue || !isOpen(deal)) return false;
  const [y, m, d] = deal.nextStepDue.split('-').map(Number);
  if (!y || !m || !d) return false;
  const endOfDue = new Date(y, m - 1, d, 23, 59, 59, 999);
  return endOfDue.getTime() < now.getTime();
}

/**
 * Stale: an open deal untouched — no deal update and no logged activity — for
 * STALE_AFTER_DAYS. Stalled follow-ups are the pipeline's silent killer.
 */
export function isStale(deal: Deal, activities: Activity[], now: Date): boolean {
  if (!isOpen(deal)) return false;
  let lastTouch = Date.parse(deal.updatedAt);
  if (Number.isNaN(lastTouch)) lastTouch = 0;
  for (const activity of activities) {
    if (activity.dealId !== deal.id) continue;
    const at = Date.parse(activity.createdAt) || Date.parse(activity.at);
    if (at > lastTouch) lastTouch = at;
  }
  return now.getTime() - lastTouch > STALE_AFTER_DAYS * DAY_MS;
}

export interface PipelineSummary {
  openCount: number;
  openValue: number;
  overdueCount: number;
}

export function summarizePipeline(deals: Deal[], now: Date): PipelineSummary {
  const open = deals.filter(isOpen);
  return {
    openCount: open.length,
    openValue: open.reduce((sum, d) => sum + (d.estimatedValue ?? 0), 0),
    overdueCount: open.filter((d) => isOverdue(d, now)).length,
  };
}
