// One generator function per SlideTemplateId (25 total), each (pptx, slide, theme) => void,
// adding a new pptxgenjs slide off the shared master and laying out that template's fields.
// docs/slides/05-PPTX-EXPORT.md: keep each function focused on one template; every color/
// font routes through pptxColors.ts; bulleted content always uses `bullet: true`, never a
// typed bullet character.
//
// Naming note: `Slide` (from ./types) is OUR data type — one deck slide's stored content.
// pptxgenjs's own runtime slide object (returned by pptx.addSlide()) is aliased `PSlide`
// below so the two are never confused in this file.

import type PptxGenJS from 'pptxgenjs';
import type {
  AgendaContent,
  BigStatContent,
  BlankCustomContent,
  BulletListContent,
  CaseStudySummaryContent,
  ChartImageContent,
  ContactNextStepsContent,
  FaqContent,
  FullBleedImageContent,
  ImageAndTextContent,
  PricingInvestmentContent,
  ProblemStatementContent,
  ProcessStepsContent,
  RoadmapContent,
  SectionDividerContent,
  ServicesOverviewContent,
  Slide,
  SolutionOverviewContent,
  StatsGridContent,
  TeamIntroContent,
  TestimonialContent,
  ThankYouClosingContent,
  ThreeColumnContent,
  TimelineContent,
  TitleCoverContent,
  TwoColumnComparisonContent,
} from './types';
import type { Theme } from '@/components/internal-tools/themes/themeTypes';
import { computePricingTotal } from './pricing';
import { toPptxColor, pptxDisplayFont, pptxBodyFont } from './pptxColors';
import {
  BODY_BOTTOM,
  BODY_TOP,
  CONTENT_W,
  CONTENT_X,
  MARGIN,
  MASTER_NAME,
  SLIDE_H,
  SLIDE_W,
  TITLE_H,
  TITLE_Y,
} from './pptxMasters';

type PSlide = PptxGenJS.Slide;

// ---- shared layout helpers -----------------------------------------------------------------

function newSlide(pptx: PptxGenJS, theme: Theme): PSlide {
  const pSlide = pptx.addSlide({ masterName: MASTER_NAME });
  // Per-slide fill so a slide's own effective theme (deck theme, or this slide's own
  // themeId override) always wins over the shared master's base-theme background —
  // the master itself stays deck-theme-colored only for its logo/footer-brand/slide-
  // number chrome (see pptxMasters.ts's known-limitation note).
  pSlide.background = { color: toPptxColor(theme.colors.background) };
  return pSlide;
}

/** Adds the rasterized background-design PNG as a full-bleed image layer — must be called
 * before any other addText/addShape/addImage call on the slide, since pptxgenjs stacks
 * elements in call order (first added paints at the bottom). Only titleCover/
 * sectionDivider/thankYouClosing ever pass bgImage; every other generator never calls this. */
function addBackgroundImage(pSlide: PSlide, bgImage: string | undefined): void {
  if (!bgImage) return;
  pSlide.addImage({ data: bgImage, x: 0, y: 0, w: SLIDE_W, h: SLIDE_H });
}

function addTitle(pSlide: PSlide, theme: Theme, text: string): void {
  pSlide.addText(text, {
    x: CONTENT_X,
    y: TITLE_Y,
    w: CONTENT_W,
    h: TITLE_H,
    fontSize: 30,
    bold: true,
    color: toPptxColor(theme.colors.accent),
    fontFace: pptxDisplayFont(theme),
    align: 'left',
    valign: 'top',
    fit: 'shrink',
  });
}

function fgColor(theme: Theme): string {
  return toPptxColor(theme.colors.foreground);
}
function accentColor(theme: Theme): string {
  return toPptxColor(theme.colors.accent);
}
function mutedColor(theme: Theme): string {
  return toPptxColor(theme.colors.muted);
}

