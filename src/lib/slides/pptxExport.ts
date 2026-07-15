// Deck → real, editable .pptx. Entirely client-side (pptxgenjs runs in the browser, no
// server round-trip) — same "generate a real file, trigger download" pattern as the PDF
// export elsewhere in this suite. docs/slides/05-PPTX-EXPORT.md.

import PptxGenJS from 'pptxgenjs';
import type { Deck } from './types';
import type { Theme } from '@/components/internal-tools/themes/themeTypes';
import { resolveEffectiveTheme } from '@/components/internal-tools/themes/themeStorage';
import { defineDeckMaster, SLIDE_H, SLIDE_W } from './pptxMasters';
import { PPTX_GENERATORS } from './pptxGenerators';
import { sanitizeFilePart } from '@/components/internal-tools/pdf/generateDocumentPdf';
import { getBackgroundDesign } from '@/lib/background-designs/registry';
import { rasterizeBackgroundDesign } from '@/lib/background-designs/rasterize';

/** ~150dpi at the slide's real inch dimensions — crisp enough for a full-bleed background
 * without an oversized embed. */
const BG_RASTER_W = Math.round(SLIDE_W * 150);
const BG_RASTER_H = Math.round(SLIDE_H * 150);

/** Build a PptxGenJS instance for the deck — does not download; callers may inspect/test it.
 * Async because any slide with a backgroundDesignId needs its design rasterized to a PNG
 * first (rasterize.ts is canvas/Image-based); rasterized designs are cached per (designId,
 * effective theme id) pair so a deck reusing the same design+theme combination across
 * several slides only rasterizes it once — a design recolors per its slide's own effective
 * theme, so the same designId under two different theme overrides needs two renders. */
export async function buildDeckPptx(deck: Deck, theme: Theme): Promise<PptxGenJS> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'ByteFlow Solutions';
  pptx.title = deck.name;

  // The shared master's own chrome (logo, footer-brand, slide-number) stays keyed to the
  // deck's base theme — a per-slide theme override recolors that slide's real content
  // (text/shapes/background) via newSlide()'s explicit per-slide background fill and each
  // generator's own color calls, not by redefining the master (see pptxMasters.ts).
  defineDeckMaster(pptx, theme);

  const bgCache = new Map<string, string>();
  for (const slide of deck.slides) {
    const generator = PPTX_GENERATORS[slide.templateId];
    const { theme: effectiveTheme } = resolveEffectiveTheme(slide.themeId, theme);
    let bgImage: string | undefined;
    if (slide.backgroundDesignId) {
      const cacheKey = `${slide.backgroundDesignId}::${effectiveTheme.id}`;
      if (!bgCache.has(cacheKey)) {
        const design = getBackgroundDesign(slide.backgroundDesignId);
        if (design) {
          const png = await rasterizeBackgroundDesign(design, effectiveTheme, BG_RASTER_W, BG_RASTER_H);
          bgCache.set(cacheKey, png);
        }
      }
      bgImage = bgCache.get(cacheKey);
    }
    generator(pptx, slide, effectiveTheme, bgImage);
  }

  return pptx;
}

function pptxFileName(deck: Deck): string {
  const date = new Date().toISOString().slice(0, 10);
  const namePart = sanitizeFilePart(deck.name) || 'deck';
  return `${namePart}-${date}.pptx`;
}

/** Build and trigger a browser download of the deck as a real, editable .pptx. */
export async function downloadDeckPptx(deck: Deck, theme: Theme): Promise<void> {
  const pptx = await buildDeckPptx(deck, theme);
  await pptx.writeFile({ fileName: pptxFileName(deck) });
}
