import type { Metadata } from 'next';
import SiteAuditApp from '@/components/internal-tools/site-audit/SiteAuditApp';

export const metadata: Metadata = {
  title: 'Site Audit · ByteFlow Internal',
  robots: { index: false, follow: false },
};

// Session-gated internal tool — always render per-request, never prerender.
export const dynamic = 'force-dynamic';

export default function SiteAuditPage() {
  return <SiteAuditApp />;
}
