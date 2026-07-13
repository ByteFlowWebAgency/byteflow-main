import type { Metadata } from 'next';
import AuditToolApp from '@/components/audit-tool/AuditToolApp';

export const metadata: Metadata = {
  title: 'Site Audits · ByteFlow Internal',
  robots: { index: false, follow: false },
};

// Session-gated internal tool — always render per-request, never prerender.
export const dynamic = 'force-dynamic';

export default function AuditToolPage() {
  return <AuditToolApp />;
}
