'use client';

import Image from 'next/image';
import styles from './CoverPage.module.css';
import type { Theme } from './themeTypes';
import { formatDisplayDate } from '@/lib/internal-tools/format';
import BackgroundLayer from '@/components/background-designs/BackgroundLayer';

interface CoverPageProps {
  /** Document-type eyebrow, e.g. "Proposal" or "Site Audit Report". */
  label: string;
  title: string;
  clientName: string;
  /** ISO date string (full timestamp or YYYY-MM-DD). */
  date: string;
  theme: Theme;
  /** A background-designs registry id, or undefined for today's plain treatment —
   * independent of theme. */
  backgroundDesignId?: string;
}

/**
 * The shared cover sheet — document-type-agnostic (it knows titles and dates, never
 * ProposalData/AuditData). Rendered inside ThemedDocument ahead of the document sheet.
 *
 * Pagination contract: the sheet is exactly one US Letter page (816×1056 CSS px,
 * border-box), so the PDF engine's first natural cut falls precisely on its bottom
 * edge — the cover always occupies page 1 alone, with a firm break after it. The
 * preview-only gap below it is a margin the engine strips (data-pdf-document).
 *
 * theme.coverPage.fullBleedBackground picks the treatment: full-page theme background
 * with soft brand washes when true; restrained neutral paper when false. The logo is
 * the real asset either way — on dark backgrounds the themedOverrides white-knockout
 * rule keeps it legible (baked into PDF pixels by the export engine).
 */
export default function CoverPage({ label, title, clientName, date, theme, backgroundDesignId }: CoverPageProps) {
  const fullBleed = theme.coverPage.fullBleedBackground;
  return (
    <section
      className={`${styles.cover} ${fullBleed ? styles.fullBleed : ''}`}
      data-pdf-document
      aria-label="Cover page"
    >
      <BackgroundLayer designId={backgroundDesignId} theme={theme} width={816} height={1056} />
      <header className={styles.top}>
        {/* unoptimized: the PDF capture needs the raw same-origin asset URL */}
        <Image
          src="/BYTEFLOW_LOGO.png"
          alt="ByteFlow Solutions"
          width={200}
          height={196}
          unoptimized
          className={styles.logo}
          priority
        />
      </header>

      <div className={styles.main}>
        <p className={styles.label}>{label}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.client}>
          Prepared for <span className={styles.clientName}>{clientName}</span>
        </p>
      </div>

      <footer className={styles.footer}>
        <div className={styles.keyline} aria-hidden />
        <div className={styles.footerRow}>
          <p className={styles.date}>{formatDisplayDate(date)}</p>
          <p className={styles.brand}>ByteFlow Solutions · Akron, Ohio</p>
        </div>
      </footer>
    </section>
  );
}
