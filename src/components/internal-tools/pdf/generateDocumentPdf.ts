import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// US Letter: 8.5in × 11in. Points (jsPDF) and CSS pixels (document layout at 96dpi).
const PAGE_WIDTH_PT = 612;
const PAGE_HEIGHT_PT = 792;
const DOC_WIDTH_PX = 816;
const PAGE_HEIGHT_PX = DOC_WIDTH_PX * (11 / 8.5); // 1056
// Capture at 2x for crisp text. Pages embed as JPEG: jsPDF stores PNG pages nearly
// uncompressed (a 2-page doc came out ~20MB in QA); JPEG at 0.92 on the solid paper
// background keeps a 2-3 page proposal well under the 5MB target with no visible loss
// at normal zoom.
const CAPTURE_SCALE = 2;
const JPEG_QUALITY = 0.92;
// Never cut a page shorter than this fraction of a full page just to keep a block whole —
// an oversized block gets a plain cut instead.
const MIN_PAGE_FILL = 0.25;
// A heading this close above a cut would be orphaned at the page bottom — move the cut
// above the heading instead (data-pdf-keep-next elements).
const KEEP_NEXT_GAP_PX = 56;
// DOM offsets and canvas pixels can drift a px or two (rounding, capture scale). Cuts
// placed at a block's top edge back off by this much so the drift lands in inter-block
// whitespace instead of leaving a sliver of the next block on the previous page.
const CUT_SAFETY_PX = 6;
// Breathing room at the top of continuation pages, when the slice leaves space for it.
const CONTINUATION_TOP_PAD_PT = 20;
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

export interface BlockRange {
  top: number;
  bottom: number;
}

/**
 * Choose page cut positions (in document CSS pixels). Blocks marked data-pdf-block are
 * kept whole: when one would straddle a page boundary, the cut moves up to that block's
 * top edge — unless doing so would leave the page shorter than MIN_PAGE_FILL, in which
 * case the block is simply cut (better a clean overflow than a mostly-empty page).
 * Headings marked data-pdf-keep-next are never left orphaned at a page bottom: a cut
 * landing just under one moves above it. Pages then render start-to-cut, so a page that
 * breaks early is simply a little short at the bottom.
 *
 * `forcedBreaks` (offsets of data-pdf-break-before elements) FORCE an exact cut at that
 * position regardless of page fill — the mechanism behind the Document Builder's
 * sectionTitle pages and explicit pageBreak blocks. It is additive: with no forced breaks
 * (every existing tool) the result is byte-identical to the original algorithm.
 */
export function computeCutPositions(
  totalHeight: number,
  pageHeight: number,
  blocks: BlockRange[],
  keepNext: BlockRange[] = [],
  forcedBreaks: number[] = [],
): number[] {
  const cuts: number[] = [];
  const forced = [...forcedBreaks]
    .filter((f) => f > 0 && f < totalHeight)
    .sort((a, b) => a - b);
  let pageTop = 0;
  let forcedIdx = 0;
  // Cap iterations well above any real page count as a runaway guard.
  const maxPages = Math.ceil(totalHeight / (pageHeight * MIN_PAGE_FILL)) + forced.length + 2;
  for (let guard = 0; guard <= maxPages; guard++) {
    while (forcedIdx < forced.length && forced[forcedIdx] <= pageTop + 1) forcedIdx++;
    const nextForced = forcedIdx < forced.length ? forced[forcedIdx] : Infinity;
    const moreContent = pageTop + pageHeight < totalHeight;
    if (!moreContent && nextForced === Infinity) break;

    const idealCut = pageTop + pageHeight;
    let cut: number;
    if (nextForced <= idealCut) {
      // A forced break falls within this page — cut exactly there (element top = a real
      // page boundary; no min-fill, no safety backoff).
      cut = nextForced;
    } else {
      const minCut = pageTop + pageHeight * MIN_PAGE_FILL;
      cut = idealCut;
      const straddler = blocks.find((b) => b.top < cut && b.bottom > cut);
      if (straddler && straddler.top > minCut) {
        cut = straddler.top;
      }
      const orphan = keepNext.find((k) => cut > k.top && cut < k.bottom + KEEP_NEXT_GAP_PX);
      if (orphan && orphan.top > minCut) {
        cut = orphan.top;
      }
      if (cut !== idealCut) {
        cut = Math.max(minCut, cut - CUT_SAFETY_PX);
      }
    }
    if (cut <= pageTop || cut >= totalHeight) break; // no progress / past the end
    cuts.push(cut);
    pageTop = cut;
  }
  return cuts;
}

export interface GeneratePdfOptions {
  /**
   * Page background — fills short pages and shows behind transparent regions. Defaults
   * to the classic paper color; themed exports pass their theme's background so dark
   * documents never get light strips at page bottoms.
   */
  backgroundColor?: string;
}

/** One rasterized US Letter page, ready to embed in a PDF or show in an on-screen preview. */
export interface CapturedPage {
  dataUrl: string;
}

/**
 * Capture and paginate a document node into page images, using the exact same cut
 * algorithm as the PDF export. Shared by generateDocumentPdf (which embeds these pages
 * in a jsPDF and saves) and renderDocumentPreview (which hands them to an on-screen
 * modal) — so the preview a user sees is guaranteed pixel-identical to the download.
 */
