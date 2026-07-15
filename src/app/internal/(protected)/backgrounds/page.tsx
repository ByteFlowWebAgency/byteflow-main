import type { Metadata } from 'next';
import BackgroundsGalleryApp from '@/components/background-designs/BackgroundsGalleryApp';

export const metadata: Metadata = {
  title: 'Background Designs · ByteFlow Internal',
  robots: { index: false, follow: false },
};

// Session-gated internal tool — always render per-request, never prerender.
export const dynamic = 'force-dynamic';

export default function BackgroundsPage() {
  return <BackgroundsGalleryApp />;
}