/** Bulleted block from a plain string array — always `bullet: true`, never a typed glyph. */
function addBulletList(
  pSlide: PSlide,
  items: string[],
  opts: { x: number; y: number; w: number; h: number; theme: Theme; fontSize?: number },
): void {
  if (items.length === 0) return;
  const runs: PptxGenJS.TextProps[] = items.map((text, i) => ({
    text,
    options: {
      bullet: true,
      breakLine: i < items.length - 1,
      fontSize: opts.fontSize ?? 15,
      color: fgColor(opts.theme),
      fontFace: pptxBodyFont(opts.theme),
    },
  }));
  pSlide.addText(runs, { x: opts.x, y: opts.y, w: opts.w, h: opts.h, valign: 'top' });
}

function addAccentRule(pptx: PptxGenJS, pSlide: PSlide, theme: Theme, y: number): void {
  pSlide.addShape(pptx.ShapeType.line, {
    x: CONTENT_X,
    y,
    w: CONTENT_W,
    h: 0,
    line: { color: accentColor(theme), width: 1.5 },
  });
}

/** Evenly split the content width into `count` equal columns, returning each column's x. */
function columnXs(count: number, gap = 0.4): number[] {
  const colW = columnW(count, gap);
  return Array.from({ length: count }, (_, i) => CONTENT_X + i * (colW + gap));
}

function columnW(count: number, gap = 0.4): number {
  return (CONTENT_W - gap * (count - 1)) / count;
}

/** Distribute `count` rows evenly between BODY_TOP and BODY_BOTTOM, returning each row's y/h. */
function rowSlots(count: number, top = BODY_TOP, bottom = BODY_BOTTOM, gap = 0.15) {
  const totalH = bottom - top;
  const h = (totalH - gap * (count - 1)) / count;
  return Array.from({ length: count }, (_, i) => ({ y: top + i * (h + gap), h }));
}

// ---- 1. titleCover ---------------------------------------------------------------------------

export function genTitleCover(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as TitleCoverContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  let y = 2.3;
  if (c.eyebrow) {
    pSlide.addText(c.eyebrow, {
      x: CONTENT_X,
      y,
      w: CONTENT_W,
      h: 0.4,
      fontSize: 13,
      bold: true,
      color: accentColor(theme),
      fontFace: pptxBodyFont(theme),
      charSpacing: 2,
    });
    y += 0.55;
  }
  pSlide.addText(c.title, {
    x: CONTENT_X,
    y,
    w: CONTENT_W,
    h: 1.3,
    fontSize: 40,
    bold: true,
    color: fgColor(theme),
    fontFace: pptxDisplayFont(theme),
    fit: 'shrink',
  });
  y += 1.4;
  if (c.subtitle) {
    pSlide.addText(c.subtitle, {
      x: CONTENT_X,
      y,
      w: CONTENT_W,
      h: 0.6,
      fontSize: 18,
      color: mutedColor(theme),
      fontFace: pptxBodyFont(theme),
    });
  }
  const bottomBits = [c.presentedTo && `Prepared for ${c.presentedTo}`, c.date].filter(Boolean).join('   ·   ');
  if (bottomBits) {
    pSlide.addText(bottomBits, {
      x: CONTENT_X,
      y: SLIDE_H - 1.1,
      w: CONTENT_W,
      h: 0.4,
      fontSize: 13,
      color: mutedColor(theme),
      fontFace: pptxBodyFont(theme),
    });
  }
}

// ---- 2. agenda --------------------------------------------------------------------------------

export function genAgenda(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as AgendaContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  const runs: PptxGenJS.TextProps[] = c.items.map((text, i) => ({
    text,
    options: {
      bullet: { type: 'number', numberStartAt: 1 },
      breakLine: i < c.items.length - 1,
      fontSize: 17,
      color: fgColor(theme),
      fontFace: pptxBodyFont(theme),
      paraSpaceAfter: 10,
    },
  }));
  pSlide.addText(runs, { x: CONTENT_X, y: BODY_TOP, w: CONTENT_W, h: BODY_BOTTOM - BODY_TOP, valign: 'top' });
}

// ---- 3. sectionDivider ------------------------------------------------------------------------

