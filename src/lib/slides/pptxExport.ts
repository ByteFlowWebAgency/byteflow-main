// Deck → real, editable .pptx. Entirely client-side (pptxgenjs runs in the browser, no
// server round-trip) — same "generate a real file, trigger download" pattern as the PDF
// export elsewhere in this suite. docs/slides/05-PPTX-EXPORT.md.

import PptxGenJS from 'pptxgenjs';
import type { Deck } from './types';
import type { Theme } from '@/components/internal-tools/themes/themeTypes';
import { defineDeckMaster } from './pptxMasters';
import { PPTX_GENERATORS } from './pptxGenerators';
import { sanitizeFilePart } from '@/components/internal-tools/pdf/generateDocumentPdf';

/** Build a PptxGenJS instance for the deck — does not download; callers may inspect/test it. */
export function buildDeckPptx(deck: Deck, theme: Theme): PptxGenJS {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'ByteFlow Solutions';
  pptx.title = deck.name;

  defineDeckMaster(pptx, theme);

  for (const slide of deck.slides) {
    const generator = PPTX_GENERATORS[slide.templateId];
    generator(pptx, slide, theme);
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
  const pptx = buildDeckPptx(deck, theme);
  await pptx.writeFile({ fileName: pptxFileName(deck) });
}
