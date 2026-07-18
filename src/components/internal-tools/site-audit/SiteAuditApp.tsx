'use client';

// Site Audit — the internal front end for the Python audit microservice.
// Enter a site, run the full audit (SEO + WordPress/security + broken links +
// WCAG axe-core) in one action, then turn the results into an on-brand Document
// Builder report in one click (create + open), without re-crawling.

import { type SubmitEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/components/internal-tools/tokens.css';
import styles from './SiteAuditApp.module.css';

import { AuditApiError, exportReport, runAuditRequest } from '@/lib/audit-service/browser';
import type { AuditResponse, Issue, PageResult, WcagViolation } from '@/lib/audit-service/types';
import { parseDocImport, saveDoc } from '@/lib/document-builder/storage';
import { pushDocumentToServer } from '@/lib/document-builder/sync';

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
const IMPACT_TO_SEVERITY: Record<string, string> = {
  critical: 'critical',
  serious: 'high',
  moderate: 'medium',
  minor: 'low',
};

function severityClass(severity: string): string {
  switch (severity) {
    case 'critical':
      return styles.sevCritical;
    case 'high':
      return styles.sevHigh;
    case 'medium':
      return styles.sevMedium;
    case 'low':
      return styles.sevLow;
    default:
      return styles.sevInfo;
  }
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function pagesWithFindings(pages: PageResult[]): PageResult[] {
  return pages.filter((p) => p.issues.length > 0 || (p.wcag_violations?.length ?? 0) > 0);
}

export default function SiteAuditApp() {
  const router = useRouter();

  const [url, setUrl] = useState('');
  const [clientName, setClientName] = useState('');
  const [maxPages, setMaxPages] = useState(40);
  const [checkBrokenLinks, setCheckBrokenLinks] = useState(true);
  const [checkWcag, setCheckWcag] = useState(true);

  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResponse | null>(null);

  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  async function onRun(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setRunError('Enter a site URL to audit.');
      return;
    }
    setUrl(normalized);
    setRunning(true);
    setRunError(null);
    setReportError(null);
    setResult(null);
    try {
      const data = await runAuditRequest({
        url: normalized,
        max_pages: maxPages,
        check_broken_links: checkBrokenLinks,
        check_wcag: checkWcag,
      });
      setResult(data);
    } catch (error) {
      setRunError(error instanceof AuditApiError ? error.message : 'The audit failed. Please try again.');
    } finally {
      setRunning(false);
    }
  }

  async function onCreateReport() {
    if (!result) return;
    setReporting(true);
    setReportError(null);
    try {
      const doc = await exportReport(result, clientName.trim());
      // Same create-and-open path the Document Builder's "Import JSON" uses:
      // validate/normalize → save locally (the editor reads localStorage) →
      // mirror to the shared server copy → open the editor.
      const parsed = parseDocImport(JSON.stringify(doc));
      if (!parsed.doc) {
        setReportError(parsed.error ?? 'The generated report could not be imported.');
        return;
      }
      const saved = saveDoc(parsed.doc);
      if (!saved.ok) {
        setReportError(saved.error);
        return;
      }
      void pushDocumentToServer(parsed.doc); // best-effort share; local save already succeeded
      router.push(`/internal/documents/${parsed.doc.id}`);
    } catch (error) {
      setReportError(error instanceof AuditApiError ? error.message : 'Could not build the report.');
    } finally {
      setReporting(false);
    }
  }

  return (
    <main className={styles.app}>
      <div className={styles.inner}>
        <div className={styles.toolbar}>
          <div>
            <h1 className={styles.title}>Site Audit</h1>
            <p className={styles.subtitle}>
              Crawl a WordPress site for SEO, security exposure, broken links and real WCAG 2.2
              violations — then turn it into a client-ready report in one click.
            </p>
          </div>
        </div>

        <form className={styles.form} onSubmit={onRun}>
          <div className={styles.formGrid}>
            <div className={`${styles.field} ${styles.fieldWide}`}>
              <label htmlFor="audit-url" className={`${styles.label} ${styles.required}`}>
                Site URL
              </label>
              <input
                id="audit-url"
                className={styles.input}
                type="text"
                inputMode="url"
                placeholder="example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={running}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="audit-client" className={styles.label}>
                Client name <span className={styles.hint}>(for the report cover)</span>
              </label>
              <input
                id="audit-client"
                className={styles.input}
                type="text"
                placeholder="e.g. The Experience Barber Shop"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                disabled={running}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="audit-maxpages" className={styles.label}>
                Max pages
              </label>
              <input
                id="audit-maxpages"
                className={styles.input}
                type="number"
                min={1}
                max={300}
                value={maxPages}
                onChange={(e) => setMaxPages(Math.max(1, Math.min(300, Number(e.target.value) || 1)))}
                disabled={running}
              />
            </div>
          </div>

          <div className={styles.checkGroup}>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={checkBrokenLinks}
                onChange={(e) => setCheckBrokenLinks(e.target.checked)}
                disabled={running}
              />
              Check broken internal links
            </label>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={checkWcag}
                onChange={(e) => setCheckWcag(e.target.checked)}
                disabled={running}
              />
              WCAG 2.2 scan (axe-core, renders each page — slower)
            </label>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryButton} disabled={running}>
              {running ? 'Running audit…' : 'Run full audit'}
            </button>
          </div>
        </form>

        {runError && (
          <div className={styles.errorBanner} role="alert">
            {runError}
          </div>
        )}

        {running && (
          <div className={styles.stateBox}>
            <div className={styles.stateTitle}>Crawling {url}…</div>
            {checkWcag
              ? 'Running the WCAG browser scan renders every page — this can take several seconds per page.'
              : 'This usually takes a few seconds.'}
          </div>
        )}

        {result && !running && <Results result={result} />}

        {result && !running && (
          <div className={styles.reportBar}>
            <div className={styles.reportText}>
              <strong>Generate a client report</strong>
              <span className={styles.hint}>
                Creates an on-brand Document Builder document from these findings and opens it.
              </span>
            </div>
            <div className={styles.reportActions}>
              {reportError && <span className={styles.formError}>{reportError}</span>}
              <button
                type="button"
                className={styles.primaryButton}
                onClick={onCreateReport}
                disabled={reporting}
              >
                {reporting ? 'Building report…' : 'Create Document Builder report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Results({ result }: { result: AuditResponse }) {
  const s = result.summary;
  const wp = result.wordpress;
  const findingPages = pagesWithFindings(result.pages);
  const hasDuplicates =
    result.duplicates.titles.length > 0 ||
    result.duplicates.meta_descriptions.length > 0 ||
    result.duplicates.content.length > 0;

  return (
    <div className={styles.results}>
      <div className={styles.summaryStrip}>
        <SummaryStat label="Critical" value={s.critical} warn={s.critical > 0} />
        <SummaryStat label="High" value={s.high} warn={s.high > 0} />
        <SummaryStat label="Medium" value={s.medium} />
        <SummaryStat label="Low" value={s.low} />
        <SummaryStat label="Info" value={s.info} />
        <SummaryStat label="Pages crawled" value={s.pages_crawled} />
        <SummaryStat label="Pages failed" value={s.pages_failed} warn={s.pages_failed > 0} />
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>WordPress</h2>
        <div className={styles.kvRow}>
          <span className={styles.kvLabel}>Detected</span>
          <span className={styles.kvValue}>{wp.detected ? 'Yes' : 'No'}</span>
          <span className={styles.kvLabel}>Version</span>
          <span className={styles.kvValue}>{wp.version ?? 'Unknown'}</span>
          <span className={styles.kvLabel}>REST API</span>
          <span className={styles.kvValue}>{wp.rest_api_available ? 'Available' : 'Not available'}</span>
        </div>
      </section>

      {result.wcag_disclaimer && (
        <div className={styles.callout}>
          <strong>WCAG coverage:</strong> {result.wcag_disclaimer}
        </div>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Site-wide findings</h2>
        {result.site_findings.length > 0 ? (
          <IssueList issues={result.site_findings} />
        ) : (
          <p className={styles.muted}>No site-wide WordPress or exposure issues were detected.</p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Page-by-page findings <span className={styles.count}>({findingPages.length})</span>
        </h2>
        {findingPages.length > 0 ? (
          <div className={styles.pageList}>
            {findingPages.map((page) => (
              <PageFindings key={page.url} page={page} />
            ))}
          </div>
        ) : (
          <p className={styles.muted}>No page-level issues found.</p>
        )}
      </section>

      {hasDuplicates && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Duplicate content</h2>
          <DuplicateBlock label="Duplicate titles" groups={result.duplicates.titles} />
          <DuplicateBlock label="Duplicate meta descriptions" groups={result.duplicates.meta_descriptions} />
          <DuplicateBlock label="Near-duplicate page content" groups={result.duplicates.content} />
        </section>
      )}
    </div>
  );
}

function SummaryStat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className={styles.summaryItem}>
      <span className={`${styles.summaryValue} ${warn ? styles.summaryValueWarn : ''}`}>{value}</span>
      <span className={styles.summaryLabel}>{label}</span>
    </div>
  );
}

function IssueList({ issues }: { issues: Issue[] }) {
  const ordered = [...issues].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9),
  );
  return (
    <ul className={styles.issueList}>
      {ordered.map((issue, i) => (
        <li key={`${issue.id}-${i}`} className={styles.issueItem}>
          <span className={`${styles.badge} ${severityClass(issue.severity)}`}>{issue.severity}</span>
          <div className={styles.issueBody}>
            <span className={styles.issueTitle}>{issue.title}</span>
            <span className={styles.issueDetail}>{issue.detail}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function WcagList({ violations }: { violations: WcagViolation[] }) {
  const ordered = [...violations].sort(
    (a, b) =>
      (SEVERITY_ORDER[IMPACT_TO_SEVERITY[a.impact] ?? 'info'] ?? 9) -
      (SEVERITY_ORDER[IMPACT_TO_SEVERITY[b.impact] ?? 'info'] ?? 9),
  );
  return (
    <ul className={styles.issueList}>
      {ordered.map((v, i) => (
        <li key={`${v.id}-${i}`} className={styles.issueItem}>
          <span className={`${styles.badge} ${severityClass(IMPACT_TO_SEVERITY[v.impact] ?? 'info')}`}>
            {v.impact}
          </span>
          <div className={styles.issueBody}>
            <span className={styles.issueTitle}>
              {v.help} <span className={styles.ruleId}>({v.id})</span>
            </span>
            <span className={styles.issueDetail}>
              {v.nodes.length} element{v.nodes.length === 1 ? '' : 's'} affected
              {v.help_url ? (
                <>
                  {' · '}
                  <a className={styles.link} href={v.help_url} target="_blank" rel="noreferrer">
                    Deque reference
                  </a>
                </>
              ) : null}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PageFindings({ page }: { page: PageResult }) {
  const wcag = page.wcag_violations ?? [];
  return (
    <div className={styles.pageCard}>
      <div className={styles.pageHead}>
        <span className={styles.pageTitle}>{page.title || page.url}</span>
        <a className={styles.pageUrl} href={page.url} target="_blank" rel="noreferrer">
          {page.url}
        </a>
      </div>
      {page.issues.length > 0 && <IssueList issues={page.issues} />}
      {wcag.length > 0 && (
        <>
          <div className={styles.subheading}>WCAG violations</div>
          <WcagList violations={wcag} />
        </>
      )}
    </div>
  );
}

function DuplicateBlock({ label, groups }: { label: string; groups: { value: string; urls: string[] }[] }) {
  if (groups.length === 0) return null;
  return (
    <div className={styles.dupBlock}>
      <div className={styles.subheading}>{label}</div>
      {groups.map((g, i) => (
        <div key={i} className={styles.dupGroup}>
          <span className={styles.dupValue}>{g.value || '(empty)'}</span>
          <span className={styles.dupUrls}>{g.urls.length} pages: {g.urls.slice(0, 5).join(', ')}
            {g.urls.length > 5 ? ` +${g.urls.length - 5} more` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}