export function genSectionDivider(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as SectionDividerContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  pSlide.addText(c.title, {
    x: MARGIN,
    y: SLIDE_H / 2 - 1,
    w: SLIDE_W - MARGIN * 2,
    h: 1.4,
    fontSize: 36,
    bold: true,
    align: 'center',
    valign: 'middle',
    color: fgColor(theme),
    fontFace: pptxDisplayFont(theme),
    fit: 'shrink',
  });
  if (c.subtitle) {
    pSlide.addText(c.subtitle, {
      x: MARGIN,
      y: SLIDE_H / 2 + 0.5,
      w: SLIDE_W - MARGIN * 2,
      h: 0.6,
      fontSize: 16,
      align: 'center',
      color: accentColor(theme),
      fontFace: pptxBodyFont(theme),
    });
  }
}

// ---- 4. problemStatement ------------------------------------------------------------------------

export function genProblemStatement(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as ProblemStatementContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  pSlide.addText(c.body, {
    x: CONTENT_X,
    y: BODY_TOP,
    w: CONTENT_W,
    h: 1.4,
    fontSize: 16,
    color: fgColor(theme),
    fontFace: pptxBodyFont(theme),
    valign: 'top',
  });
  addBulletList(pSlide, c.points, { x: CONTENT_X, y: BODY_TOP + 1.6, w: CONTENT_W, h: BODY_BOTTOM - BODY_TOP - 1.6, theme });
}

// ---- 5. solutionOverview ------------------------------------------------------------------------

export function genSolutionOverview(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as SolutionOverviewContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  pSlide.addText(c.body, {
    x: CONTENT_X,
    y: BODY_TOP,
    w: CONTENT_W,
    h: 1.4,
    fontSize: 16,
    color: fgColor(theme),
    fontFace: pptxBodyFont(theme),
    valign: 'top',
  });
  addBulletList(pSlide, c.points, { x: CONTENT_X, y: BODY_TOP + 1.6, w: CONTENT_W, h: BODY_BOTTOM - BODY_TOP - 1.6, theme });
}

// ---- 6. threeColumn ------------------------------------------------------------------------------

export function genThreeColumn(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as ThreeColumnContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  const xs = columnXs(3);
  const w = columnW(3);
  c.columns.forEach((col, i) => {
    pSlide.addText(col.heading, {
      x: xs[i],
      y: BODY_TOP,
      w,
      h: 0.5,
      fontSize: 16,
      bold: true,
      color: accentColor(theme),
      fontFace: pptxDisplayFont(theme),
    });
    pSlide.addText(col.body, {
      x: xs[i],
      y: BODY_TOP + 0.6,
      w,
      h: BODY_BOTTOM - BODY_TOP - 0.6,
      fontSize: 14,
      color: fgColor(theme),
      fontFace: pptxBodyFont(theme),
      valign: 'top',
    });
  });
}

// ---- 7. twoColumnComparison ------------------------------------------------------------------

export function genTwoColumnComparison(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as TwoColumnComparisonContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  const xs = columnXs(2, 0.6);
  const w = columnW(2, 0.6);
  pSlide.addText(c.leftHeading, {
    x: xs[0],
    y: BODY_TOP,
    w,
    h: 0.5,
    fontSize: 16,
    bold: true,
    color: fgColor(theme),
    fontFace: pptxDisplayFont(theme),
  });
  addBulletList(pSlide, c.leftItems, { x: xs[0], y: BODY_TOP + 0.6, w, h: BODY_BOTTOM - BODY_TOP - 0.6, theme });
  pSlide.addShape(pptx.ShapeType.line, {
    x: SLIDE_W / 2,
    y: BODY_TOP,
    w: 0,
    h: BODY_BOTTOM - BODY_TOP,
    line: { color: mutedColor(theme), width: 0.75, transparency: 40 },
  });
  pSlide.addText(c.rightHeading, {
    x: xs[1],
    y: BODY_TOP,
    w,
    h: 0.5,
    fontSize: 16,
    bold: true,
    color: accentColor(theme),
    fontFace: pptxDisplayFont(theme),
  });
  addBulletList(pSlide, c.rightItems, { x: xs[1], y: BODY_TOP + 0.6, w, h: BODY_BOTTOM - BODY_TOP - 0.6, theme });
}

// ---- 8. processSteps ---------------------------------------------------------------------------

