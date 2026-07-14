'use client';

import styles from './builder.module.css';
import { calculateTotals } from '@/lib/internal-tools/pricing';
import { formatUsd } from '@/lib/internal-tools/format';
import type { Block, PricingTableBlock } from '@/lib/document-builder/types';
import type { LineItem } from '@/lib/internal-tools/pricing';

// richText/callout HTML is sanitized to the whitelist at every input boundary — on write,
// on paste, on import, and on storage load (see sanitize.ts / storage.validateDocument) —
// so it is trusted here. Re-sanitizing at render would also diverge across SSR (no DOM) and
// the client, breaking hydration; the input-boundary invariant is the single guarantee.

/** One rendered block. Read-only; the editor overlays its own controls separately. */
export default function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading': {
      const Tag = (`h${block.level}` as unknown) as 'h1';
      const cls = block.level === 1 ? styles.h1 : block.level === 3 ? styles.h3 : styles.h2;
      return (
        <Tag className={cls} data-pdf-keep-next>
          {block.text}
        </Tag>
      );
    }
    case 'titleBanner':
      return (
        <div className={styles.banner} data-pdf-block data-pdf-keep-next>
          {block.eyebrow ? <p className={styles.bannerEyebrow}>{block.eyebrow}</p> : null}
          <p className={styles.bannerTitle}>{block.title}</p>
          {block.subtitle ? <p className={styles.bannerSubtitle}>{block.subtitle}</p> : null}
          <div className={styles.bannerRule} aria-hidden />
        </div>
      );
    case 'richText':
      return (
        <div
          className={styles.prose}
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );
    case 'callout':
      return (
        <div
          className={styles.callout}
          data-pdf-block
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );
    case 'image': {
      const figCls = `${styles.figure} ${block.width === 'half' ? styles.figureHalf : ''}`;
      return (
        <figure className={figCls} data-pdf-block>
          {block.dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data: URL, PDF capture needs raw <img>
            <img className={styles.image} src={block.dataUrl} alt={block.alt || block.caption || ''} />
          ) : (
            <div className={styles.imagePlaceholder}>No image selected</div>
          )}
          {block.caption ? <figcaption className={styles.caption}>{block.caption}</figcaption> : null}
        </figure>
      );
    }
    case 'table':
      return (
        <table className={styles.table}>
          <thead>
            <tr data-pdf-keep-next>
              {block.header.map((cell, i) => (
                <th key={i}>{cell}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r} data-pdf-block>
                {row.map((cell, c) => (
                  <td key={c}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'divider':
      return <hr className={styles.divider} data-pdf-block />;
    case 'spacer': {
      const cls =
        block.size === 'small'
          ? styles.spacerSmall
          : block.size === 'large'
            ? styles.spacerLarge
            : styles.spacerMedium;
      return <div className={cls} aria-hidden />;
    }
    case 'keyValueList':
      return (
        <div className={styles.kvList} data-pdf-block>
          {block.items.map((it) => (
            <div key={it.id} style={{ display: 'contents' }}>
              <span className={styles.kvLabel}>{it.label}</span>
              <span className={styles.kvValue}>{it.value}</span>
            </div>
          ))}
        </div>
      );
    case 'pricingTable':
      return <PricingTable block={block} />;
    case 'pageBreak':
      return (
        <div
          className={styles.divider}
          data-pdf-break-before=""
          aria-label="Page break"
          style={{ borderTopStyle: 'dashed' }}
        />
      );
    default: {
      const never: never = block;
      return <>{String(never)}</>;
    }
  }
}

/** Amount cell, with a "/mo" suffix for recurring values. */
function Amount({ value, perMonth }: { value: number; perMonth?: boolean }) {
  return (
    <td className={styles.amount}>
      {formatUsd(value)}
      {perMonth ? <span className={styles.perMonth}> /mo</span> : null}
    </td>
  );
}

/**
 * Block-based pricing table. Computes every figure through the shared calculateTotals
 * implementation (no duplicated math).
 */
function PricingTable({ block }: { block: PricingTableBlock }) {
  const { pricing, lineItems } = block;
  const totals = calculateTotals({ pricing, lineItems });
  const oneTime = lineItems.filter((i: LineItem) => !i.recurring);
  const recurring = lineItems.filter((i: LineItem) => i.recurring);

  const itemRows = (items: LineItem[], perMonth: boolean) =>
    items.map((it) => (
      <tr key={it.id} data-pdf-block>
        <td>{it.description || '—'}</td>
        <Amount value={it.amount} perMonth={perMonth} />
      </tr>
    ));

  return (
    <table className={styles.investment} data-pdf-block>
      <tbody>
        {pricing.model === 'flat' && (
          <>
            <tr data-pdf-block>
              <td>Project fee</td>
              <Amount value={pricing.totalAmount} />
            </tr>
            {itemRows(oneTime, false)}
            <tr className={styles.totalRow} data-pdf-block>
              <td>Total investment</td>
              <Amount value={totals.contractTotal} />
            </tr>
          </>
        )}

        {pricing.model === 'retainer' && (
          <>
            <tr data-pdf-block>
              <td>Monthly retainer</td>
              <Amount value={pricing.monthlyAmount} perMonth />
            </tr>
            {itemRows(recurring, true)}
            <tr className={styles.subtotalRow} data-pdf-block>
              <td>Monthly investment</td>
              <Amount value={totals.monthlyTotal ?? 0} perMonth />
            </tr>
            <tr data-pdf-block>
              <td>Term</td>
              <td className={styles.amount}>{pricing.termMonths} months</td>
            </tr>
            <tr className={styles.totalRow} data-pdf-block>
              <td>Total contract value</td>
              <Amount value={totals.contractTotal} />
            </tr>
          </>
        )}

        {pricing.model === 'hybrid' && (
          <>
            <tr className={styles.groupRow} data-pdf-keep-next>
              <td colSpan={2}>One-time</td>
            </tr>
            <tr data-pdf-block>
              <td>Setup &amp; build</td>
              <Amount value={pricing.setupAmount} />
            </tr>
            {itemRows(oneTime, false)}
            <tr className={styles.subtotalRow} data-pdf-block>
              <td>One-time subtotal</td>
              <Amount value={totals.oneTimeTotal ?? 0} />
            </tr>
            <tr className={styles.groupRow} data-pdf-keep-next>
              <td colSpan={2}>Ongoing</td>
            </tr>
            <tr data-pdf-block>
              <td>Monthly retainer</td>
              <Amount value={pricing.monthlyAmount} perMonth />
            </tr>
            {itemRows(recurring, true)}
            <tr className={styles.subtotalRow} data-pdf-block>
              <td>Monthly investment × {pricing.termMonths} months</td>
              <Amount value={totals.monthlyTotal ?? 0} perMonth />
            </tr>
            <tr className={styles.totalRow} data-pdf-block>
              <td>Total contract value</td>
              <Amount value={totals.contractTotal} />
            </tr>
          </>
        )}
      </tbody>
    </table>
  );
}
