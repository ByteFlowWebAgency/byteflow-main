// Budget tracker data model, verbatim from 04-BUDGET-TRACKER.md. Persists through the
// same storage adapter as the CRM (createStore<Budget>('budgets')) and is covered by
// the shared full backup/restore.

export type BudgetKind = 'project' | 'recurring'; // a client project's budget, or an
// ongoing bucket like "ByteFlow monthly ops"

export interface BudgetItem {
  id: string;
  category: string; // free text with autocomplete from categories already used here
  description: string;
  planned: number; // USD
  actual: number; // USD, defaults 0
  notes?: string;
}

export interface Budget {
  id: string;
  name: string; // "SCCoC rebuild budget", "Q3 ops"
  kind: BudgetKind;
  period?: string; // for recurring: "2026-07" style month key; omitted for project
  items: BudgetItem[];
  createdAt: string;
  updatedAt: string;
}