export function genProcessSteps(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as ProcessStepsContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  const count = c.steps.length;
  const xs = columnXs(count, 0.3);
  const w = columnW(count, 0.3);
  const badgeSize = 0.55;
  c.steps.forEach((step, i) => {
    pSlide.addShape(pptx.ShapeType.ellipse, {
      x: xs[i] + w / 2 - badgeSize / 2,
      y: BODY_TOP,
      w: badgeSize,
      h: badgeSize,
      fill: { color: accentColor(theme) },
      line: { type: 'none' },
    });
    pSlide.addText(String(step.number), {
      x: xs[i] + w / 2 - badgeSize / 2,
      y: BODY_TOP,
      w: badgeSize,
      h: badgeSize,
      align: 'center',
      valign: 'middle',
      fontSize: 16,
      bold: true,
      color: toPptxColor(theme.colors.background),
      fontFace: pptxDisplayFont(theme),
    });
    pSlide.addText(step.label, {
      x: xs[i],
      y: BODY_TOP + badgeSize + 0.25,
      w,
      h: 0.4,
      align: 'center',
      fontSize: 15,
      bold: true,
      color: fgColor(theme),
      fontFace: pptxDisplayFont(theme),
    });
    pSlide.addText(step.description, {
      x: xs[i],
      y: BODY_TOP + badgeSize + 0.7,
      w,
      h: BODY_BOTTOM - (BODY_TOP + badgeSize + 0.7),
      align: 'center',
      fontSize: 12,
      color: mutedColor(theme),
      fontFace: pptxBodyFont(theme),
      valign: 'top',
    });
  });
}

// ---- 9. timeline --------------------------------------------------------------------------------

export function genTimeline(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as TimelineContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  const rows = rowSlots(c.milestones.length, BODY_TOP, BODY_BOTTOM, 0.1);
  c.milestones.forEach((m, i) => {
    const row = rows[i];
    pSlide.addShape(pptx.ShapeType.ellipse, {
      x: CONTENT_X,
      y: row.y + row.h / 2 - 0.06,
      w: 0.12,
      h: 0.12,
      fill: { color: accentColor(theme) },
      line: { type: 'none' },
    });
    pSlide.addText(m.label, {
      x: CONTENT_X + 0.35,
      y: row.y,
      w: CONTENT_W - 2.2,
      h: row.h,
      fontSize: 14,
      color: fgColor(theme),
      fontFace: pptxBodyFont(theme),
      valign: 'middle',
    });
    pSlide.addText(m.date, {
      x: CONTENT_X + CONTENT_W - 1.8,
      y: row.y,
      w: 1.8,
      h: row.h,
      align: 'right',
      fontSize: 13,
      color: mutedColor(theme),
      fontFace: pptxBodyFont(theme),
      valign: 'middle',
    });
  });
}

// ---- 10. teamIntro ------------------------------------------------------------------------------

export function genTeamIntro(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as TeamIntroContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  const count = c.members.length;
  const xs = columnXs(count, 0.3);
  const w = columnW(count, 0.3);
  const photoSize = Math.min(w - 0.2, 1.4);
  c.members.forEach((member, i) => {
    let y = BODY_TOP;
    if (member.photoDataUrl) {
      pSlide.addImage({
        data: member.photoDataUrl,
        x: xs[i] + w / 2 - photoSize / 2,
        y,
        w: photoSize,
        h: photoSize,
        sizing: { type: 'cover', w: photoSize, h: photoSize },
      });
      y += photoSize + 0.25;
    }
    pSlide.addText(member.name, {
      x: xs[i],
      y,
      w,
      h: 0.4,
      align: 'center',
      fontSize: 15,
      bold: true,
      color: fgColor(theme),
      fontFace: pptxDisplayFont(theme),
    });
    pSlide.addText(member.role, {
      x: xs[i],
      y: y + 0.4,
      w,
      h: 0.35,
      align: 'center',
      fontSize: 12,
      color: accentColor(theme),
      fontFace: pptxBodyFont(theme),
    });
  });
}

// ---- 11. caseStudySummary -----------------------------------------------------------------------

