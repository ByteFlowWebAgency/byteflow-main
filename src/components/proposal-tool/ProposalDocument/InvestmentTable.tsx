'use client';

import styles from './ProposalDocument.module.css';
import { formatUsd, type ProposalTotals } from '@/lib/proposal-tool/pricingMath';
import type { LineItem, ProposalData } from '@/lib/proposal-tool/types';

function ItemRows({ items, perMonth }: { items: LineItem[]; perMonth: boolean }) {
  return (
    <>
      {items.map((item) => (
        <tr key={item.id}>
          <td>{item.description.trim() || '[Line item]'}</td>
          <td className={styles.amount}>
            {formatUsd(item.amount)}
            {perMonth && <span className={styles.perMonth}>/mo</span>}
          </td>
        </tr>
      ))}
    </>
  );
}

export default function InvestmentTable({
  proposal,
  totals,
}: {
  proposal: ProposalData;
  totals: ProposalTotals;
}) {
  const { pricing } = proposal;
  const oneTimeItems = proposal.lineItems.filter((i) => !i.recurring);
  const recurringItems = proposal.lineItems.filter((i) => i.recurring);

  return (
    <section className={styles.section} data-pdf-block>
      <h2 className={styles.sectionHeading}>Investment</h2>

      <table className={styles.investment}>
        <tbody>
          {pricing.model === 'flat' && (
            <>
              <tr>
                <td>Project fee</td>
                <td className={styles.amount}>{formatUsd(pricing.totalAmount)}</td>
              </tr>
              <ItemRows items={oneTimeItems} perMonth={false} />
              <tr className={styles.totalRow}>
                <td>Total investment</td>
                <td className={styles.amount}>{formatUsd(totals.contractTotal)}</td>
              </tr>
            </>
          )}

          {pricing.model === 'retainer' && (
            <>
              <tr>
                <td>Monthly retainer</td>
                <td className={styles.amount}>
                  {formatUsd(pricing.monthlyAmount)}
                  <span className={styles.perMonth}>/mo</span>
                </td>
              </tr>
              <ItemRows items={recurringItems} perMonth />
              <tr className={styles.subtotalRow}>
                <td>Monthly investment</td>
                <td className={styles.amount}>
                  {formatUsd(totals.monthlyTotal ?? 0)}
                  <span className={styles.perMonth}>/mo</span>
                </td>
              </tr>
              <tr>
                <td>Term</td>
                <td className={styles.amount}>
                  {pricing.termMonths} {pricing.termMonths === 1 ? 'month' : 'months'}
                </td>
              </tr>
              <tr className={styles.totalRow}>
                <td>Total contract value</td>
                <td className={styles.amount}>{formatUsd(totals.contractTotal)}</td>
              </tr>
            </>
          )}

          {pricing.model === 'hybrid' && (
            <>
              <tr className={styles.groupRow}>
                <td colSpan={2}>One-time</td>
              </tr>
              <tr>
                <td>Setup &amp; build</td>
                <td className={styles.amount}>{formatUsd(pricing.setupAmount)}</td>
              </tr>
              <ItemRows items={oneTimeItems} perMonth={false} />
              <tr className={styles.subtotalRow}>
                <td>One-time subtotal</td>
                <td className={styles.amount}>{formatUsd(totals.oneTimeTotal ?? 0)}</td>
              </tr>

              <tr className={styles.groupRow}>
                <td colSpan={2}>Ongoing</td>
              </tr>
              <tr>
                <td>Monthly retainer</td>
                <td className={styles.amount}>
                  {formatUsd(pricing.monthlyAmount)}
                  <span className={styles.perMonth}>/mo</span>
                </td>
              </tr>
              <ItemRows items={recurringItems} perMonth />
              <tr className={styles.subtotalRow}>
                <td>
                  Monthly investment × {pricing.termMonths}{' '}
                  {pricing.termMonths === 1 ? 'month' : 'months'}
                </td>
                <td className={styles.amount}>
                  {formatUsd(totals.monthlyTotal ?? 0)}
                  <span className={styles.perMonth}>/mo</span>
                </td>
              </tr>

              <tr className={styles.totalRow}>
                <td>Total contract value</td>
                <td className={styles.amount}>{formatUsd(totals.contractTotal)}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      {'paymentSchedule' in pricing && pricing.paymentSchedule.trim() && (
        <p className={styles.tableNote}>Payment schedule: {pricing.paymentSchedule}</p>
      )}
      {'includedScope' in pricing && pricing.includedScope.trim() && (
        <p className={styles.tableNote}>Included each month: {pricing.includedScope}</p>
      )}
    </section>
  );
}
