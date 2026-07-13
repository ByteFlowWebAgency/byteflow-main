'use client';

// The pipeline board (03-CRM-SCREENS.md view 1): one column per working stage in
// order, "lost" behind a toggle so it doesn't dominate, cards with next-step/overdue/
// stale signals, prev-next stage controls plus an any-to-any stage select, and count +
// total value footers. Its main job is answering "what should I do today."

import { useMemo, useState } from 'react';
import styles from './CrmApp.module.css';
import { useCrm } from './CrmContext';
import ConfirmDialog from './ConfirmDialog';
import { ALL_STAGES, PIPELINE_STAGES, STAGE_LABELS } from '@/lib/crm/labels';
import { isOverdue, isStale } from '@/lib/crm/dealMeta';
import { lookupName } from '@/lib/crm/references';
import { formatDisplayDate, formatUsd } from '@/lib/internal-tools/format';
import type { Deal, DealStage } from '@/lib/crm/types';

export default function PipelineBoard({
  onOpenDeal,
  onNewDeal,
}: {
  onOpenDeal: (id: string) => void;
  onNewDeal: () => void;
}) {
  const { data, saveDeal } = useCrm();
  const [showLost, setShowLost] = useState(false);
  const [search, setSearch] = useState('');
  const [lostPrompt, setLostPrompt] = useState<Deal | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const now = new Date();

  const visibleDeals = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return data.deals;
    return data.deals.filter((deal) => {
      const orgName = lookupName(data.organizations, deal.organizationId, '') ?? '';
      const contactName = lookupName(data.contacts, deal.primaryContactId, '') ?? '';
      return `${deal.title} ${orgName} ${contactName}`.toLowerCase().includes(needle);
    });
  }, [data, search]);

  const columns = showLost ? ALL_STAGES : PIPELINE_STAGES;
  const lostCount = data.deals.filter((d) => d.stage === 'lost').length;

  // Persist a stage move (throws on failure — callers decide how to surface it).
  const applyStage = async (deal: Deal, stage: DealStage, lostReason?: string) => {
    await saveDeal({
      ...deal,
      stage,
      lostReason: stage === 'lost' ? lostReason : deal.lostReason,
      stageHistory: [...deal.stageHistory, { stage, at: new Date().toISOString() }],
    });
  };

  const changeStage = (deal: Deal, stage: DealStage) => {
    if (stage === deal.stage) return;
    if (stage === 'lost') {
      setLostPrompt(deal); // reason required — collected in the dialog below
      return;
    }
    setMoveError(null);
    applyStage(deal, stage).catch((err: unknown) => {
      setMoveError(
        err instanceof Error ? err.message : 'Could not move the deal — try again.',
      );
    });
  };

  return (
    <div>
      <div className={styles.boardControls}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search deals, orgs, contacts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search deals"
        />
        <button type="button" className={styles.ghostButton} onClick={() => setShowLost((v) => !v)}>
          {showLost ? 'Hide lost' : `Show lost (${lostCount})`}
        </button>
        <button type="button" className={styles.primaryButton} onClick={onNewDeal}>
          New deal
        </button>
      </div>

      {moveError && (
        <div className={styles.errorBanner} role="alert">
          <span>{moveError}</span>
          <button type="button" className={styles.ghostButton} onClick={() => setMoveError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {data.deals.length === 0 ? (
        <div className={styles.stateBox}>
          <p className={styles.stateTitle}>No deals yet</p>
          <p>
            The pipeline starts with the first “New deal” — e.g. “Sample Nonprofit Org
            site rebuild”.
          </p>
        </div>
      ) : (
        <div className={styles.board}>
          {columns.map((stage) => {
            const stageDeals = visibleDeals.filter((d) => d.stage === stage);
            const total = stageDeals.reduce((sum, d) => sum + (d.estimatedValue ?? 0), 0);
            return (
              <section
                key={stage}
                className={`${styles.column} ${stage === 'lost' ? styles.columnLost : ''}`}
                aria-label={`${STAGE_LABELS[stage]} column`}
              >
                <header className={styles.columnHeader}>
                  <span className={styles.columnTitle}>{STAGE_LABELS[stage]}</span>
                  <span className={styles.columnCount}>{stageDeals.length}</span>
                </header>
                <div className={styles.columnBody}>
                  {stageDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      now={now}
                      onOpen={() => onOpenDeal(deal.id)}
                      onChangeStage={(next) => changeStage(deal, next)}
                    />
                  ))}
                </div>
                <footer className={styles.columnFooter}>
                  <span>
                    {stageDeals.length} deal{stageDeals.length === 1 ? '' : 's'}
                  </span>
                  <span>{formatUsd(total)}</span>
                </footer>
              </section>
            );
          })}
        </div>
      )}

      {lostPrompt && (
        <ConfirmDialog
          title={`Mark “${lostPrompt.title}” as lost`}
          body="Lost deals stay on record — the why is the useful part."
          confirmLabel="Mark lost"
          danger
          promptLabel="Reason"
          promptPlaceholder="e.g. Budget went elsewhere"
          onCancel={() => setLostPrompt(null)}
          onConfirm={async (reason) => {
            await applyStage(lostPrompt, 'lost', reason);
            setLostPrompt(null);
          }}
        />
      )}
    </div>
  );
}