export function genCaseStudySummary(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as CaseStudySummaryContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  const blocks: Array<[string, string]> = [
    ['Challenge', c.challenge],
    ['Approach', c.approach],
    ['Result', c.result],
  ];
  const rows = rowSlots(3, BODY_TOP, BODY_BOTTOM, 0.25);
  blocks.forEach(([label, body], i) => {
    const row = rows[i];
    pSlide.addText(label.toUpperCase(), {
      x: CONTENT_X,
      y: row.y,
      w: 2,
      h: row.h,
      fontSize: 13,
      bold: true,
      color: accentColor(theme),
      fontFace: pptxBodyFont(theme),
      charSpacing: 1,
      valign: 'top',
    });
    pSlide.addText(body, {
      x: CONTENT_X + 2.2,
      y: row.y,
      w: CONTENT_W - 2.2,
      h: row.h,
      fontSize: 14,
      color: fgColor(theme),
      fontFace: pptxBodyFont(theme),
      valign: 'top',
    });
  });
}

// ---- 12. testimonial ----------------------------------------------------------------------------

export function genTestimonial(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as TestimonialContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  pSlide.addText(`“${c.quote}”`, {
    x: MARGIN + 0.6,
    y: 1.6,
    w: SLIDE_W - (MARGIN + 0.6) * 2,
    h: 3.4,
    fontSize: 26,
    italic: true,
    align: 'center',
    valign: 'middle',
    color: fgColor(theme),
    fontFace: pptxDisplayFont(theme),
    fit: 'shrink',
  });
  pSlide.addText(c.attributionName, {
    x: MARGIN,
    y: 5.2,
    w: SLIDE_W - MARGIN * 2,
    h: 0.4,
    align: 'center',
    fontSize: 15,
    bold: true,
    color: accentColor(theme),
    fontFace: pptxBodyFont(theme),
  });
  pSlide.addText(c.attributionRole, {
    x: MARGIN,
    y: 5.6,
    w: SLIDE_W - MARGIN * 2,
    h: 0.4,
    align: 'center',
    fontSize: 13,
    color: mutedColor(theme),
    fontFace: pptxBodyFont(theme),
  });
}

// ---- 13. bigStat --------------------------------------------------------------------------------

export function genBigStat(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as BigStatContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  pSlide.addText(c.statNumber, {
    x: MARGIN,
    y: 1.9,
    w: SLIDE_W - MARGIN * 2,
    h: 2.4,
    align: 'center',
    valign: 'middle',
    fontSize: 96,
    bold: true,
    color: accentColor(theme),
    fontFace: pptxDisplayFont(theme),
    fit: 'shrink',
  });
  pSlide.addText(c.statLabel, {
    x: MARGIN,
    y: 4.4,
    w: SLIDE_W - MARGIN * 2,
    h: 0.5,
    align: 'center',
    fontSize: 18,
    color: fgColor(theme),
    fontFace: pptxBodyFont(theme),
  });
  if (c.supportingText) {
    pSlide.addText(c.supportingText, {
      x: MARGIN,
      y: 5.0,
      w: SLIDE_W - MARGIN * 2,
      h: 0.5,
      align: 'center',
      fontSize: 13,
      color: mutedColor(theme),
      fontFace: pptxBodyFont(theme),
    });
  }
}

// ---- 14. statsGrid ------------------------------------------------------------------------------

export function genStatsGrid(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as StatsGridContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  const count = c.stats.length;
  const xs = columnXs(count, 0.3);
  const w = columnW(count, 0.3);
  c.stats.forEach((stat, i) => {
    pSlide.addText(stat.number, {
      x: xs[i],
      y: BODY_TOP + 0.6,
      w,
      h: 1.2,
      align: 'center',
      fontSize: 44,
      bold: true,
      color: accentColor(theme),
      fontFace: pptxDisplayFont(theme),
      fit: 'shrink',
    });
    pSlide.addText(stat.label, {
      x: xs[i],
      y: BODY_TOP + 1.9,
      w,
      h: 0.6,
      align: 'center',
      fontSize: 14,
      color: fgColor(theme),
      fontFace: pptxBodyFont(theme),
    });
  });
}

// ---- 15. pricingInvestment ----------------------------------------------------------------------

