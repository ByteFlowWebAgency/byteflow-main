'use client';

// The CRM shell: tabs (Pipeline is the default view), pipeline summary strip, CSV
// exports, backup/restore, and the list↔detail navigation. All data flows through
// CrmProvider (mounted at the internal-tools layout, not here — see
// (protected)/layout.tsx — so it survives navigating away and back) → the storage
// adapter; nothing here touches fetch or Supabase.

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import '@/components/internal-tools/tokens.css';
import styles from './CrmApp.module.css';
import { useCrm } from './CrmContext';
import PipelineBoard from './PipelineBoard';
import ContactsView from './ContactsView';
import OrganizationsView, { OrganizationDetail } from './OrganizationsView';
import ContactDetail from './ContactDetail';
import DealDetail from './DealDetail';
import DealForm from './DealForm';
import BackupControls from './BackupControls';
import { summarizePipeline } from '@/lib/crm/dealMeta';
import { contactsCsv, dealsCsv } from '@/lib/crm/csv';
import { downloadCsv } from '@/lib/internal-tools/csv';
import { formatUsd } from '@/lib/internal-tools/format';

type View = 'pipeline' | 'contacts' | 'organizations';
type Detail =
  | { kind: 'deal'; id: string }
  | { kind: 'contact'; id: string }
  | { kind: 'organization'; id: string }
  | null;

/**
 * Seed the detail view from the URL, so a record can be deep-linked. The CRM's detail view
 * is component state rather than a route, so before this there was no way to send anyone to
 * a specific record — which the missing-document flow needs when it says "this client's
 * record is incomplete, go fix it".
 *
 * Read once on mount rather than kept in sync: the URL is an entry point, not a mirror of
 * the UI, and rewriting it on every click would fight the existing back/forward behaviour.
 */
function detailFromParams(params: URLSearchParams): Detail {
  for (const kind of ['organization', 'contact', 'deal'] as const) {
    const id = params.get(kind);
    if (id) return { kind, id };
  }
  return null;
}

export default function CrmApp() {
  const { data, loading, loadError, reload } = useCrm();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>('pipeline');
  const [detail, setDetail] = useState<Detail>(() => detailFromParams(searchParams));
  const [showNewDeal, setShowNewDeal] = useState(false);

  const openDeal = (id: string) => setDetail({ kind: 'deal', id });
  const openContact = (id: string) => setDetail({ kind: 'contact', id });
  const openOrganization = (id: string) => setDetail({ kind: 'organization', id });
  const summary = summarizePipeline(data.deals, new Date());

  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <main className={`bfScope ${styles.app}`}>
      <div className={styles.inner}>
        <header className={styles.toolbar}>
          <div>
            <h1 className={styles.title}>CRM</h1>
            <p className={styles.subtitle}>
              Contacts, organizations, and the deal pipeline.
            </p>
          </div>
          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={() => downloadCsv(`ByteFlow-contacts-${stamp}.csv`, contactsCsv(data))}
              disabled={loading || Boolean(loadError)}
            >
              Contacts CSV
            </button>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={() => downloadCsv(`ByteFlow-deals-${stamp}.csv`, dealsCsv(data))}
              disabled={loading || Boolean(loadError)}
            >
              Deals CSV
            </button>
            <BackupControls onRestored={reload} />
          </div>
        </header>

        {loading ? (
          <div className={styles.stateBox} role="status">
            <p className={styles.stateTitle}>Loading CRM…</p>
            <p>Talking to the database.</p>
          </div>
        ) : loadError ? (
          <div className={`${styles.stateBox} ${styles.stateBoxError}`} role="alert">
            <p className={styles.stateTitle}>Couldn&apos;t load CRM data</p>
            <p>{loadError}</p>
            <button type="button" className={styles.ghostButton} onClick={reload}>
              Retry
            </button>
          </div>
        ) : detail?.kind === 'deal' ? (
          <DealDetail
            key={detail.id}
            dealId={detail.id}
            onBack={() => setDetail(null)}
            onOpenContact={openContact}
            onOpenOrganization={openOrganization}
          />
        ) : detail?.kind === 'contact' ? (
          <ContactDetail
            key={detail.id}
            contactId={detail.id}
            onBack={() => setDetail(null)}
            onOpenContact={openContact}
            onOpenDeal={openDeal}
            onOpenOrganization={openOrganization}
          />
        ) : detail?.kind === 'organization' ? (
          <OrganizationDetail
            key={detail.id}
            organizationId={detail.id}
            onBack={() => setDetail(null)}
            onOpenContact={openContact}
            onOpenDeal={openDeal}
          />
        ) : (
          <>
            <div className={styles.tabs} role="tablist" aria-label="CRM views">
              {(
                [
                  ['pipeline', 'Pipeline'],
                  ['contacts', 'Contacts'],
                  ['organizations', 'Organizations'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={view === key}
                  className={`${styles.tab} ${view === key ? styles.tabActive : ''}`}
                  onClick={() => setView(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {view === 'pipeline' && (
              <>
                <div className={styles.summaryStrip} aria-label="Pipeline summary">
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryValue}>{summary.openCount}</span>
                    <span className={styles.summaryLabel}>open deals</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryValue}>
                      {formatUsd(summary.openValue)}
                    </span>
                    <span className={styles.summaryLabel}>pipeline value</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span
                      className={`${styles.summaryValue} ${
                        summary.overdueCount > 0 ? styles.summaryValueWarn : ''
                      }`}
                    >
                      {summary.overdueCount}
                    </span>
                    <span className={styles.summaryLabel}>overdue next steps</span>
                  </div>
                </div>
                <PipelineBoard
                  onOpenDeal={openDeal}
                  onNewDeal={() => setShowNewDeal(true)}
                />
              </>
            )}
            {view === 'contacts' && <ContactsView onOpenContact={openContact} />}
            {view === 'organizations' && (
              <OrganizationsView onOpenOrganization={openOrganization} />
            )}
          </>
        )}
      </div>

      {showNewDeal && (
        <DealForm
          onClose={() => setShowNewDeal(false)}
          onCreated={(dealId) => {
            setShowNewDeal(false);
            openDeal(dealId);
          }}
        />
      )}
    </main>
  );
}
