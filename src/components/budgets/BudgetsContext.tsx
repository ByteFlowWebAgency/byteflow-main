'use client';

// Data layer for the Budgets screen — same shape as CrmContext: loads the full budget
// list once, exposes persist/remove that write through first and only update local
// state on success. Mounted once at the internal-tools layout (not per page visit) so
// navigating away and back reuses what's already loaded instead of re-querying Supabase.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createStore } from '@/lib/internal-tools/storage/client';
import type { Budget } from '@/lib/budgets/types';

const budgetStore = createStore<Budget>('budgets');

export interface BudgetsContextValue {
  budgets: Budget[];
  loading: boolean;
  /** Non-null when the initial load failed — the screen shows an error state, never an empty list. */
  loadError: string | null;
  reload: () => void;
  /** Persists the budget with updatedAt bumped to now; returns the record as stored. */
  persist: (budget: Budget) => Promise<Budget>;
  remove: (id: string) => Promise<void>;
}

const BudgetsContext = createContext<BudgetsContextValue | null>(null);

export function useBudgets(): BudgetsContextValue {
  const value = useContext(BudgetsContext);
  if (!value) throw new Error('useBudgets must be used inside BudgetsProvider');
  return value;
}

export function BudgetsProvider({ children }: { children: React.ReactNode }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadNonce, setLoadNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    budgetStore
      .list()
      .then((list) => {
        if (cancelled) return;
        setBudgets(list);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : 'Could not load budgets.',
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadNonce]);

  const reload = useCallback(() => setLoadNonce((n) => n + 1), []);

  const persist = useCallback(async (budget: Budget) => {
    const touched = { ...budget, updatedAt: new Date().toISOString() };
    await budgetStore.save(touched);
    setBudgets((list) =>
      list.some((b) => b.id === touched.id)
        ? list.map((b) => (b.id === touched.id ? touched : b))
        : [...list, touched],
    );
    return touched;
  }, []);

  const remove = useCallback(async (id: string) => {
    await budgetStore.remove(id);
    setBudgets((list) => list.filter((b) => b.id !== id));
  }, []);

  const value = useMemo<BudgetsContextValue>(
    () => ({ budgets, loading, loadError, reload, persist, remove }),
    [budgets, loading, loadError, reload, persist, remove],
  );

  return <BudgetsContext.Provider value={value}>{children}</BudgetsContext.Provider>;
}