export function genPricingInvestment(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as PricingInvestmentContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  const total = computePricingTotal(c.lineItems);
  const headerFill = accentColor(theme);
  const rowFg = fgColor(theme);
  const bg = toPptxColor(theme.colors.background);
  const rows: PptxGenJS.TableRow[] = [
    [
      { text: 'Item', options: { bold: true, color: bg, fill: { color: headerFill }, fontFace: pptxBodyFont(theme) } },
      {
        text: 'Amount',
        options: { bold: true, color: bg, fill: { color: headerFill }, align: 'right', fontFace: pptxBodyFont(theme) },
      },
    ],
    ...c.lineItems.map<PptxGenJS.TableRow>((item) => [
      { text: item.label, options: { color: rowFg, fontFace: pptxBodyFont(theme) } },
      { text: `$${item.amount.toLocaleString('en-US')}`, options: { color: rowFg, align: 'right', fontFace: pptxBodyFont(theme) } },
    ]),
    [
      { text: 'Total', options: { bold: true, color: accentColor(theme), fontFace: pptxDisplayFont(theme) } },
      {
        text: `$${total.toLocaleString('en-US')}`,
        options: { bold: true, color: accentColor(theme), align: 'right', fontFace: pptxDisplayFont(theme) },
      },
    ],
  ];
  pSlide.addTable(rows, {
    x: CONTENT_X,
    y: BODY_TOP,
    w: CONTENT_W,
    fontSize: 14,
    border: { type: 'solid', color: mutedColor(theme), pt: 0.5 },
    autoPage: false,
  });
  if (c.note) {
    pSlide.addText(c.note, {
      x: CONTENT_X,
      y: BODY_BOTTOM - 0.5,
      w: CONTENT_W,
      h: 0.5,
      fontSize: 12,
      italic: true,
      color: mutedColor(theme),
      fontFace: pptxBodyFont(theme),
    });
  }
}

// ---- 16. servicesOverview -----------------------------------------------------------------------

export function genServicesOverview(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as ServicesOverviewContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  const rows = rowSlots(c.services.length);
  c.services.forEach((service, i) => {
    const row = rows[i];
    pSlide.addText(service.name, {
      x: CONTENT_X,
      y: row.y,
      w: CONTENT_W,
      h: row.h * 0.45,
      fontSize: 15,
      bold: true,
      color: accentColor(theme),
      fontFace: pptxDisplayFont(theme),
      valign: 'top',
    });
    pSlide.addText(service.description, {
      x: CONTENT_X,
      y: row.y + row.h * 0.45,
      w: CONTENT_W,
      h: row.h * 0.55,
      fontSize: 13,
      color: fgColor(theme),
      fontFace: pptxBodyFont(theme),
      valign: 'top',
    });
  });
}

// ---- 17. fullBleedImage -------------------------------------------------------------------------

export function genFullBleedImage(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as FullBleedImageContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  if (c.imageDataUrl) {
    pSlide.addImage({
      data: c.imageDataUrl,
      x: 0,
      y: 0,
      w: SLIDE_W,
      h: SLIDE_H,
      sizing: { type: 'cover', w: SLIDE_W, h: SLIDE_H },
    });
  }
  if (c.caption) {
    pSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: SLIDE_H - 0.9,
      w: SLIDE_W,
      h: 0.9,
      fill: { color: '000000', transparency: 40 },
      line: { type: 'none' },
    });
    pSlide.addText(c.caption, {
      x: MARGIN,
      y: SLIDE_H - 0.8,
      w: SLIDE_W - MARGIN * 2,
      h: 0.6,
      fontSize: 13,
      color: 'FFFFFF',
      fontFace: pptxBodyFont(theme),
      valign: 'middle',
    });
  }
}

// ---- 18. imageAndText ---------------------------------------------------------------------------

