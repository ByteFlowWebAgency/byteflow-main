import type { Metadata } from 'next';
import CrmApp from '@/components/crm/CrmApp';
import { getServiceOptions } from '@/lib/internal-tools/serviceOptions';

export const metadata: Metadata = {
  title: 'CRM · ByteFlow Internal',
  robots: { index: false, follow: false },
};

// Session-gated internal tool — always render per-request, never prerender.
export const dynamic = 'force-dynamic';

export default async function CrmPage() {
  const serviceOptions = await getServiceOptions();
  return <CrmApp serviceOptions={serviceOptions} />;
}
