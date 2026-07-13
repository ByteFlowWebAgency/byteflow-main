// Factories for documents, pages, and blocks. IDs are crypto.randomUUID() throughout,
// consistent with earlier phases. Freshly-inserted blocks get minimal, editable defaults;
// bracketed placeholder copy belongs to TEMPLATES (templates.ts), not to these primitives.

import type { Pricing } from '@/lib/proposal-tool/types';
import type {
  Block,
  BlockType,
  BuiltDocument,
  CoverFields,
  DocumentPage,
  PageKind,
  SectionTitleFields,
} from './types';

export function newId(): string {
  return crypto.randomUUID();
}

/** A blank flat pricing block value — $0, no line items (no real data, per guardrails). */
export function defaultPricing(): Pricing {
  return { model: 'flat', totalAmount: 0, paymentSchedule: '[Payment schedule]' };
}

export function createBlock(type: BlockType): Block {
  const id = newId();
  switch (type) {
    case 'heading':
      return { id, type, level: 2, text: 'Section heading' };
    case 'titleBanner':
      return { id, type, eyebrow: 'EYEBROW', title: 'Section title', subtitle: '' };
    case 'richText':
      return { id, type, html: '<p>Start writing…</p>' };
    case 'image':
      return { id, type, dataUrl: '', caption: '', alt: '', width: 'full' };
    case 'table':
      return {
        id,
        type,
        header: ['Column 1', 'Column 2', 'Column 3'],
        rows: [
          ['', '', ''],
          ['', '', ''],
        ],
      };
    case 'divider':
      return { id, type };
    case 'spacer':
      return { id, type, size: 'medium' };
    case 'callout':
      return { id, type, html: '<p>Key takeaway…</p>' };
    case 'pricingTable':
      return { id, type, pricing: defaultPricing(), lineItems: [] };
    case 'keyValueList':
      return {
        id,
        type,
        items: [
          { id: newId(), label: 'Label', value: 'Value' },
          { id: newId(), label: 'Label', value: 'Value' },
        ],
      };
    case 'pageBreak':
      return { id, type };
    default: {
      // Exhaustiveness guard — a new BlockType must add a case above.
      const never: never = type;
      throw new Error(`Unknown block type: ${String(never)}`);
    }
  }
}

export function createContentPage(blocks: Block[] = []): DocumentPage {
  return { id: newId(), kind: 'content', blocks };
}

export function createClosingPage(blocks: Block[] = []): DocumentPage {
  return { id: newId(), kind: 'closing', blocks };
}

export function createCoverPage(fields?: Partial<CoverFields>): DocumentPage {
  return {
    id: newId(),
    kind: 'cover',
    blocks: [],
    coverFields: {
      title: '[Document title]',
      subtitle: '',
      clientName: '[Client name]',
      date: '',
      ...fields,
    },
  };
}

export function createSectionTitlePage(fields?: Partial<SectionTitleFields>): DocumentPage {
  return {
    id: newId(),
    kind: 'sectionTitle',
    blocks: [],
    sectionTitleFields: {
      eyebrow: '',
      title: 'Section',
      subtitle: '',
      ...fields,
    },
  };
}

export function createPage(kind: PageKind): DocumentPage {
  switch (kind) {
    case 'cover':
      return createCoverPage();
    case 'sectionTitle':
      return createSectionTitlePage();
    case 'closing':
      return createClosingPage();
    case 'content':
    default:
      return createContentPage();
  }
}

/** A blank document: one cover page with bracketed placeholders + one empty content page. */
export function createBlankDocument(name = 'Untitled document'): BuiltDocument {
  const now = new Date().toISOString();
  return {
    id: newId(),
    name,
    createdAt: now,
    updatedAt: now,
    themeId: 'classic',
    pages: [createCoverPage(), createContentPage()],
  };
}
