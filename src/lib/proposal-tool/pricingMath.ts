import type { LineItem, ProposalData } from './types';

// Display-ready totals for the current pricing model. Only the fields relevant to the
// model in use are set — the document's investment table renders what's present.
export interface ProposalTotals {
  model: ProposalData['pricing']['model'];
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
 * Compute the totals the document displays, per the pricing model in use:
 * - flat: total investment = totalAmount + non-recurring line items
 * - retainer: monthly = monthlyAmount + recurring line items; contract = monthly × term
 * - hybrid: one-time = setupAmount + non-recurring items; monthly as retainer;
 *   contract = one-time + monthly × term
 */
export function calculateTotals(proposal: ProposalData): ProposalTotals {
  const { pricing, lineItems } = proposal;
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
