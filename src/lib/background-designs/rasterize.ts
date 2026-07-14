// Rasterizes a BackgroundDesign's SVG to a PNG data URL — used exclusively by the PPTX
// export path (pptxExport.ts / pptxGenerators.ts). pptxgenjs can't reliably render
// arbitrary blurred/gradient SVGs as native shapes, so a full-bleed background IMAGE layer
// is the robust choice there; the live preview and PDF export paths render the same design
// as a real SVG DOM node via BackgroundLayer instead, no rasterization needed. Browser-only
// (canvas + Image) — never invoked during SSR.

import type { Theme } from '@/components/internal-tools/themes/themeTypes';
import type { BackgroundDesign } from './types';

export function rasterizeBackgroundDesign(
  design: BackgroundDesign,
  theme: Theme,
  widthPx: number,
  heightPx: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const svg = design.renderSvg(theme, widthPx, heightPx);
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = widthPx;
      canvas.height = heightPx;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable.'));
        return;
      }
      // Explicit destination size — draws to exactly widthPx×heightPx regardless of how
      // the browser reports the SVG's own intrinsic size for a width="100%" root.
      ctx.drawImage(img, 0, 0, widthPx, heightPx);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error(`Failed to rasterize background design "${design.id}".`));
    img.src = svgDataUrl;
  });
}
