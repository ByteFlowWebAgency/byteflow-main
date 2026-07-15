import type { Metadata } from 'next';
import DocumentEditorApp from '@/components/internal-tools/document-builder/DocumentEditorApp';

export const metadata: Metadata = {
  title: 'Edit document · ByteFlow Internal',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function DocumentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocumentEditorApp id={id} />;
}
