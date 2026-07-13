'use client';

import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import '@/components/internal-tools/tokens.css';
import styles from './AuditToolApp.module.css';
import AuditForm from './AuditForm/AuditForm';
import AuditDocument from './AuditDocument/AuditDocument';
import ThemedDocument from '@/components/internal-tools/themes/ThemedDocument';
import CoverPage from '@/components/internal-tools/themes/CoverPage';
import { CLASSIC_THEME, getBuiltInTheme } from '@/components/internal-tools/themes/builtInThemes';
import { useCustomThemes } from '@/components/internal-tools/themes/themeStorage';
import TemplateChooser from '@/components/internal-tools/templates/TemplateChooser';
import SaveTemplateDialog from '@/components/internal-tools/templates/SaveTemplateDialog';
import {
  applyAuditTemplate,
  captureAuditContent,
  saveCustomTemplate,
  useCustomTemplates,
} from '@/components/internal-tools/templates/templateStorage';
import type { DocumentTemplate } from '@/components/internal-tools/templates/templateTypes';
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
  | { type: 'removeRecommendation'; index: number }
  | { type: 'setTheme'; themeId: string }
  | { type: 'setIncludeCoverPage'; include: boolean }
  | { type: 'applyTemplate'; data: AuditData };

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
    case 'setTheme':
      return { ...audit, themeId: action.themeId };
    case 'setIncludeCoverPage':
      return { ...audit, includeCoverPage: action.include };
    case 'applyTemplate':
      // Already a fresh deep copy with regenerated ids (templateStorage).
      return action.data;
  }
}

export default function AuditToolApp() {
  const [audit, dispatch] = useReducer(reducer, undefined, createDefaultAudit);
  const documentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showChooser, setShowChooser] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateStatus, setTemplateStatus] = useState<string | null>(null);
  const customTemplates = useCustomTemplates('audit');

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

  // Deleted custom themes fall back to Classic at render time (the form shows why).
  const customThemes = useCustomThemes();
  const theme = useMemo(
    () =>
      getBuiltInTheme(audit.themeId) ??
      customThemes.find((t) => t.id === audit.themeId) ??
      CLASSIC_THEME,
    [audit.themeId, customThemes],
  );

  const pickTemplate = (template: DocumentTemplate | null) => {
    if (template) {
      dispatch({ type: 'applyTemplate', data: applyAuditTemplate(template, audit) });
    }
    setShowChooser(false);
  };

  const saveAsTemplate = (name: string, description: string): string | null => {
    const existing = customTemplates.find(
      (t) => t.name.toLowerCase() === name.toLowerCase(),
    );
    const result = saveCustomTemplate({
      id: existing ? existing.id : crypto.randomUUID(),
      name,
      description,
      isBuiltIn: false,
      documentType: 'audit',
      themeId: audit.themeId,
      includeCoverPage: audit.includeCoverPage,
      defaultContent: captureAuditContent(audit),
    });
    if (!result.ok) return result.error;
    setSavingTemplate(false);
    setTemplateStatus(`Template "${name}" saved.`);
    return null;
  };

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
        { backgroundColor: theme.colors.background },
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
          <h1 className={styles.title}>Site Audits</h1>
          <p className={styles.subtitle}>
            Prospect audit reports — findings, screenshots, and a PDF to send.
          </p>
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
          {templateStatus && (
            <p className={styles.validationHint} role="status">
              {templateStatus}
            </p>
          )}
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setSavingTemplate(true)}
          >
            Save as template
          </button>
          <button
            type="button"
            className={styles.downloadButton}
            disabled={!validation.valid || exporting}
            onClick={downloadPdf}
          >
            {exporting ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </div>
      </header>

      <div className={styles.panes}>
        <section className={styles.formPane} aria-label="Audit form">
          <AuditForm audit={audit} dispatch={dispatch} />
        </section>
        <section className={styles.documentPane} aria-label="Audit report preview">
          <ThemedDocument ref={documentRef} theme={theme}>
            {audit.includeCoverPage && (
              <CoverPage
                label="Site Audit Report"
                title={audit.siteUrl.trim() || '[site-url.com]'}
                clientName={audit.client.clientName.trim() || '[Client name]'}
                date={audit.auditDate || audit.createdAt}
                theme={theme}
              />
            )}
            <AuditDocument audit={audit} />
          </ThemedDocument>
        </section>
      </div>

      {showChooser && (
        <TemplateChooser documentType="audit" documentLabel="audit" onPick={pickTemplate} />
      )}
      {savingTemplate && (
        <SaveTemplateDialog
          documentLabel="audit"
          existingNames={customTemplates.map((t) => t.name)}
          onSave={saveAsTemplate}
          onCancel={() => setSavingTemplate(false)}
        />
      )}
    </div>
  );
}
