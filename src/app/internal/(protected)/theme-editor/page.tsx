import type { Metadata } from 'next';
import ThemeEditorApp from '@/components/internal-tools/theme-editor/ThemeEditorApp';

export const metadata: Metadata = {
  title: 'Theme Editor · ByteFlow Internal',
  robots: { index: false, follow: false },
};

// Session-gated internal tool — always render per-request, never prerender.
export const dynamic = 'force-dynamic';

export default function ThemeEditorPage() {
  return <ThemeEditorApp />;
}
