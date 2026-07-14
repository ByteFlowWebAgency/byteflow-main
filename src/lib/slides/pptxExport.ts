// Deck → real, editable .pptx. Entirely client-side (pptxgenjs runs in the browser, no
// server round-trip) — same "generate a real file, trigger download" pattern as the PDF
// export elsewhere in this suite. docs/slides/05-PPTX-EXPORT.md.

import PptxGenJS from 'pptxgenjs';
import type { Deck, Slide } from './types';
import type { Theme } from '@/components/internal-tools/themes/themeTypes';
import { defineDeckMaster, SLIDE_H, SLIDE_W } from './pptxMasters';
import { PPTX_GENERATORS } from './pptxGenerators';
import { sanitizeFilePart } from '@/components/internal-tools/pdf/generateDocumentPdf';
import { getBackgroundDesign } from '@/lib/background-designs/registry';
import { rasterizeBackgroundDesign } from '@/lib/background-designs/rasterize';

/** Only titleCover/sectionDivider/thankYouClosing ever carry a backgroundDesignId — every
 * other template's content type has no such field. */
function slideBackgroundDesignId(slide: Slide): string | undefined {
  if (slide.templateId === 'titleCover' || slide.templateId === 'sectionDivider' || slide.templateId === 'thankYouClosing') {
    return slide.content.backgroundDesignId;
  }
  return undefined;
}

/** ~150dpi at the slide's real inch dimensions — crisp enough for a full-bleed background
 * without an oversized embed. */
const BG_RASTER_W = Math.round(SLIDE_W * 150);
const BG_RASTER_H = Math.round(SLIDE_H * 150);

/** Build a PptxGenJS instance for the deck — does not download; callers may inspect/test it.
 * Async because any slide with a backgroundDesignId needs its design rasterized to a PNG
 * first (rasterize.ts is canvas/Image-based); rasterized designs are cached per designId so
 * a deck reusing the same design across several slides only rasterizes it once. */
export async function buildDeckPptx(deck: Deck, theme: Theme): Promise<PptxGenJS> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'ByteFlow Solutions';
  pptx.title = deck.name;

  defineDeckMaster(pptx, theme);

  const bgCache = new Map<string, string>();
  for (const slide of deck.slides) {
    const generator = PPTX_GENERATORS[slide.templateId];
    const designId = slideBackgroundDesignId(slide);
    let bgImage: string | undefined;
    if (designId) {
      if (!bgCache.has(designId)) {
        const design = getBackgroundDesign(designId);
        if (design) {
          const png = await rasterizeBackgroundDesign(design, theme, BG_RASTER_W, BG_RASTER_H);
          bgCache.set(designId, png);
        }
      }
      bgImage = bgCache.get(designId);
    }
    generator(pptx, slide, theme, bgImage);
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
