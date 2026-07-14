'use client';

import { forwardRef } from 'react';
import styles from './builder.module.css';
import BlockView from './BlockView';
import SectionTitlePage from './SectionTitlePage';
import ThemedDocument from '../themes/ThemedDocument';
import CoverPage from '../themes/CoverPage';
import type { Theme } from '../themes/themeTypes';
import type { BuiltDocument, DocumentPage } from '@/lib/document-builder/types';

interface BuiltDocumentViewProps {
  document: BuiltDocument;
  theme: Theme;
}

/**
 * Read-only renderer for a whole BuiltDocument: every page and block, themed and
 * print-ready. The forwarded ref lands on ThemedDocument (the PDF export node), so
 * generateDocumentPdf captures the entire stack. Each page after the first carries
 * data-pdf-break-before, so sectionTitle pages stay their own page and content pages start
 * on fresh printed pages while long content still overflows naturally.
 */
const BuiltDocumentView = forwardRef<HTMLDivElement, BuiltDocumentViewProps>(
  function BuiltDocumentView({ document: doc, theme }, ref) {
    return (
      <ThemedDocument ref={ref} theme={theme}>
        <div className={styles.stack}>
          {doc.pages.map((page, index) => (
            <PageView key={page.id} page={page} theme={theme} breakBefore={index > 0} />
          ))}
        </div>
      </ThemedDocument>
    );
  },
);

export default BuiltDocumentView;

function PageView({
  page,
  theme,
  breakBefore,
}: {
  page: DocumentPage;
  theme: Theme;
  breakBefore: boolean;
}) {
  if (page.kind === 'cover') {
    const f = page.coverFields ?? { title: '' };
    // CoverPage is document-type-agnostic; the doc's subtitle rides in its eyebrow slot.
    return (
      <CoverPage
        label={f.subtitle ?? ''}
        title={f.title}
        clientName={f.clientName ?? ''}
        date={f.date ?? ''}
        theme={theme}
        backgroundDesignId={f.backgroundDesignId}
      />
    );
  }

  if (page.kind === 'sectionTitle') {
    const f = page.sectionTitleFields ?? { title: '' };
    return <SectionTitlePage fields={f} theme={theme} breakBefore={breakBefore} />;
  }

  // content / closing — a paper sheet of blocks.
  return (
    <section
      className={styles.sheet}
      data-pdf-document
      data-pdf-break-before={breakBefore ? '' : undefined}
      aria-label={page.kind === 'closing' ? 'Closing page' : 'Content page'}
    >
      {page.blocks.length === 0 ? (
        <p className={styles.emptyPage}>Empty page</p>
      ) : (
        <div className={styles.blocks}>
          {page.blocks.map((block) => (
            <BlockView key={block.id} block={block} />
          ))}
        </div>
      )}
      {page.kind === 'closing' && (
        <footer className={styles.closingFooter}>
          <div className={styles.footerKeyline} aria-hidden />
          <div className={styles.footerRow}>
            <span>Let’s talk about next steps.</span>
            <span className={styles.footerBrand}>ByteFlow Solutions · Akron, Ohio</span>
          </div>
        </footer>
      )}
    </section>
  );
}
