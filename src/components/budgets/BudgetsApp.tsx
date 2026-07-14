'use client';

// Budget tracker (04-BUDGET-TRACKER.md): budgets list with planned/actual/variance,
// new/duplicate/rename/delete, and the spreadsheet-like detail in BudgetDetail. All
// persistence through the storage adapter; loading and error states are explicit — an
// unreachable database never looks like an empty list.

import { useMemo, useState } from 'react';
import '@/components/internal-tools/tokens.css';
import MonthPicker from '@/components/internal-tools/datepicker/MonthPicker';
import styles from './BudgetsApp.module.css';
import BudgetDetail from './BudgetDetail';
import ConfirmDialog from '@/components/internal-tools/ConfirmDialog';
import { useBudgets } from './BudgetsContext';
import { duplicateBudget, nextPeriodKey, totalsOf } from '@/lib/budgets/math';
import { formatUsd } from '@/lib/internal-tools/format';
import type { Budget, BudgetKind } from '@/lib/budgets/types';

export default function BudgetsApp() {
  const { budgets, loading, loadError, reload, persist, remove } = useBudgets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [renaming, setRenaming] = useState<Budget | null>(null);
  const [duplicating, setDuplicating] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState<Budget | null>(null);

  const selected = budgets.find((b) => b.id === selectedId) ?? null;

  const rows = useMemo(
    () =>
      [...budgets]
        .sort((a, b) => a.name.localeCompare(b.name) || (a.period ?? '').localeCompare(b.period ?? ''))
        .map((budget) => ({ budget, totals: totalsOf(budget.items) })),
    [budgets],
  );

  return (
    <main className={`bfScope ${styles.app}`}>
      <div className={styles.inner}>
        {selected ? (
          <BudgetDetail
            key={selected.id}
            budget={selected}
            allBudgets={budgets}
            onPersist={persist}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <>
            <header className={styles.toolbar}>
              <div>
                <h1 className={styles.title}>Budgets</h1>
                <p className={styles.subtitle}>
                  Planned vs. actual for project and recurring budgets.
                </p>
              </div>
              <div className={styles.toolbarActions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => setShowNew(true)}
                >
                  New budget
                </button>
              </div>
            </header>

            <p className={styles.hint} style={{ marginBottom: 14 }}>
              Planning and tracking only — invoices and books of record stay in
              QuickBooks. Backup/restore for all internal-tools data lives in the CRM.
            </p>

            {loading ? (
              <div className={styles.stateBox} role="status">
                <p className={styles.stateTitle}>Loading budgets…</p>
                <p>Talking to the database.</p>
              </div>
            ) : loadError ? (
              <div className={`${styles.stateBox} ${styles.stateBoxError}`} role="alert">
                <p className={styles.stateTitle}>Couldn&apos;t load budgets</p>
                <p>{loadError}</p>
                <button type="button" className={styles.ghostButton} onClick={reload}>
                  Retry
                </button>
              </div>
            ) : rows.length === 0 ? (
              <div className={styles.stateBox}>
                <p className={styles.stateTitle}>No budgets yet</p>
                <p>
                  Start with a project budget (“Sample Client rebuild”) or a recurring
                  bucket (“Monthly ops”).
                </p>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => setShowNew(true)}
                >
                  Create the first budget
                </button>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Kind</th>
                      <th scope="col">Period</th>
                      <th scope="col" style={{ textAlign: 'right' }}>
                        Planned
                      </th>
                      <th scope="col" style={{ textAlign: 'right' }}>
                        Actual
                      </th>
                      <th scope="col" style={{ textAlign: 'right' }}>
                        Variance
                      </th>
                      <th scope="col">Updated</th>
                      <th scope="col" aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ budget, totals }) => (
                      <tr key={budget.id}>
                        <td>
                          <button
                            type="button"
                            className={styles.linkButton}
                            onClick={() => setSelectedId(budget.id)}
                          >
                            {budget.name}
                          </button>
                        </td>
                        <td className={styles.cellMuted}>
                          {budget.kind === 'project' ? 'Project' : 'Recurring'}
                        </td>
                        <td className={styles.cellMuted}>{budget.period ?? '—'}</td>
                        <td className={styles.numCell}>{formatUsd(totals.planned)}</td>
                        <td className={styles.numCell}>{formatUsd(totals.actual)}</td>
                        <td
                          className={`${styles.numCell} ${
                            totals.variance < 0 ? styles.varOver : styles.varUnder
                          }`}
                        >
                          {formatUsd(totals.variance)}
                        </td>
                        <td className={styles.cellMuted}>
                          {new Date(budget.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td>
                          <div className={styles.rowActions}>
                            <button
                              type="button"
                              className={styles.smallButton}
                              onClick={() => setDuplicating(budget)}
                            >
                              Duplicate
                            </button>
                            <button
                              type="button"
                              className={styles.smallButton}
                              onClick={() => setRenaming(budget)}
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              className={`${styles.smallButton} ${styles.smallDanger}`}
                              onClick={() => setDeleting(budget)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {showNew && (
        <NewBudgetDialog
          onClose={() => setShowNew(false)}
          onCreate={async (budget) => {
            await persist(budget);
            setShowNew(false);
            setSelectedId(budget.id);
          }}
        />
      )}

      {renaming && (
        <ConfirmDialog
          title="Rename budget"
          body={`Rename “${renaming.name}”.`}
          confirmLabel="Rename"
          promptLabel="New name"
          promptDefault={renaming.name}
          onCancel={() => setRenaming(null)}
          onConfirm={async (name) => {
            await persist({ ...renaming, name });
            setRenaming(null);
          }}
        />
      )}

      {duplicating && (
        <DuplicateDialog
          source={duplicating}
          onClose={() => setDuplicating(null)}
          onCreate={async (budget) => {
            await persist(budget);
            setDuplicating(null);
            setSelectedId(budget.id);
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete “${deleting.name}”?`}
          body={`${deleting.items.length} line item${deleting.items.length === 1 ? '' : 's'} will be deleted with it. This is permanent — consider a backup first (in the CRM toolbar).`}
          confirmLabel="Delete budget"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await remove(deleting.id);
            if (selectedId === deleting.id) setSelectedId(null);
            setDeleting(null);
          }}
        />
      )}
    </main>
  );
}

function NewBudgetDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (budget: Budget) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<BudgetKind>('project');
  const [period, setPeriod] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = name.trim().length > 0 && (kind === 'project' || /^\d{4}-\d{2}$/.test(period));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready || saving) return;
    setSaving(true);
    setError(null);
    const now = new Date().toISOString();
    try {
      await onCreate({
        id: crypto.randomUUID(),
        name: name.trim(),
        kind,
        period: kind === 'recurring' ? period : undefined,
        items: [],
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the budget.');
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label="New budget">
        <h2 className={styles.dialogTitle}>New budget</h2>
        <form onSubmit={submit} className={styles.fieldGrid}>
          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="nb-name" className={`${styles.label} ${styles.required}`}>
              Name
            </label>
            <input
              id="nb-name"
              className={styles.input}
              type="text"
              value={name}
              placeholder="e.g. Sample Client rebuild, Monthly ops"
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="nb-kind" className={styles.label}>
              Kind
            </label>
            <select
              id="nb-kind"
              className={styles.select}
              value={kind}
              onChange={(e) => setKind(e.target.value as BudgetKind)}
            >
              <option value="project">Project</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>
          {kind === 'recurring' && (
            <div className={styles.field}>
              <label htmlFor="nb-period" className={`${styles.label} ${styles.required}`}>
                Period
              </label>
              <MonthPicker
                id="nb-period"
                value={period}
                onChange={setPeriod}
                ariaLabel="Period"
              />
            </div>
          )}
          <div className={`${styles.fieldWide} ${styles.formActions}`}>
            {error && (
              <p className={styles.formError} role="alert">
                {error}
              </p>
            )}
            <button type="button" className={styles.ghostButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton} disabled={!ready || saving}>
              {saving ? 'Creating…' : 'Create budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DuplicateDialog({
  source,
  onClose,
  onCreate,
}: {
  source: Budget;
  onClose: () => void;
  onCreate: (budget: Budget) => Promise<void>;
}) {
  // The natural "next month" workflow: recurring budgets suggest the next period key
  // (handles year boundaries); projects suggest "<name> (copy)".
  const suggestedPeriod = source.period ? (nextPeriodKey(source.period) ?? '') : '';
  const [name, setName] = useState(
    source.kind === 'recurring' ? source.name : `${source.name} (copy)`,
  );
  const [period, setPeriod] = useState(suggestedPeriod);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready =
    name.trim().length > 0 &&
    (source.kind === 'project' || /^\d{4}-\d{2}$/.test(period));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onCreate(
        duplicateBudget(source, {
          name: name.trim(),
          period: source.kind === 'recurring' ? period : undefined,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not duplicate the budget.');
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label="Duplicate budget">
        <h2 className={styles.dialogTitle}>Duplicate “{source.name}”</h2>
        <p className={styles.hint} style={{ marginBottom: 12 }}>
          Line items carry over with planned amounts; actuals reset to $0.
        </p>
        <form onSubmit={submit} className={styles.fieldGrid}>
          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="dup-name" className={`${styles.label} ${styles.required}`}>
              Name
            </label>
            <input
              id="dup-name"
              className={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          {source.kind === 'recurring' && (
            <div className={styles.field}>
              <label htmlFor="dup-period" className={`${styles.label} ${styles.required}`}>
                Period
              </label>
              <MonthPicker
                id="dup-period"
                value={period}
                onChange={setPeriod}
                ariaLabel="Period"
              />
            </div>
          )}
          <div className={`${styles.fieldWide} ${styles.formActions}`}>
            {error && (
              <p className={styles.formError} role="alert">
                {error}
              </p>
            )}
            <button type="button" className={styles.ghostButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton} disabled={!ready || saving}>
              {saving ? 'Duplicating…' : 'Duplicate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
