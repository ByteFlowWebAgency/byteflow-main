// The one shared renderer every integration point uses — no page-type-specific
// reimplementation (mega prompt: "components/background-designs/BackgroundLayer.tsx").
// Looks up designId in the registry and renders its SVG absolutely-positioned behind real
// content. Renders nothing when designId is unset/unknown, so every existing surface stays
// pixel-identical until a design is explicitly chosen.

import { getBackgroundDesign } from '@/lib/background-designs/registry';
import type { Theme } from '@/components/internal-tools/themes/themeTypes';

interface BackgroundLayerProps {
  designId: string | undefined;
  theme: Theme;
  /** The coordinate space the design's own math is written against — pass the surface's
   * canonical size (e.g. 816x1056 for a document page, 960x540 for a slide canvas). The
   * layer itself always fills its positioned parent via CSS, independent of these numbers. */
  width: number;
  height: number;
}

export default function BackgroundLayer({ designId, theme, width, height }: BackgroundLayerProps) {
  const design = getBackgroundDesign(designId);
  if (!design) return null;
  return (
    <div
      aria-hidden
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
      // The SVG string is entirely our own generated markup (registry.ts), never user
      // input — safe to inject directly.
      dangerouslySetInnerHTML={{ __html: design.renderSvg(theme, width, height) }}
    />
  );
}
