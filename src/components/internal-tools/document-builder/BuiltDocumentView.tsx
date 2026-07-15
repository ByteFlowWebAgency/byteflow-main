'use client';

import { forwardRef } from 'react';
import styles from './builder.module.css';
import BlockView from './BlockView';
import SectionTitlePage from './SectionTitlePage';
import ThemedDocument from '../themes/ThemedDocument';
import CoverPage from '../themes/CoverPage';
import BackgroundLayer from '@/components/background-designs/BackgroundLayer';
import { themeToCss } from '../themes/themeToCss';
import { resolveEffectiveTheme } from '../themes/themeStorage';
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
            <PageView key={page.id} page={page} docTheme={theme} breakBefore={index > 0} />
          ))}
        </div>
      </ThemedDocument>
    );
  },
);

export default BuiltDocumentView;

function PageView({
  page,
  docTheme,
  breakBefore,
}: {
  page: DocumentPage;
  docTheme: Theme;
  breakBefore: boolean;
}) {
  const { theme, isOverridden } = resolveEffectiveTheme(page.themeId, docTheme);

  let content: React.ReactNode;
  if (page.kind === 'cover') {
    const f = page.coverFields ?? { title: '' };
    // CoverPage is document-type-agnostic; the doc's subtitle rides in its eyebrow slot.
    content = (
      <CoverPage
        label={f.subtitle ?? ''}
        title={f.title}
        clientName={f.clientName ?? ''}
        date={f.date ?? ''}
        theme={theme}
        backgroundDesignId={page.backgroundDesignId}
      />
    );
  } else if (page.kind === 'sectionTitle') {
    const f = page.sectionTitleFields ?? { title: '' };
    content = (
      <SectionTitlePage fields={f} theme={theme} backgroundDesignId={page.backgroundDesignId} breakBefore={breakBefore} />
    );
  } else {
    // content / closing — a paper sheet of blocks.
    content = (
      <section
        className={styles.sheet}
        data-pdf-document
        data-pdf-break-before={breakBefore ? '' : undefined}
        aria-label={page.kind === 'closing' ? 'Closing page' : 'Content page'}
      >
        <BackgroundLayer designId={page.backgroundDesignId} theme={theme} width={816} height={1056} />
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

  // Only pages with their own themeId override need a nested CSS-var re-scope — every
  // other page just inherits the document-level vars ThemedDocument already set, exactly
  // as before this feature existed.
  if (!isOverridden) return content;
  return <div style={themeToCss(theme)}>{content}</div>;
}
