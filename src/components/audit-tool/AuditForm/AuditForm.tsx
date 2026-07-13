'use client';

import type { Dispatch } from 'react';
import styles from './AuditForm.module.css';
import SiteClientSection from './SiteClientSection';
import SummarySection from './SummarySection';
import FindingsSection from './FindingsSection';
import TopRecommendationsSection from './TopRecommendationsSection';
import type { AuditAction } from '../AuditToolApp';
import type { AuditData } from '@/lib/audit-tool/types';

export interface AuditSectionProps {
  audit: AuditData;
  dispatch: Dispatch<AuditAction>;
}

export default function AuditForm({ audit, dispatch }: AuditSectionProps) {
  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <SiteClientSection audit={audit} dispatch={dispatch} />
      <SummarySection audit={audit} dispatch={dispatch} />
      <FindingsSection audit={audit} dispatch={dispatch} />
      <TopRecommendationsSection audit={audit} dispatch={dispatch} />
    </form>
  );
}
