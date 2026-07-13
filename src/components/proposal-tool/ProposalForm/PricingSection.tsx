'use client';

import styles from './ProposalForm.module.css';
import { parseAmount, type SectionProps } from './ProposalForm';
import type { PricingModel } from '@/lib/proposal-tool/types';

const MODELS: { value: PricingModel; label: string }[] = [
  { value: 'flat', label: 'Flat fee' },
  { value: 'retainer', label: 'Monthly retainer' },
  { value: 'hybrid', label: 'Hybrid' },
];

export default function PricingSection({ proposal, dispatch }: SectionProps) {
  const { pricing } = proposal;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Pricing model</h2>

      <div className={styles.segmented} role="radiogroup" aria-label="Pricing model">
        {MODELS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={pricing.model === value}
            className={`${styles.segment} ${pricing.model === value ? styles.segmentActive : ''}`}
            onClick={() => dispatch({ type: 'setPricingModel', model: value })}
          >
            {label}
          </button>
        ))}
      </div>

      {pricing.model === 'flat' && (
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label htmlFor="pt-flat-total" className={styles.label}>
              Total amount (USD)
            </label>
            <input
              id="pt-flat-total"
              className={styles.input}
              type="number"
              min={0}
              value={pricing.totalAmount}
              onChange={(e) =>
                dispatch({ type: 'setPricing', patch: { totalAmount: parseAmount(e.target.value) } })
              }
            />
          </div>
          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="pt-flat-schedule" className={styles.label}>
              Payment schedule
            </label>
            <input
              id="pt-flat-schedule"
              className={styles.input}
              type="text"
              value={pricing.paymentSchedule}
              placeholder="e.g. 50% upfront, 50% on completion"
              onChange={(e) =>
                dispatch({ type: 'setPricing', patch: { paymentSchedule: e.target.value } })
              }
            />
          </div>
        </div>
      )}

      {(pricing.model === 'retainer' || pricing.model === 'hybrid') && (
        <div className={styles.fieldGrid}>
          {pricing.model === 'hybrid' && (
            <div className={styles.field}>
              <label htmlFor="pt-setup" className={styles.label}>
                One-time setup (USD)
              </label>
              <input
                id="pt-setup"
                className={styles.input}
                type="number"
                min={0}
                value={pricing.setupAmount}
                onChange={(e) =>
                  dispatch({ type: 'setPricing', patch: { setupAmount: parseAmount(e.target.value) } })
                }
              />
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="pt-monthly" className={styles.label}>
              Monthly amount (USD)
            </label>
            <input
              id="pt-monthly"
              className={styles.input}
              type="number"
              min={0}
              value={pricing.monthlyAmount}
              onChange={(e) =>
                dispatch({ type: 'setPricing', patch: { monthlyAmount: parseAmount(e.target.value) } })
              }
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="pt-term" className={styles.label}>
              Term (months)
            </label>
            <input
              id="pt-term"
              className={styles.input}
              type="number"
              min={0}
              step={1}
              value={pricing.termMonths}
              onChange={(e) =>
                dispatch({
                  type: 'setPricing',
                  patch: { termMonths: Math.round(parseAmount(e.target.value)) },
                })
              }
            />
          </div>

          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="pt-scope" className={styles.label}>
              Included each month
            </label>
            <textarea
              id="pt-scope"
              className={styles.textarea}
              value={pricing.includedScope}
              placeholder="What the monthly retainer covers…"
              onChange={(e) =>
                dispatch({ type: 'setPricing', patch: { includedScope: e.target.value } })
              }
            />
          </div>
        </div>
      )}
    </section>
  );
}