async function capturePages(
  documentNode: HTMLElement,
  opts: GeneratePdfOptions = {},
): Promise<CapturedPage[]> {
  const pageBackground = opts.backgroundColor ?? PAPER_BG;
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
  // The export node may be a theme wrapper around the document sheet(s); the sheets
  // themselves are marked data-pdf-document and lose their preview chrome too.
  clone.querySelectorAll<HTMLElement>('[data-pdf-document]').forEach((sheet) => {
    sheet.style.boxShadow = 'none';
    sheet.style.borderRadius = '0';
    sheet.style.margin = '0';
  });
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    // html2canvas ignores CSS `filter` on images (e.g. the white-logo treatment on dark
    // themes), so bake any computed filter into the pixels first. Images without a
    // filter — every image on the classic path — are untouched.
    const filteredImages = Array.from(clone.querySelectorAll<HTMLImageElement>('img')).filter(
      (img) => {
        const { filter } = getComputedStyle(img);
        return filter !== '' && filter !== 'none';
      },
    );
    await Promise.all(
      filteredImages.map(async (img) => {
        try {
          await img.decode();
          const bake = document.createElement('canvas');
          bake.width = img.naturalWidth;
          bake.height = img.naturalHeight;
          const bakeContext = bake.getContext('2d');
          if (!bakeContext || bake.width === 0) return;
          bakeContext.filter = getComputedStyle(img).filter;
          bakeContext.drawImage(img, 0, 0);
          img.src = bake.toDataURL('image/png');
          img.style.filter = 'none';
        } catch {
          // Unbakeable image (undecodable, tainted): capture proceeds with the
          // unfiltered original rather than failing the whole export.
        }
      }),
    );

    const canvas = await html2canvas(clone, {
      scale: CAPTURE_SCALE,
      backgroundColor: pageBackground,
      logging: false,
    });

    const totalHeightPx = clone.offsetHeight;
    const pxToCanvas = canvas.height / totalHeightPx;

    const rangesOf = (selector: string): BlockRange[] =>
      Array.from(clone.querySelectorAll<HTMLElement>(selector)).map((el) => {
        const top = offsetTopWithin(el, clone);
        return { top, bottom: top + el.offsetHeight };
      });
    const blocks = rangesOf('[data-pdf-block]');
    const keepNext = rangesOf('[data-pdf-keep-next]');
    // Document Builder marks the top of each page-after-the-first and each pageBreak block
    // with data-pdf-break-before; those become forced page cuts. Empty for every other tool.
    const forcedBreaks = rangesOf('[data-pdf-break-before]').map((r) => r.top);

    const cuts = computeCutPositions(
      totalHeightPx,
      PAGE_HEIGHT_PX,
      blocks,
      keepNext,
      forcedBreaks,
    );
    const pageStarts = [0, ...cuts];
    const pageEnds = [...cuts, totalHeightPx];

    const pageCanvas = document.createElement('canvas');
    const context = pageCanvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context unavailable');

    return pageStarts.map((startPx, pageIndex) => {
      // Each page renders exactly [start, next cut) — a page that broke early at a block
      // boundary is a little short at the bottom, never overlapping the next page.
      const endPx = pageEnds[pageIndex];
      const sliceHeightPx = endPx - startPx;

      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.round(PAGE_HEIGHT_PX * pxToCanvas);
      // Fill the full page with the page background so short pages aren't transparent.
      context.fillStyle = pageBackground;
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      // Continuation pages get a little top padding when the slice leaves room for it.
      const sliceHeightPt = (sliceHeightPx / PAGE_HEIGHT_PX) * PAGE_HEIGHT_PT;
      const topPadPt =
        pageIndex === 0
          ? 0
          : Math.min(CONTINUATION_TOP_PAD_PT, PAGE_HEIGHT_PT - sliceHeightPt);
      const topPadCanvas = Math.round((topPadPt / PAGE_HEIGHT_PT) * PAGE_HEIGHT_PX * pxToCanvas);

      context.drawImage(
        canvas,
        0,
        Math.round(startPx * pxToCanvas),
        canvas.width,
        Math.round(sliceHeightPx * pxToCanvas),
        0,
        topPadCanvas,
        canvas.width,
        Math.round(sliceHeightPx * pxToCanvas),
      );

      return { dataUrl: pageCanvas.toDataURL('image/jpeg', JPEG_QUALITY) };
    });
  } finally {
    wrapper.remove();
  }
}

/**
 * Capture a rendered document DOM node and download it as a paginated US Letter PDF.
 * Shared by every internal tool (proposals, audits, …): the on-screen document is the
 * single source of truth and the PDF is an exact rasterized copy of it (text is not
 * selectable — documented tradeoff). Callers build their own `filename` (use
 * sanitizeFilePart for user-derived fragments); this function knows nothing about any
 * specific document type. Layout contract: elements marked data-pdf-block are never cut
 * across pages, and data-pdf-keep-next headings are never orphaned at a page bottom.
 */
export async function generateDocumentPdf(
  documentNode: HTMLElement,
  filename: string,
  opts: GeneratePdfOptions = {},
): Promise<void> {
  const pages = await capturePages(documentNode, opts);
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(page.dataUrl, 'JPEG', 0, 0, PAGE_WIDTH_PT, PAGE_HEIGHT_PT);
  });
  pdf.save(filename);
}

/**
 * Paginate a document node into on-screen preview images — the same page images that
 * generateDocumentPdf would embed in the download, minus the jsPDF/save step.
 */
export async function renderDocumentPreview(
  documentNode: HTMLElement,
  opts: GeneratePdfOptions = {},
): Promise<CapturedPage[]> {
  return capturePages(documentNode, opts);
}
