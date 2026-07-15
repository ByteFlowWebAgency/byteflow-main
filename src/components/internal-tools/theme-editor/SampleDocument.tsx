'use client';

import Image from 'next/image';
import styles from './SampleDocument.module.css';

/**
 * A small fixed fake document for the theme editor's live preview. Placeholder content
 * only (guardrail: nothing resembling real client data). It exercises every themed
 * surface the real documents use: paper bg/fg, muted tiers, hairlines, glass cards,
 * accent text, both gradients, display/body/mono type, and the logo asset.
 */
export default function SampleDocument() {
  return (
    <div className={styles.sheet}>
      <header className={styles.masthead}>
        <div className={styles.mastheadTop}>
          <Image
            src="/BYTEFLOW_LOGO.png"
            alt="ByteFlow Solutions"
            width={200}
            height={196}
            unoptimized
            className={styles.logo}
          />
          <div className={styles.mastheadMeta}>
            <p className={styles.docLabel}>Sample</p>
            <p className={styles.docDate}>[Date]</p>
          </div>
        </div>
        <h1 className={styles.docTitle}>[Sample document title]</h1>
        <div className={styles.keyline} aria-hidden />
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Section heading</h2>
        <p className={styles.body}>
          Body copy renders in the theme&rsquo;s body font and muted foreground.
          [Placeholder paragraph — every document reads exactly these theme surfaces.]
        </p>
      </section>

      <section className={styles.section}>
        <div className={styles.card}>
          <span className={styles.cardIndex}>01</span>
          <div>
            <p className={styles.cardTitle}>Card on the glass wash</p>
            <p className={styles.body}>[Hairline border, glass background, accent index]</p>
          </div>
        </div>
        <ul className={styles.bullets}>
          <li className={styles.bullet}>Accent-dash bullet item</li>
          <li className={styles.bullet}>[Second placeholder item]</li>
        </ul>
      </section>

      <section className={styles.section}>
        <table className={styles.table}>
          <tbody>
            <tr>
              <td>Line item placeholder</td>
              <td className={styles.amount}>$X,XXX</td>
            </tr>
            <tr className={styles.totalRow}>
              <td>Total</td>
              <td className={styles.amount}>$XX,XXX</td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer className={styles.footer}>
        <p className={styles.footerBrand}>BYTEFLOW Solutions</p>
        <p className={styles.footerLine}>[Footer meta line in soft foreground]</p>
      </footer>
    </div>
  );
}
