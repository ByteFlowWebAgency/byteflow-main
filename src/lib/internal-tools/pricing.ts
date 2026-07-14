// Shared pricing model for the internal tools — three billing shapes (flat/retainer/
// hybrid) plus flat line items, and the totals math a pricing table renders from them.
// Originally lived under the (now-removed) proposal tool; Document Builder's
// pricingTable block is the sole consumer today.

export type PricingModel = 'flat' | 'retainer' | 'hybrid';

export interface LineItem {
  id: string;
  description: string;
  /** USD, whole dollars. */
  amount: number;
  /** True if this item repeats each billing cycle (retainer/hybrid models). */
  recurring: boolean;
}

export interface FlatPricing {
  model: 'flat';
  totalAmount: number;
  /** Free text, e.g. "50% upfront, 50% on completion". */
  paymentSchedule: string;
}

export interface RetainerPricing {
  model: 'retainer';
  monthlyAmount: number;
  termMonths: number;
  /** Free text — what's included per month. */
  includedScope: string;
}

export interface HybridPricing {
  model: 'hybrid';
  setupAmount: number;
  monthlyAmount: number;
  termMonths: number;
  includedScope: string;
}

export type Pricing = FlatPricing | RetainerPricing | HybridPricing;

// Display-ready totals for the current pricing model. Only the fields relevant to the
// model in use are set — the pricing table renders what's present.
export interface PricingTotals {
  model: Pricing['model'];
  /** Flat + hybrid: the one-time portion (base + non-recurring line items). */
  oneTimeTotal?: number;
  /** Retainer + hybrid: per-month investment (base monthly + recurring line items). */
  monthlyTotal?: number;
  /** Retainer + hybrid: contract length used for the contract total. */
  termMonths?: number;
  /** All models: total value of the engagement. */
  contractTotal: number;
  /** Non-recurring line items, summed (0 if none). */
  nonRecurringLineItems: number;
  /** Recurring line items, summed (0 if none). */
  recurringLineItems: number;
}

function sumLineItems(items: LineItem[], recurring: boolean): number {
  return items
    .filter((item) => item.recurring === recurring)
    .reduce((total, item) => total + (Number.isFinite(item.amount) ? item.amount : 0), 0);
}

/**
 * Compute the totals a pricing table displays, per the pricing model in use:
 * - flat: total investment = totalAmount + non-recurring line items
 * - retainer: monthly = monthlyAmount + recurring line items; contract = monthly × term
 * - hybrid: one-time = setupAmount + non-recurring items; monthly as retainer;
 *   contract = one-time + monthly × term
 */
export function calculateTotals(input: { pricing: Pricing; lineItems: LineItem[] }): PricingTotals {
  const { pricing, lineItems } = input;
  const nonRecurring = sumLineItems(lineItems, false);
  const recurring = sumLineItems(lineItems, true);

  switch (pricing.model) {
    case 'flat': {
      const oneTimeTotal = pricing.totalAmount + nonRecurring;
      return {
        model: 'flat',
        oneTimeTotal,
        contractTotal: oneTimeTotal,
        nonRecurringLineItems: nonRecurring,
        recurringLineItems: recurring,
      };
    }
    case 'retainer': {
      const monthlyTotal = pricing.monthlyAmount + recurring;
      return {
        model: 'retainer',
        monthlyTotal,
        termMonths: pricing.termMonths,
        contractTotal: monthlyTotal * pricing.termMonths,
        nonRecurringLineItems: nonRecurring,
        recurringLineItems: recurring,
      };
    }
    case 'hybrid': {
      const oneTimeTotal = pricing.setupAmount + nonRecurring;
      const monthlyTotal = pricing.monthlyAmount + recurring;
      return {
        model: 'hybrid',
        oneTimeTotal,
        monthlyTotal,
        termMonths: pricing.termMonths,
        contractTotal: oneTimeTotal + monthlyTotal * pricing.termMonths,
        nonRecurringLineItems: nonRecurring,
        recurringLineItems: recurring,
      };
    }
  }
}
