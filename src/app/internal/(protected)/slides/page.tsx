import type { Metadata } from 'next';
import DecksListApp from '@/components/internal-tools/slides/DecksListApp';

export const metadata: Metadata = {
  title: 'Presentations · ByteFlow Internal',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function SlidesListPage() {
  return <DecksListApp />;
}
