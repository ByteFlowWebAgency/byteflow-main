import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// US Letter: 8.5in × 11in. Points (jsPDF) and CSS pixels (document layout at 96dpi).
const PAGE_WIDTH_PT = 612;
const PAGE_HEIGHT_PT = 792;
const DOC_WIDTH_PX = 816;
const PAGE_HEIGHT_PX = DOC_WIDTH_PX * (11 / 8.5); // 1056
// Capture at 2x for crisp text; the flat, light design compresses well as PNG.
const CAPTURE_SCALE = 2;
// Never cut a page shorter than this fraction of a full page just to keep a block whole —
// an oversized block gets a plain cut instead.
const MIN_PAGE_FILL = 0.25;
const PAPER_BG = '#f7f7fa';

/** Filesystem-safe fragment of the client name for the download filename. */
export function sanitizeFilePart(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9\-_]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'Draft';
}

/** Y offset of `el` relative to `root`, walking the offsetParent chain. */
function offsetTopWithin(el: HTMLElement, root: HTMLElement): number {
  let top = 0;
  let current: HTMLElement | null = el;
  while (current && current !== root) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return top;
}

/**
 * Choose page cut positions (in document CSS pixels). Blocks marked data-pdf-block are
 * kept whole: when one would straddle a page boundary, the cut moves up to that block's
 * top edge — unless doing so would leave the page shorter than MIN_PAGE_FILL, in which
 * case the block is simply cut (better a clean overflow than a mostly-empty page).
 */
export function computeCutPositions(
  totalHeight: number,
  pageHeight: number,
  blocks: { top: number; bottom: number }[],
): number[] {
  const cuts: number[] = [];
  let pageTop = 0;
  while (pageTop + pageHeight < totalHeight) {
    const idealCut = pageTop + pageHeight;
    let cut = idealCut;
    const straddler = blocks.find((b) => b.top < idealCut && b.bottom > idealCut);
    if (straddler && straddler.top > pageTop + pageHeight * MIN_PAGE_FILL) {
      cut = straddler.top;
    }
    cuts.push(cut);
    pageTop = cut;
  }
  return cuts;
}

/**
 * Capture the rendered proposal document DOM and download it as a paginated US Letter
 * PDF. The on-screen document is the single source of truth — the PDF is an exact
 * rasterized copy of it (text is not selectable; documented tradeoff per
 * 03-ARCHITECTURE.md / 06-PDF-EXPORT.md).
 */
export async function generateProposalPdf(
  documentNode: HTMLElement,
  clientName: string,
): Promise<void> {
  // Capture a detached clone at natural size inside an off-screen .bfScope wrapper so
  // the CSS custom properties still resolve and preview scrolling/shadows don't affect
  // the output.
  const wrapper = document.createElement('div');
  wrapper.className = 'bfScope';
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-10000px';
  wrapper.style.top = '0';
  wrapper.style.width = `${DOC_WIDTH_PX}px`;
  wrapper.style.zIndex = '-1';

  const clone = documentNode.cloneNode(true) as HTMLElement;
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  clone.style.margin = '0';
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(clone, {
      scale: CAPTURE_SCALE,
      backgroundColor: PAPER_BG,
      logging: false,
    });

    const totalHeightPx = clone.offsetHeight;
    const pxToCanvas = canvas.height / totalHeightPx;

    const blocks = Array.from(
      clone.querySelectorAll<HTMLElement>('[data-pdf-block]'),
    ).map((el) => {
      const top = offsetTopWithin(el, clone);
      return { top, bottom: top + el.offsetHeight };
    });

    const cuts = computeCutPositions(totalHeightPx, PAGE_HEIGHT_PX, blocks);
    const pageStarts = [0, ...cuts];

    const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
    const pageCanvas = document.createElement('canvas');
    const context = pageCanvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context unavailable');

    pageStarts.forEach((startPx, pageIndex) => {
      const endPx = Math.min(startPx + PAGE_HEIGHT_PX, totalHeightPx);
      const sliceHeightPx = endPx - startPx;

      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.round(PAGE_HEIGHT_PX * pxToCanvas);
      // Fill the full page with paper color so short last pages aren't transparent.
      context.fillStyle = PAPER_BG;
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      context.drawImage(
        canvas,
        0,
        Math.round(startPx * pxToCanvas),
        canvas.width,
        Math.round(sliceHeightPx * pxToCanvas),
        0,
        0,
        canvas.width,
        Math.round(sliceHeightPx * pxToCanvas),
      );

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(
        pageCanvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        PAGE_WIDTH_PT,
        PAGE_HEIGHT_PT,
      );
    });

    const datePart = new Date().toISOString().slice(0, 10);
    pdf.save(`ByteFlow-Proposal-${sanitizeFilePart(clientName)}-${datePart}.pdf`);
  } finally {
    wrapper.remove();
  }
}
