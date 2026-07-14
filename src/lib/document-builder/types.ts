// Document Builder data model (phase 4). Discriminated unions on `type`/`kind`, same
// conventions as the proposal/audit tools. A document is a list of pages; a page is a
// list of typed blocks (except cover/sectionTitle pages, which carry title fields only).
//
// The theme owns all color and type — blocks never carry color/font overrides. That
// separation is what keeps every built document on-brand (see 00-GUARDRAILS.md).

import type { Pricing, LineItem } from '@/lib/internal-tools/pricing';

export type BlockType =
  | 'heading'
  | 'titleBanner'
  | 'richText'
  | 'image'
  | 'table'
  | 'divider'
  | 'spacer'
  | 'callout'
  | 'pricingTable'
  | 'keyValueList'
  | 'pageBreak';

export interface BlockBase {
  id: string;
  type: BlockType;
}

/** Section heading within a content page, level 1–3. */
export interface HeadingBlock extends BlockBase {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
}

/**
 * A strong section-header moment WITHIN a content page — eyebrow label (e.g.
 * "INVESTMENT"), big title, optional subtitle, themed accent rule. Distinct from a full
 * sectionTitle page: use this for a strong header without spending a whole page on it.
 */
export interface TitleBannerBlock extends BlockBase {
  type: 'titleBanner';
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

/** Rich text stored as sanitized HTML restricted to: p, strong, em, a, ul, ol, li, br. */
export interface RichTextBlock extends BlockBase {
  type: 'richText';
  html: string;
}

/** Client-side data-URL image (FileReader, same as audit screenshots). */
export interface ImageBlock extends BlockBase {
  type: 'image';
  dataUrl: string;
  caption?: string;
  alt?: string;
  width: 'full' | 'half';
}

/** Header row + body rows of plain-text cells. Rectangular (every row === header length). */
export interface TableBlock extends BlockBase {
  type: 'table';
  header: string[];
  rows: string[][];
}

/** Themed horizontal rule. */
export interface DividerBlock extends BlockBase {
  type: 'divider';
}

/** Vertical space. */
export interface SpacerBlock extends BlockBase {
  type: 'spacer';
  size: 'small' | 'medium' | 'large';
}

/** Accent-styled box with rich text — for key takeaways/quotes. */
export interface CalloutBlock extends BlockBase {
  type: 'callout';
  html: string;
}

/**
 * Reuses the proposal tool's LineItem shape + totals math (imported, never duplicated —
 * see 05). The renderer computes totals via calculateTotals(); this block only stores the
 * inputs.
 */
export interface PricingTableBlock extends BlockBase {
  type: 'pricingTable';
  pricing: Pricing;
  lineItems: LineItem[];
}

/** Label/value pairs — for "Project: X / Timeline: Y / Budget: Z" summaries. */
export interface KeyValueRow {
  id: string;
  label: string;
  value: string;
}
export interface KeyValueListBlock extends BlockBase {
  type: 'keyValueList';
  items: KeyValueRow[];
}

/** Explicit break — content after it starts on a new printed page. */
export interface PageBreakBlock extends BlockBase {
  type: 'pageBreak';
}

export type Block =
  | HeadingBlock
  | TitleBannerBlock
  | RichTextBlock
  | ImageBlock
  | TableBlock
  | DividerBlock
  | SpacerBlock
  | CalloutBlock
  | PricingTableBlock
  | KeyValueListBlock
  | PageBreakBlock;

/**
 * "sectionTitle" is a full-page divider usable ANYWHERE in the document, as many times as
 * wanted — not just at the front like the cover. It reuses CoverPage's visual family but
 * carries only eyebrow/title/subtitle (no client/date), since it marks a section break
 * ("Our Approach", "Investment"), not the opening of the whole document. "closing" pages
 * are a block list with a themed footer treatment.
 */
export type PageKind = 'cover' | 'sectionTitle' | 'content' | 'closing';

export interface CoverFields {
  title: string;
  subtitle?: string;
  clientName?: string;
  date?: string;
}
export interface SectionTitleFields {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}

export interface DocumentPage {
  id: string;
  kind: PageKind;
  /** Empty for kind === "cover" | "sectionTitle". */
  blocks: Block[];
  coverFields?: CoverFields;
  sectionTitleFields?: SectionTitleFields;
}

export interface BuiltDocument {
  id: string;
  /** Internal name shown in the documents list. */
  name: string;
  createdAt: string;
  updatedAt: string;
  /** Same convention as ProposalData/AuditData; deleted theme falls back to "classic". */
  themeId: string;
  /** Any number of pages, in any order — length and structure are never fixed. */
  pages: DocumentPage[];
  /** Which template it was created from, if any (informational). */
  templateId?: string;
}

/** The eleven insertable block types, in the order the block picker offers them. */
export const BLOCK_TYPES: readonly BlockType[] = [
  'heading',
  'richText',
  'titleBanner',
  'callout',
  'keyValueList',
  'table',
  'pricingTable',
  'image',
  'divider',
  'spacer',
  'pageBreak',
];

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: 'Heading',
  titleBanner: 'Title banner',
  richText: 'Text',
  image: 'Image',
  table: 'Table',
  divider: 'Divider',
  spacer: 'Spacer',
  callout: 'Callout',
  pricingTable: 'Pricing table',
  keyValueList: 'Key / value list',
  pageBreak: 'Page break',
};

export const PAGE_KIND_LABELS: Record<PageKind, string> = {
  cover: 'Cover',
  sectionTitle: 'Section title',
  content: 'Content',
  closing: 'Closing',
};
