import type { Metadata } from 'next';
import BudgetsApp from '@/components/budgets/BudgetsApp';

export const metadata: Metadata = {
  title: 'Budgets · ByteFlow Internal',
  robots: { index: false, follow: false },
};

// Session-gated internal tool — always render per-request, never prerender.
export const dynamic = 'force-dynamic';

export default function BudgetsPage() {
  return <BudgetsApp />;
}
