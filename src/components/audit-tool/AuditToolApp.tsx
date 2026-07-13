'use client';

import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import '@/components/internal-tools/tokens.css';
import HomeLink from '@/components/internal-tools/HomeLink';
import styles from './AuditToolApp.module.css';
import AuditForm from './AuditForm/AuditForm';
import AuditDocument from './AuditDocument/AuditDocument';
import {
  generateDocumentPdf,
  sanitizeFilePart,
} from '@/components/internal-tools/pdf/generateDocumentPdf';
import { createDefaultAudit } from '@/lib/audit-tool/defaults';
import { validateAudit } from '@/lib/audit-tool/validate';
import type {
  AuditCategory,
  AuditData,
  AuditFinding,
} from '@/lib/audit-tool/types';
import type { ClientContact } from '@/lib/internal-tools/clientInfo';

export type AuditAction =
  | { type: 'init'; id: string; createdAt: string; auditDate: string }
  | {
      type: 'set';
      patch: Partial<Pick<AuditData, 'siteUrl' | 'auditDate' | 'auditedBy' | 'summary'>>;
    }
  | { type: 'setClient'; patch: Partial<ClientContact> }
  | { type: 'addFinding'; id: string; category: AuditCategory }
  | { type: 'updateFinding'; id: string; patch: Partial<Omit<AuditFinding, 'id'>> }
  | { type: 'removeFinding'; id: string }
  | { type: 'addRecommendation' }
  | { type: 'updateRecommendation'; index: number; value: string }
  | { type: 'removeRecommendation'; index: number };

function reducer(audit: AuditData, action: AuditAction): AuditData {
  switch (action.type) {
    case 'init':
      return {
        ...audit,
        id: action.id,
        createdAt: action.createdAt,
        auditDate: action.auditDate,
      };
    case 'set':
      return { ...audit, ...action.patch };
    case 'setClient':
      return { ...audit, client: { ...audit.client, ...action.patch } };
    case 'addFinding':
      return {
        ...audit,
        findings: [
          ...audit.findings,
          {
            id: action.id,
            category: action.category,
            severity: 'medium',
            title: '',
            description: '',
            recommendation: '',
          },
        ],
      };
    case 'updateFinding':
      return {
        ...audit,
        findings: audit.findings.map((finding) =>
          finding.id === action.id ? { ...finding, ...action.patch } : finding,
        ),
      };
    case 'removeFinding':
      return {
        ...audit,
        findings: audit.findings.filter((finding) => finding.id !== action.id),
      };
    case 'addRecommendation':
      return { ...audit, topRecommendations: [...audit.topRecommendations, ''] };
    case 'updateRecommendation':
      return {
        ...audit,
        topRecommendations: audit.topRecommendations.map((r, i) =>
          i === action.index ? action.value : r,
        ),
      };
    case 'removeRecommendation':
      return {
        ...audit,
        topRecommendations: audit.topRecommendations.filter((_, i) => i !== action.index),
      };
  }
}

export default function AuditToolApp() {
  const [audit, dispatch] = useReducer(reducer, undefined, createDefaultAudit);
  const documentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // id/createdAt/auditDate are assigned post-mount; createDefaultAudit must stay
  // deterministic for SSR/hydration. Audit date defaults to today, editable.
  useEffect(() => {
    if (!audit.id) {
      const now = new Date();
      dispatch({
        type: 'init',
        id: crypto.randomUUID(),
        createdAt: now.toISOString(),
        auditDate: now.toISOString().slice(0, 10),
      });
    }
  }, [audit.id]);

  const validation = useMemo(() => validateAudit(audit), [audit]);

  const downloadPdf = async () => {
    if (!documentRef.current || !validation.valid || exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      const namePart = sanitizeFilePart(
        audit.client.clientName.trim() || audit.siteUrl.replace(/^https?:\/\//, ''),
      );
      const datePart = (audit.auditDate || new Date().toISOString()).slice(0, 10);
      await generateDocumentPdf(
        documentRef.current,
        `ByteFlow-Site-Audit-${namePart}-${datePart}.pdf`,
      );
    } catch {
      setExportError('PDF export failed — try again, and check the console if it persists.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={`bfScope ${styles.app}`}>
      <header className={styles.toolbar}>
        <div>
          <p className={styles.eyebrow}>ByteFlow Internal</p>
          <h1 className={styles.title}>Site Audits</h1>
        </div>
        <div className={styles.toolbarActions}>
          {!validation.valid && (
            <p className={styles.validationHint} role="status">
              To export: add {validation.missing.join(', ')}.
            </p>
          )}
          {exportError && (
            <p className={styles.exportError} role="alert">
              {exportError}
            </p>
          )}
          <button
            type="button"
            className={styles.downloadButton}
            disabled={!validation.valid || exporting}
            onClick={downloadPdf}
          >
            {exporting ? 'Preparing PDF…' : 'Download PDF'}
          </button>
          <HomeLink />
          <form method="post" action="/api/internal-logout">
            <button type="submit" className={styles.logoutButton}>
              Log out
            </button>
          </form>
        </div>
      </header>

      <div className={styles.panes}>
        <section className={styles.formPane} aria-label="Audit form">
          <AuditForm audit={audit} dispatch={dispatch} />
        </section>
        <section className={styles.documentPane} aria-label="Audit report preview">
          <AuditDocument ref={documentRef} audit={audit} />
        </section>
      </div>
    </div>
  );
}
