// Pricing total math for the pricingInvestment slide template. Implemented fresh — no
// dependency on lib/internal-tools/pricing.ts (the document-builder/proposal-era pricing
// module) — per docs/slides/01-CONTEXT-AND-SCOPE.md: Slides is a sibling tool, not a
// dependent, and docs/slides/02-SLIDE-DATA-MODEL.md asks for this implemented fresh.

import type { PricingLineItem } from './types';

/**
 * The investment total for a pricingInvestment slide: always the live sum of line items,
 * never a stored value that could drift. A slide's stored `total` field (if present) is
 * display-only/legacy-tolerant — this function is the single source of truth wherever a
 * total is shown (preview, PDF-equivalent, pptx export).
 */
export function computePricingTotal(lineItems: PricingLineItem[]): number {
  return lineItems.reduce(
    (sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0),
    0,
  );
}