function DealCard({
  deal,
  now,
  onOpen,
  onChangeStage,
}: {
  deal: Deal;
  now: Date;
  onOpen: () => void;
  onChangeStage: (stage: DealStage) => void;
}) {
  const { data } = useCrm();
  const orgName = lookupName(data.organizations, deal.organizationId, '[deleted organization]');
  const contactName = lookupName(data.contacts, deal.primaryContactId, '[deleted contact]');
  const overdue = isOverdue(deal, now);
  const stale = isStale(deal, data.activities, now);
  const stageIndex = PIPELINE_STAGES.indexOf(deal.stage);
  const prevStage = stageIndex > 0 ? PIPELINE_STAGES[stageIndex - 1] : null;
  const nextStage =
    stageIndex >= 0 && stageIndex < PIPELINE_STAGES.length - 1
      ? PIPELINE_STAGES[stageIndex + 1]
      : null;

  return (
    <article className={styles.card}>
      <button type="button" className={styles.cardTitleButton} onClick={onOpen}>
        {deal.title}
      </button>
      <div className={styles.cardMeta}>
        {orgName && <span>{orgName}</span>}
        {contactName && <span>{contactName}</span>}
        {deal.estimatedValue !== undefined && (
          <span className={styles.cardValue}>{formatUsd(deal.estimatedValue)}</span>
        )}
      </div>
      {(overdue || stale) && (
        <div className={styles.flagRow}>
          {overdue && <span className={styles.overdueFlag}>Next step overdue</span>}
          {stale && <span className={styles.staleFlag}>Stale 14d+</span>}
        </div>
      )}
      {deal.nextStep && (
        <p className={styles.cardNext}>
          → {deal.nextStep}
          {deal.nextStepDue ? ` · ${formatDisplayDate(deal.nextStepDue)}` : ''}
        </p>
      )}
      <div className={styles.cardActions}>
        <button
          type="button"
          className={styles.moveButton}
          disabled={!prevStage}
          aria-label={prevStage ? `Move to ${STAGE_LABELS[prevStage]}` : 'No previous stage'}
          title={prevStage ? `← ${STAGE_LABELS[prevStage]}` : undefined}
          onClick={() => prevStage && onChangeStage(prevStage)}
        >
          ←
        </button>
        <select
          className={styles.cardStageSelect}
          value={deal.stage}
          aria-label={`Stage of ${deal.title}`}
          onChange={(e) => onChangeStage(e.target.value as DealStage)}
        >
          {ALL_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.moveButton}
          disabled={!nextStage}
          aria-label={nextStage ? `Move to ${STAGE_LABELS[nextStage]}` : 'No next stage'}
          title={nextStage ? `→ ${STAGE_LABELS[nextStage]}` : undefined}
          onClick={() => nextStage && onChangeStage(nextStage)}
        >
          →
        </button>
      </div>
    </article>
  );
}
