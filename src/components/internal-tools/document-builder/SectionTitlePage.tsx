'use client';

import styles from './SectionTitlePage.module.css';
import type { Theme } from '../themes/themeTypes';
import type { SectionTitleFields } from '@/lib/document-builder/types';
import BackgroundLayer from '@/components/background-designs/BackgroundLayer';

interface SectionTitlePageProps {
  fields: SectionTitleFields;
  theme: Theme;
  /** Forces a PDF page break at this sheet's top (every page after the first). */
  breakBefore?: boolean;
}

/**
 * A standalone section-title page, usable anywhere in the document, as many times as
 * wanted. Reuses CoverPage's 816×1056 visual family (full-bleed vs restrained per
 * theme.coverPage.fullBleedBackground) but shows only eyebrow/title/subtitle. Marked
 * data-pdf-document (loses preview chrome in the PDF) and data-pdf-break-before so it
 * always starts — and, being exactly one page tall, occupies — its own page.
 */
export default function SectionTitlePage({ fields, theme, breakBefore }: SectionTitlePageProps) {
  const fullBleed = theme.coverPage.fullBleedBackground;
  return (
    <section
      className={`${styles.section} ${fullBleed ? styles.fullBleed : ''}`}
      data-pdf-document
      data-pdf-break-before={breakBefore ? '' : undefined}
      aria-label="Section title page"
    >
      <BackgroundLayer designId={fields.backgroundDesignId} theme={theme} width={816} height={1056} />
      <div className={styles.main}>
        {fields.eyebrow ? <p className={styles.eyebrow}>{fields.eyebrow}</p> : null}
        <h2 className={styles.title}>{fields.title}</h2>
        {fields.subtitle ? <p className={styles.subtitle}>{fields.subtitle}</p> : null}
        <div className={styles.rule} aria-hidden />
      </div>
    </section>
  );
}
