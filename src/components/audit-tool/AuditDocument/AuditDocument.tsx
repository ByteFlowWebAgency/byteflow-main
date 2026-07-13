'use client';

import { forwardRef } from 'react';
import Image from 'next/image';
import styles from './AuditDocument.module.css';
import FindingsByCategory from './FindingsByCategory';
import { formatDisplayDate } from '@/lib/internal-tools/format';
import type { AuditData } from '@/lib/audit-tool/types';

/**
 * The client-ready audit report — single visual source of truth for the on-screen
 * preview and the exported PDF (which captures this exact DOM). Renders placeholders on
 * empty state; never crashes. data-pdf-block / data-pdf-keep-next drive pagination.
 */
const AuditDocument = forwardRef<HTMLDivElement, { audit: AuditData }>(
  function AuditDocument({ audit }, ref) {
    const siteUrl = audit.siteUrl.trim() || '[site-url.com]';
    const clientName = audit.client.clientName.trim() || '[Client name]';
    const recommendations = audit.topRecommendations
      .map((r) => r.trim())
      .filter(Boolean);

    return (
      <div ref={ref} className={styles.document}>
        <header className={styles.masthead} data-pdf-block>
          <div className={styles.mastheadTop}>
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
            <div className={styles.mastheadMeta}>
              <p className={styles.docLabel}>Site Audit Report</p>
              <p className={styles.docDate}>{formatDisplayDate(audit.auditDate)}</p>
            </div>
          </div>

          <h1 className={styles.docTitle}>{siteUrl}</h1>

          <div className={styles.byline}>
            <div>
              <p className={styles.bylineLabel}>Prepared for</p>
              <p className={styles.bylineValue}>{clientName}</p>
              {audit.client.contactName.trim() && (
                <p className={styles.bylineSub}>{audit.client.contactName}</p>
              )}
            </div>
            <div>
              <p className={styles.bylineLabel}>Audited by</p>
              <p className={styles.bylineValue}>
                {audit.auditedBy.trim() || 'ByteFlow Solutions'}
              </p>
              <p className={styles.bylineSub}>Akron, Ohio</p>
            </div>
          </div>

          {/* Signature element: the gradient keyline (shared with the proposal document) */}
          <div className={styles.keyline} aria-hidden />
        </header>

        <section className={styles.section} data-pdf-block>
          <h2 className={styles.sectionHeading}>Summary</h2>
          <p className={styles.body}>{audit.summary.trim() || '[Summary]'}</p>
        </section>

        {recommendations.length > 0 && (
          <section className={styles.section} data-pdf-block>
            <div className={styles.recsCallout}>
              <h2 className={styles.recsHeading}>Where to start</h2>
              <ol className={styles.recsList}>
                {recommendations.map((rec, index) => (
                  <li key={index} className={styles.recsItem}>
                    {rec}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        <FindingsByCategory findings={audit.findings} />

        <footer className={styles.docFooter} data-pdf-block>
          <p className={styles.nextStep}>
            Questions about anything in this report? We&rsquo;re glad to walk through the
            findings and what fixing them would involve.
          </p>
          <p className={styles.footerBrand}>BYTEFLOW Solutions</p>
          <p className={styles.footerLine}>
            Software engineering for teams that take shipping seriously.
          </p>
          <p className={styles.footerLine}>
            byteflow.us · support@byteflowsolutions.com · Akron, Ohio
          </p>
        </footer>
      </div>
    );
  },
);

export default AuditDocument;
