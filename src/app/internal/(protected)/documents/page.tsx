import type { Metadata } from 'next';
import DocumentsListApp from '@/components/internal-tools/document-builder/DocumentsListApp';

export const metadata: Metadata = {
  title: 'Documents · ByteFlow Internal',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function DocumentsPage() {
  return <DocumentsListApp />;
}
