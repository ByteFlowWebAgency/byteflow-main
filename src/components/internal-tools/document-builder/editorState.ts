// Pure reducer for the Document Builder editor. No React, no storage — the app layer
// owns loading/autosaving; this only transforms one BuiltDocument into the next and stamps
// updatedAt. Every structural mutation the editor needs is one action here.

import { newId } from '@/lib/document-builder/defaults';
import { createCoverPage, createPage } from '@/lib/document-builder/defaults';
import type {
  Block,
  BuiltDocument,
  CoverFields,
  DocumentPage,
  BlockType,
  PageKind,
  SectionTitleFields,
} from '@/lib/document-builder/types';
import { createBlock } from '@/lib/document-builder/defaults';

export type EditorAction =
  | { t: 'setName'; name: string }
  | { t: 'setTheme'; themeId: string }
  | { t: 'toggleCover' }
  | { t: 'addPage'; kind: PageKind; at: number; fields?: Partial<SectionTitleFields> }
  | { t: 'movePage'; index: number; dir: -1 | 1 }
  | { t: 'duplicatePage'; index: number }
  | { t: 'deletePage'; index: number }
  | { t: 'updateCoverFields'; pageId: string; fields: Partial<CoverFields> }
  | { t: 'updateSectionFields'; pageId: string; fields: Partial<SectionTitleFields> }
  | { t: 'updatePageMeta'; pageId: string; backgroundDesignId?: string; themeId?: string }
  | { t: 'addBlock'; pageId: string; blockType: BlockType; at: number }
  | { t: 'updateBlock'; pageId: string; block: Block }
  | { t: 'moveBlock'; pageId: string; index: number; dir: -1 | 1 }
  | { t: 'duplicateBlock'; pageId: string; index: number }
  | { t: 'deleteBlock'; pageId: string; index: number }
  | { t: 'replaceDoc'; doc: BuiltDocument };

/** Deep-clone a block with a fresh id (and fresh ids for any id-bearing children). */
export function cloneBlockFresh(block: Block): Block {
  const copy = structuredClone(block);
  copy.id = newId();
  if (copy.type === 'keyValueList') {
    copy.items = copy.items.map((it) => ({ ...it, id: newId() }));
  }
  if (copy.type === 'pricingTable') {
    copy.lineItems = copy.lineItems.map((it) => ({ ...it, id: newId() }));
  }
  return copy;
}

/** Deep-clone a page with fresh ids throughout (page + every block). */
export function clonePageFresh(page: DocumentPage): DocumentPage {
  return {
    ...structuredClone(page),
    id: newId(),
    blocks: page.blocks.map(cloneBlockFresh),
  };
}

function mapPage(
  doc: BuiltDocument,
  pageId: string,
  fn: (page: DocumentPage) => DocumentPage,
): DocumentPage[] {
  return doc.pages.map((p) => (p.id === pageId ? fn(p) : p));
}

function withPages(doc: BuiltDocument, pages: DocumentPage[]): BuiltDocument {
  return { ...doc, pages, updatedAt: new Date().toISOString() };
}

