'use client';

import styles from './ProposalForm.module.css';
import { parseAmount, type SectionProps } from './ProposalForm';
import { formatUsd, type ProposalTotals } from '@/lib/proposal-tool/pricingMath';

interface LineItemsSectionProps extends SectionProps {
  totals: ProposalTotals;
}

export default function LineItemsSection({
  proposal,
  dispatch,
  totals,
}: LineItemsSectionProps) {
  const showRecurring = proposal.pricing.model !== 'flat';

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Line items</h2>

      <div className={styles.rowList}>
        {proposal.lineItems.map((item, index) => (
          <div key={item.id} className={styles.itemRow}>
            <input
              className={`${styles.input} ${styles.itemGrow}`}
              type="text"
              value={item.description}
              placeholder={`Line item ${index + 1} description`}
              aria-label={`Line item ${index + 1} description`}
              onChange={(e) =>
                dispatch({
                  type: 'updateLineItem',
                  id: item.id,
                  patch: { description: e.target.value },
                })
              }
            />
            <input
              className={`${styles.input} ${styles.itemAmount}`}
              type="number"
              min={0}
              value={item.amount}
              aria-label={`Line item ${index + 1} amount in dollars`}
              onChange={(e) =>
                dispatch({
                  type: 'updateLineItem',
                  id: item.id,
                  patch: { amount: parseAmount(e.target.value) },
                })
              }
            />
            <label className={styles.itemCheck}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={item.recurring}
                onChange={(e) =>
                  dispatch({
                    type: 'updateLineItem',
                    id: item.id,
                    patch: { recurring: e.target.checked },
                  })
                }
              />
              /mo
            </label>
            <button
              type="button"
              className={styles.removeButton}
              aria-label={`Remove line item ${index + 1}`}
              onClick={() => dispatch({ type: 'removeLineItem', id: item.id })}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={styles.addButton}
        onClick={() => dispatch({ type: 'addLineItem', id: crypto.randomUUID() })}
      >
        + Add line item
      </button>

      {!showRecurring && proposal.lineItems.some((i) => i.recurring) && (
        <p className={styles.hint}>
          Recurring items are ignored under flat pricing — switch to retainer or hybrid to
          bill them monthly.
        </p>
      )}

      <div className={styles.runningTotal}>
        <span>
          {totals.model === 'flat' && 'Total investment'}
          {totals.model === 'retainer' && `Monthly ${formatUsd(totals.monthlyTotal ?? 0)} · contract total`}
          {totals.model === 'hybrid' &&
            `Setup ${formatUsd(totals.oneTimeTotal ?? 0)} + ${formatUsd(totals.monthlyTotal ?? 0)}/mo · contract total`}
        </span>
        <span className={styles.runningTotalValue}>{formatUsd(totals.contractTotal)}</span>
      </div>
    </section>
  );
}
