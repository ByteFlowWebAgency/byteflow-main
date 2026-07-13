'use client';

import Image from 'next/image';
import styles from './ProposalDocument.module.css';
import type { ProposalData } from '@/lib/proposal-tool/types';

export function formatDate(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DocumentHeader({ proposal }: { proposal: ProposalData }) {
  const clientName = proposal.client.clientName.trim() || '[Client name]';
  const contactName = proposal.client.contactName.trim();

  return (
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
          <p className={styles.docLabel}>Proposal</p>
          <p className={styles.docDate}>{formatDate(proposal.createdAt)}</p>
        </div>
      </div>

      <h1 className={styles.docTitle}>
        {proposal.projectTitle.trim() || '[Project title]'}
      </h1>

      <div className={styles.byline}>
        <div>
          <p className={styles.bylineLabel}>Prepared for</p>
          <p className={styles.bylineValue}>{clientName}</p>
          {contactName && <p className={styles.bylineSub}>{contactName}</p>}
        </div>
        <div>
          <p className={styles.bylineLabel}>Prepared by</p>
          <p className={styles.bylineValue}>ByteFlow Solutions</p>
          <p className={styles.bylineSub}>Akron, Ohio</p>
        </div>
      </div>

      {/* Signature element: the gradient keyline (see DESIGN-TOKENS.md) */}
      <div className={styles.keyline} aria-hidden />
    </header>
  );
}