export function editorReducer(doc: BuiltDocument, action: EditorAction): BuiltDocument {
  switch (action.t) {
    case 'setName':
      return { ...doc, name: action.name, updatedAt: new Date().toISOString() };

    case 'setTheme':
      return { ...doc, themeId: action.themeId, updatedAt: new Date().toISOString() };

    case 'toggleCover': {
      const hasCover = doc.pages[0]?.kind === 'cover';
      const pages = hasCover ? doc.pages.slice(1) : [createCoverPage(), ...doc.pages];
      return withPages(doc, pages);
    }

    case 'addPage': {
      const page =
        action.kind === 'sectionTitle'
          ? { ...createPage('sectionTitle'), sectionTitleFields: { title: 'Section', ...action.fields } }
          : createPage(action.kind);
      // A cover is only ever first; never let another page slot ahead of an existing cover.
      const hasCover = doc.pages[0]?.kind === 'cover';
      const minIndex = hasCover ? 1 : 0;
      const at = Math.max(minIndex, Math.min(action.at, doc.pages.length));
      const pages = [...doc.pages.slice(0, at), page, ...doc.pages.slice(at)];
      return withPages(doc, pages);
    }

    case 'movePage': {
      const { index, dir } = action;
      const target = index + dir;
      if (index < 0 || index >= doc.pages.length || target < 0 || target >= doc.pages.length) {
        return doc;
      }
      // The cover (if present) is pinned first — nothing moves into slot 0 ahead of it,
      // and the cover itself never moves.
      if (doc.pages[0]?.kind === 'cover' && (index === 0 || target === 0)) return doc;
      const pages = [...doc.pages];
      [pages[index], pages[target]] = [pages[target], pages[index]];
      return withPages(doc, pages);
    }

    case 'duplicatePage': {
      const original = doc.pages[action.index];
      if (!original) return doc;
      if (original.kind === 'cover') return doc; // only one cover allowed
      const copy = clonePageFresh(original);
      const pages = [
        ...doc.pages.slice(0, action.index + 1),
        copy,
        ...doc.pages.slice(action.index + 1),
      ];
      return withPages(doc, pages);
    }

    case 'deletePage': {
      if (doc.pages.length <= 1) return doc; // never leave a document with zero pages
      const pages = doc.pages.filter((_, i) => i !== action.index);
      return withPages(doc, pages);
    }

    case 'updateCoverFields':
      return withPages(
        doc,
        mapPage(doc, action.pageId, (p) => ({
          ...p,
          coverFields: { title: '', ...p.coverFields, ...action.fields },
        })),
      );

    case 'updateSectionFields':
      return withPages(
        doc,
        mapPage(doc, action.pageId, (p) => ({
          ...p,
          sectionTitleFields: { title: '', ...p.sectionTitleFields, ...action.fields },
        })),
      );

    // Full overwrite (not a merge like the two actions above) — the caller always sends
    // both fields' desired final state, since "unset this one but keep that one" is
    // ambiguous to express as a sparse patch once `undefined` is itself a valid target
    // value (clearing an override back to "inherit the document's theme"/"no design").
    case 'updatePageMeta':
      return withPages(
        doc,
        mapPage(doc, action.pageId, (p) => ({
          ...p,
          backgroundDesignId: action.backgroundDesignId,
          themeId: action.themeId,
        })),
      );

    case 'addBlock':
      return withPages(
        doc,
        mapPage(doc, action.pageId, (p) => {
          const block = createBlock(action.blockType);
          const at = Math.max(0, Math.min(action.at, p.blocks.length));
          return { ...p, blocks: [...p.blocks.slice(0, at), block, ...p.blocks.slice(at)] };
        }),
      );

    case 'updateBlock':
      return withPages(
        doc,
        mapPage(doc, action.pageId, (p) => ({
          ...p,
          blocks: p.blocks.map((b) => (b.id === action.block.id ? action.block : b)),
        })),
      );

    case 'moveBlock':
      return withPages(
        doc,
        mapPage(doc, action.pageId, (p) => {
          const target = action.index + action.dir;
          if (target < 0 || target >= p.blocks.length) return p;
          const blocks = [...p.blocks];
          [blocks[action.index], blocks[target]] = [blocks[target], blocks[action.index]];
          return { ...p, blocks };
        }),
      );

    case 'duplicateBlock':
      return withPages(
        doc,
        mapPage(doc, action.pageId, (p) => {
          const original = p.blocks[action.index];
          if (!original) return p;
          const copy = cloneBlockFresh(original);
          return {
            ...p,
            blocks: [
              ...p.blocks.slice(0, action.index + 1),
              copy,
              ...p.blocks.slice(action.index + 1),
            ],
          };
        }),
      );

    case 'deleteBlock':
      return withPages(
        doc,
        mapPage(doc, action.pageId, (p) => ({
          ...p,
          blocks: p.blocks.filter((_, i) => i !== action.index),
        })),
      );

    case 'replaceDoc':
      return { ...action.doc, updatedAt: new Date().toISOString() };

    default: {
      const never: never = action;
      throw new Error(`Unknown editor action: ${String(never)}`);
    }
  }
}
