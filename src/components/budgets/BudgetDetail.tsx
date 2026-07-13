'use client';

// The spreadsheet-like budget screen (04-BUDGET-TRACKER.md): summary strip with
// percent-spent flags, in-place editable rows with category autocomplete, add/delete/
// reorder, a group-by-category subtotals toggle, an always-visible totals row, and
// CSV export. Edits autosave through the adapter (debounced); a failed save keeps the
// edit on screen with a visible retry — never a silent drop.

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './BudgetsApp.module.css';
import {
  budgetCsv,
  categoriesOf,
  groupByCategory,
  previousPeriodKey,
  totalsOf,
} from '@/lib/budgets/math';
import { downloadCsv } from '@/lib/internal-tools/csv';
import { formatUsd } from '@/lib/internal-tools/format';
import type { Budget, BudgetItem } from '@/lib/budgets/types';

const AUTOSAVE_MS = 800;

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export default function BudgetDetail({
  budget,
  allBudgets,
  onPersist,
  onBack,
}: {
  budget: Budget;
  allBudgets: Budget[];
  onPersist: (budget: Budget) => Promise<Budget>;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState<Budget>(budget);
  const [grouped, setGrouped] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totals = totalsOf(draft.items);
  const categories = categoriesOf(draft);

  // Month-over-month: previous period's actual total, when a recurring budget with
  // the same name exists for the prior month key.
  const previousActual = useMemo(() => {
    if (draft.kind !== 'recurring' || !draft.period) return null;
    const prevKey = previousPeriodKey(draft.period);
    if (!prevKey) return null;
    const prev = allBudgets.find(
      (b) => b.kind === 'recurring' && b.name === draft.name && b.period === prevKey,
    );
    return prev ? { period: prevKey, actual: totalsOf(prev.items).actual } : null;
  }, [allBudgets, draft.kind, draft.name, draft.period]);

  const persistNow = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setSaveState('saving');
    setSaveError(null);
    try {
      await onPersist(draftRef.current);
      setSaveState('saved');
    } catch (err) {
      setSaveState('error');
      setSaveError(err instanceof Error ? err.message : 'Save failed.');
    }
  };

  const scheduleSave = () => {
    setSaveState('dirty');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void persistNow(), AUTOSAVE_MS);
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const update = (mutate: (items: BudgetItem[]) => BudgetItem[]) => {
    setDraft((d) => ({ ...d, items: mutate(d.items) }));
    scheduleSave();
  };

  const updateItem = (id: string, patch: Partial<BudgetItem>) =>
    update((items) => items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const addRow = () =>
    update((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        category: '',
        description: '',
        planned: 0,
        actual: 0,
      },
    ]);

  const removeRow = (id: string) => update((items) => items.filter((i) => i.id !== id));

  const moveRow = (id: string, delta: -1 | 1) =>
    update((items) => {
      const index = items.findIndex((i) => i.id === id);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= items.length) return items;
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  // Negative amounts are rejected at the input (04: an expense line is non-negative).
  const numberChange = (id: string, key: 'planned' | 'actual', raw: string) => {
    const value = raw === '' ? 0 : Number(raw);
    if (!Number.isFinite(value) || value < 0) return;
    updateItem(id, { [key]: value });
  };

  const percentClass =
    totals.percentSpent === null
      ? styles.pctOk
      : totals.percentSpent > 100
        ? styles.pctOver
        : totals.percentSpent > 90
          ? styles.pctWarn
          : styles.pctOk;

  const itemRow = (item: BudgetItem, index: number, count: number) => (
    <tr key={item.id}>
      <td>
        <input
          className={styles.sheetInput}
          type="text"
          value={item.category}
          list="budget-categories"
          placeholder="Category"
          aria-label={`Category, row ${index + 1}`}
          onChange={(e) => updateItem(item.id, { category: e.target.value })}
        />
      </td>
      <td>
        <input
          className={styles.sheetInput}
          type="text"
          value={item.description}
          placeholder="Description"
          aria-label={`Description, row ${index + 1}`}
          onChange={(e) => updateItem(item.id, { description: e.target.value })}
        />
      </td>
      <td>
        <input
          className={`${styles.sheetInput} ${styles.sheetNumber}`}
          type="number"
          min={0}
          step="any"
          value={String(item.planned)}
          aria-label={`Planned, row ${index + 1}`}
          onChange={(e) => numberChange(item.id, 'planned', e.target.value)}
          onFocus={(e) => e.target.select()}
        />
      </td>
      <td>
        <input
          className={`${styles.sheetInput} ${styles.sheetNumber}`}
          type="number"
          min={0}
          step="any"
          value={String(item.actual)}
          aria-label={`Actual, row ${index + 1}`}
          onChange={(e) => numberChange(item.id, 'actual', e.target.value)}
          onFocus={(e) => e.target.select()}
        />
      </td>
      <td
        className={`${styles.sheetVariance} ${
          item.planned - item.actual < 0 ? styles.varOver : styles.varUnder
        }`}
      >
        {formatUsd(item.planned - item.actual)}
      </td>
      <td>
        <input
          className={styles.sheetInput}
          type="text"
          value={item.notes ?? ''}
          placeholder="Notes"
          aria-label={`Notes, row ${index + 1}`}
          onChange={(e) => updateItem(item.id, { notes: e.target.value || undefined })}
        />
      </td>
      <td>
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.moveButton}
            disabled={grouped || index === 0}
            aria-label={`Move row ${index + 1} up`}
            onClick={() => moveRow(item.id, -1)}
          >
            ↑
          </button>
          <button
            type="button"
            className={styles.moveButton}
            disabled={grouped || index === count - 1}
            aria-label={`Move row ${index + 1} down`}
            onClick={() => moveRow(item.id, 1)}
          >
            ↓
          </button>
          <button
            type="button"
            className={styles.removeButton}
            aria-label={`Delete row ${index + 1}`}
            onClick={() => removeRow(item.id)}
          >
            ×
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div>
      <button type="button" className={styles.backButton} onClick={onBack}>
        ← All budgets
      </button>

      <header className={styles.toolbar}>
        <div>
          <p className={styles.eyebrow}>
            {draft.kind === 'recurring' ? `Recurring · ${draft.period}` : 'Project budget'}
          </p>
          <h1 className={styles.title}>{draft.name}</h1>
        </div>
        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={() =>
              downloadCsv(
                `ByteFlow-budget-${draft.name.replace(/[^a-z0-9]+/gi, '-')}${draft.period ? `-${draft.period}` : ''}.csv`,
                budgetCsv(draft),
              )
            }
          >
            Export CSV
          </button>
          <form method="post" action="/api/internal-logout">
            <button type="submit" className={styles.ghostButton}>
              Log out
            </button>
          </form>
        </div>
      </header>

      <div className={styles.summaryStrip} aria-label="Budget summary">
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue}>{formatUsd(totals.planned)}</span>
          <span className={styles.summaryLabel}>planned</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue}>{formatUsd(totals.actual)}</span>
          <span className={styles.summaryLabel}>actual</span>
        </div>
        <div className={styles.summaryItem}>
          <span
            className={`${styles.summaryValue} ${
              totals.variance < 0 ? styles.varOver : styles.varUnder
            }`}
          >
            {formatUsd(totals.variance)}
          </span>
          <span className={styles.summaryLabel}>variance</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={`${styles.summaryValue} ${percentClass}`}>
            {totals.percentSpent === null ? '—' : `${Math.round(totals.percentSpent)}%`}
          </span>
          <span className={styles.summaryLabel}>
            spent{totals.percentSpent !== null && totals.percentSpent > 100 ? ' · over budget' : ''}
          </span>
        </div>
        {previousActual && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{formatUsd(previousActual.actual)}</span>
            <span className={styles.summaryLabel}>actual in {previousActual.period}</span>
          </div>
        )}
      </div>

      <div className={styles.sheetControls}>
        <label className={styles.hint} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={grouped}
            onChange={(e) => setGrouped(e.target.checked)}
          />
          Group by category with subtotals
        </label>
        <span
          className={saveState === 'error' ? styles.formError : styles.saveStatus}
          role={saveState === 'error' ? 'alert' : 'status'}
        >
          {saveState === 'saving' && 'Saving…'}
          {saveState === 'dirty' && 'Unsaved changes…'}
          {saveState === 'saved' && 'Saved'}
          {saveState === 'error' && (
            <>
              {saveError}{' '}
              <button type="button" className={styles.linkButton} onClick={() => void persistNow()}>
                Retry save
              </button>
            </>
          )}
        </span>
      </div>

      <datalist id="budget-categories">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div className={styles.sheetWrap}>
        <table className={styles.sheet}>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Description</th>
              <th scope="col" style={{ textAlign: 'right' }}>
                Planned
              </th>
              <th scope="col" style={{ textAlign: 'right' }}>
                Actual
              </th>
              <th scope="col" style={{ textAlign: 'right' }}>
                Variance
              </th>
              <th scope="col">Notes</th>
              <th scope="col" aria-label="Row actions" />
            </tr>
          </thead>
          <tbody>
            {draft.items.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.cellMuted} style={{ padding: 14 }}>
                  No line items yet — add the first row below (e.g. “Hosting”).
                </td>
              </tr>
            )}
            {!grouped &&
              draft.items.map((item, index) => itemRow(item, index, draft.items.length))}
            {grouped &&
              groupByCategory(draft.items).map((group) => (
                <FragmentRows
                  key={group.category}
                  group={group}
                  itemRow={(item) => {
                    const index = draft.items.findIndex((i) => i.id === item.id);
                    return itemRow(item, index, draft.items.length);
                  }}
                />
              ))}
            <tr className={styles.totalsRow}>
              <td colSpan={2}>Total</td>
              <td style={{ textAlign: 'right' }}>{formatUsd(totals.planned)}</td>
              <td style={{ textAlign: 'right' }}>{formatUsd(totals.actual)}</td>
              <td
                style={{ textAlign: 'right' }}
                className={totals.variance < 0 ? styles.varOver : styles.varUnder}
              >
                {formatUsd(totals.variance)}
              </td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
        <div className={styles.addRowBar}>
          <button type="button" className={styles.addButton} onClick={addRow}>
            ＋ Add row
          </button>
          {grouped && (
            <span className={styles.hint} style={{ marginLeft: 10 }}>
              Reordering is available in the flat view.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function FragmentRows({
  group,
  itemRow,
}: {
  group: ReturnType<typeof groupByCategory>[number];
  itemRow: (item: BudgetItem) => React.ReactNode;
}) {
  return (
    <>
      <tr className={styles.categoryHeaderRow}>
        <td colSpan={7}>{group.category}</td>
      </tr>
      {group.items.map((item) => itemRow(item))}
      <tr className={styles.subtotalRow}>
        <td colSpan={2}>Subtotal — {group.category}</td>
        <td style={{ textAlign: 'right' }}>{formatUsd(group.totals.planned)}</td>
        <td style={{ textAlign: 'right' }}>{formatUsd(group.totals.actual)}</td>
        <td
          style={{ textAlign: 'right' }}
          className={group.totals.variance < 0 ? styles.varOver : styles.varUnder}
        >
          {formatUsd(group.totals.variance)}
        </td>
        <td colSpan={2} />
      </tr>
    </>
  );
}
