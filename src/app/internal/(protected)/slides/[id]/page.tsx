import type { Metadata } from 'next';
import DeckEditorApp from '@/components/internal-tools/slides/DeckEditorApp';

export const metadata: Metadata = {
  title: 'Edit deck · ByteFlow Internal',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function SlideEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DeckEditorApp id={id} />;
}
