import type { Metadata } from 'next';
import CrmApp from '@/components/crm/CrmApp';

export const metadata: Metadata = {
  title: 'CRM · ByteFlow Internal',
  robots: { index: false, follow: false },
};

// Session-gated internal tool — always render per-request, never prerender.
export const dynamic = 'force-dynamic';

// CrmProvider (and its serviceOptions) is mounted once at the internal-tools layout —
// see (protected)/layout.tsx — so data survives navigating away and back.
export default function CrmPage() {
  return <CrmApp />;
}