export function genImageAndText(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as ImageAndTextContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  const imgW = CONTENT_W * 0.45;
  if (c.imageDataUrl) {
    pSlide.addImage({
      data: c.imageDataUrl,
      x: CONTENT_X,
      y: BODY_TOP - 0.4,
      w: imgW,
      h: BODY_BOTTOM - BODY_TOP + 0.4,
      sizing: { type: 'cover', w: imgW, h: BODY_BOTTOM - BODY_TOP + 0.4 },
    });
  }
  const textX = CONTENT_X + imgW + 0.5;
  const textW = CONTENT_W - imgW - 0.5;
  pSlide.addText(c.title, {
    x: textX,
    y: BODY_TOP - 0.4,
    w: textW,
    h: 0.7,
    fontSize: 22,
    bold: true,
    color: fgColor(theme),
    fontFace: pptxDisplayFont(theme),
  });
  pSlide.addText(c.body, {
    x: textX,
    y: BODY_TOP + 0.4,
    w: textW,
    h: BODY_BOTTOM - BODY_TOP - 0.4,
    fontSize: 14,
    color: fgColor(theme),
    fontFace: pptxBodyFont(theme),
    valign: 'top',
  });
}

// ---- 19. bulletList -----------------------------------------------------------------------------

export function genBulletList(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as BulletListContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  addBulletList(pSlide, c.bullets, { x: CONTENT_X, y: BODY_TOP, w: CONTENT_W, h: BODY_BOTTOM - BODY_TOP, theme, fontSize: 16 });
}

// ---- 20. chartImage -----------------------------------------------------------------------------

export function genChartImage(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as ChartImageContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  const chartH = c.caption ? BODY_BOTTOM - BODY_TOP - 0.5 : BODY_BOTTOM - BODY_TOP;
  if (c.chartImageDataUrl) {
    pSlide.addImage({
      data: c.chartImageDataUrl,
      x: CONTENT_X,
      y: BODY_TOP,
      w: CONTENT_W,
      h: chartH,
      sizing: { type: 'contain', w: CONTENT_W, h: chartH },
    });
  }
  if (c.caption) {
    pSlide.addText(c.caption, {
      x: CONTENT_X,
      y: BODY_BOTTOM - 0.4,
      w: CONTENT_W,
      h: 0.4,
      align: 'center',
      fontSize: 12,
      italic: true,
      color: mutedColor(theme),
      fontFace: pptxBodyFont(theme),
    });
  }
}

// ---- 21. faq ------------------------------------------------------------------------------------

export function genFaq(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as FaqContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  const rows = rowSlots(c.qaPairs.length, BODY_TOP, BODY_BOTTOM, 0.15);
  c.qaPairs.forEach((qa, i) => {
    const row = rows[i];
    pSlide.addText(qa.question, {
      x: CONTENT_X,
      y: row.y,
      w: CONTENT_W,
      h: row.h * 0.4,
      fontSize: 14,
      bold: true,
      color: accentColor(theme),
      fontFace: pptxBodyFont(theme),
      valign: 'top',
    });
    pSlide.addText(qa.answer, {
      x: CONTENT_X,
      y: row.y + row.h * 0.4,
      w: CONTENT_W,
      h: row.h * 0.6,
      fontSize: 13,
      color: fgColor(theme),
      fontFace: pptxBodyFont(theme),
      valign: 'top',
    });
  });
}

// ---- 22. roadmap --------------------------------------------------------------------------------

export function genRoadmap(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as RoadmapContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  const count = c.phases.length;
  const xs = columnXs(count, 0.3);
  const w = columnW(count, 0.3);
  c.phases.forEach((phase, i) => {
    pSlide.addShape(pptx.ShapeType.rect, {
      x: xs[i],
      y: BODY_TOP,
      w,
      h: 0.08,
      fill: { color: accentColor(theme) },
      line: { type: 'none' },
    });
    pSlide.addText(phase.label, {
      x: xs[i],
      y: BODY_TOP + 0.25,
      w,
      h: 0.45,
      fontSize: 15,
      bold: true,
      color: fgColor(theme),
      fontFace: pptxDisplayFont(theme),
      valign: 'top',
    });
    pSlide.addText(phase.description, {
      x: xs[i],
      y: BODY_TOP + 0.75,
      w,
      h: BODY_BOTTOM - (BODY_TOP + 0.75),
      fontSize: 13,
      color: mutedColor(theme),
      fontFace: pptxBodyFont(theme),
      valign: 'top',
    });
  });
}

// ---- 23. contactNextSteps -----------------------------------------------------------------------

export function genContactNextSteps(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as ContactNextStepsContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  const lines = [c.contactName, c.email, c.phone, c.website].filter(Boolean) as string[];
  const runs: PptxGenJS.TextProps[] = lines.map((text, i) => ({
    text,
    options: {
      breakLine: true,
      bold: i === 0,
      fontSize: i === 0 ? 18 : 14,
      color: i === 0 ? fgColor(theme) : mutedColor(theme),
      fontFace: pptxBodyFont(theme),
    },
  }));
  pSlide.addText(runs, { x: CONTENT_X, y: BODY_TOP, w: CONTENT_W * 0.55, h: 2.4, valign: 'top' });
  if (c.nextStepNote) {
    pSlide.addShape(pptx.ShapeType.rect, {
      x: CONTENT_X,
      y: BODY_TOP + 2.6,
      w: CONTENT_W,
      h: 1.1,
      fill: { color: accentColor(theme), transparency: 88 },
      line: { color: accentColor(theme), width: 1 },
    });
    pSlide.addText(c.nextStepNote, {
      x: CONTENT_X + 0.25,
      y: BODY_TOP + 2.6,
      w: CONTENT_W - 0.5,
      h: 1.1,
      fontSize: 14,
      color: fgColor(theme),
      fontFace: pptxBodyFont(theme),
      valign: 'middle',
    });
  }
}

// ---- 24. thankYouClosing ------------------------------------------------------------------------

export function genThankYouClosing(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as ThankYouClosingContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  pSlide.addText(c.title, {
    x: MARGIN,
    y: SLIDE_H / 2 - 1,
    w: SLIDE_W - MARGIN * 2,
    h: 1.4,
    align: 'center',
    valign: 'middle',
    fontSize: 40,
    bold: true,
    color: fgColor(theme),
    fontFace: pptxDisplayFont(theme),
    fit: 'shrink',
  });
  if (c.subtitle) {
    pSlide.addText(c.subtitle, {
      x: MARGIN,
      y: SLIDE_H / 2 + 0.5,
      w: SLIDE_W - MARGIN * 2,
      h: 0.6,
      align: 'center',
      fontSize: 16,
      color: accentColor(theme),
      fontFace: pptxBodyFont(theme),
    });
  }
}

// ---- 25. blankCustom ----------------------------------------------------------------------------

export function genBlankCustom(pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string): void {
  const c = slide.content as BlankCustomContent;
  const pSlide = newSlide(pptx, theme);
  addBackgroundImage(pSlide, bgImage);
  addTitle(pSlide, theme, c.title);
  pSlide.addText(c.freeText, {
    x: CONTENT_X,
    y: BODY_TOP,
    w: CONTENT_W,
    h: BODY_BOTTOM - BODY_TOP,
    fontSize: 15,
    color: fgColor(theme),
    fontFace: pptxBodyFont(theme),
    valign: 'top',
  });
}

// ---- dispatch table -----------------------------------------------------------------------------

export const PPTX_GENERATORS: Record<
  Slide['templateId'],
  (pptx: PptxGenJS, slide: Slide, theme: Theme, bgImage?: string) => void
> = {
  titleCover: genTitleCover,
  agenda: genAgenda,
  sectionDivider: genSectionDivider,
  problemStatement: genProblemStatement,
  solutionOverview: genSolutionOverview,
  threeColumn: genThreeColumn,
  twoColumnComparison: genTwoColumnComparison,
  processSteps: genProcessSteps,
  timeline: genTimeline,
  teamIntro: genTeamIntro,
  caseStudySummary: genCaseStudySummary,
  testimonial: genTestimonial,
  bigStat: genBigStat,
  statsGrid: genStatsGrid,
  pricingInvestment: genPricingInvestment,
  servicesOverview: genServicesOverview,
  fullBleedImage: genFullBleedImage,
  imageAndText: genImageAndText,
  bulletList: genBulletList,
  chartImage: genChartImage,
  faq: genFaq,
  roadmap: genRoadmap,
  contactNextSteps: genContactNextSteps,
  thankYouClosing: genThankYouClosing,
  blankCustom: genBlankCustom,
};
