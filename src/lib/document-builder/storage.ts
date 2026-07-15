// localStorage persistence for Document Builder documents, mirroring the phase-3
// themeStorage conventions: one key per document under a distinct prefix, all-or-nothing
// validation on every read and write, corrupt/foreign entries skipped (never destroyed),
// a same-tab CustomEvent change signal, and JSON export/import.
//
// Documents use the `bf-docs:` prefix (free; the `bf-doc-templates:` prefix the spec named
// is already taken by the phase-3 proposal/audit template system — see DISCOVERY.md).

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Pricing, LineItem } from '@/lib/internal-tools/pricing';
import { sanitizeRichHtml } from './sanitize';
import type {
  Block,
  BlockType,
  BuiltDocument,
  DocumentPage,
  KeyValueRow,
  PageKind,
} from './types';

const PREFIX = 'bf-docs:';
const CHANGE_EVENT = 'bf-docs-changed';

const BLOCK_TYPES = new Set<BlockType>([
  'heading',
  'titleBanner',
  'richText',
  'image',
  'table',
  'divider',
  'spacer',
  'callout',
  'pricingTable',
  'keyValueList',
  'pageBreak',
]);
const PAGE_KINDS = new Set<PageKind>(['cover', 'sectionTitle', 'content', 'closing']);

function storageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

function emitChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
}

// ---- validation leaf helpers ------------------------------------------------------------

function str(value: unknown, max = 100_000): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}
function num(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}
function bool(value: unknown): boolean {
  return value === true;
}
function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/** Keep only strings that already are data: URLs (or empty). Anything else → dropped. */
function safeImageSrc(value: unknown): string {
  const s = str(value, 8_000_000);
  return s === '' || s.startsWith('data:image/') ? s : '';
}

// ---- block validation -------------------------------------------------------------------

function validatePricing(input: unknown): Pricing {
  const p = isObj(input) ? input : {};
  const model = p.model;
  if (model === 'retainer') {
    return {
      model: 'retainer',
      monthlyAmount: num(p.monthlyAmount),
      termMonths: num(p.termMonths),
      includedScope: str(p.includedScope, 2000),
    };
  }
  if (model === 'hybrid') {
    return {
      model: 'hybrid',
      setupAmount: num(p.setupAmount),
      monthlyAmount: num(p.monthlyAmount),
      termMonths: num(p.termMonths),
      includedScope: str(p.includedScope, 2000),
    };
  }
  return {
    model: 'flat',
    totalAmount: num(p.totalAmount),
    paymentSchedule: str(p.paymentSchedule, 2000),
  };
}

function validateLineItems(input: unknown): LineItem[] {
  if (!Array.isArray(input)) return [];
  return input.filter(isObj).map((it) => ({
    id: str(it.id) || crypto.randomUUID(),
    description: str(it.description, 2000),
    amount: num(it.amount),
    recurring: bool(it.recurring),
  }));
}

function validateKeyValues(input: unknown): KeyValueRow[] {
  if (!Array.isArray(input)) return [];
  return input.filter(isObj).map((it) => ({
    id: str(it.id) || crypto.randomUUID(),
    label: str(it.label, 500),
    value: str(it.value, 2000),
  }));
}

/** Returns a clean Block, or a string describing an unrecoverable structural problem. */
function validateBlock(input: unknown): Block | string {
  if (!isObj(input)) return 'a block was not an object';
  const type = input.type;
  if (typeof type !== 'string' || !BLOCK_TYPES.has(type as BlockType)) {
    return `unknown block type "${String(type)}"`;
  }
  const id = str(input.id) || crypto.randomUUID();
  switch (type as BlockType) {
    case 'heading': {
      const lvl = num(input.level);
      const level = lvl === 1 || lvl === 3 ? (lvl as 1 | 3) : 2;
      return { id, type: 'heading', level, text: str(input.text, 2000) };
    }
    case 'titleBanner':
      return {
        id,
        type: 'titleBanner',
        eyebrow: str(input.eyebrow, 200),
        title: str(input.title, 2000),
        subtitle: str(input.subtitle, 2000),
      };
    case 'richText':
      return { id, type: 'richText', html: sanitizeRichHtml(str(input.html)) };
    case 'callout':
      return { id, type: 'callout', html: sanitizeRichHtml(str(input.html)) };
    case 'image':
      return {
        id,
        type: 'image',
        dataUrl: safeImageSrc(input.dataUrl),
        caption: str(input.caption, 2000),
        alt: str(input.alt, 500),
        width: input.width === 'half' ? 'half' : 'full',
      };
    case 'table': {
      const header = Array.isArray(input.header)
        ? input.header.map((c) => str(c, 2000))
        : [];
      const cols = Math.max(1, header.length);
      const normHeader = header.length ? header : [''];
      const rows = Array.isArray(input.rows)
        ? input.rows.map((row) => {
            const cells = Array.isArray(row) ? row.map((c) => str(c, 2000)) : [];
            // Force rectangular: pad/truncate every row to the header width.
            const out = cells.slice(0, cols);
            while (out.length < cols) out.push('');
            return out;
          })
        : [];
      return { id, type: 'table', header: normHeader, rows };
    }
    case 'spacer':
      return {
        id,
        type: 'spacer',
        size: input.size === 'small' || input.size === 'large' ? input.size : 'medium',
      };
    case 'pricingTable':
      return {
        id,
        type: 'pricingTable',
        pricing: validatePricing(input.pricing),
        lineItems: validateLineItems(input.lineItems),
      };
    case 'keyValueList':
      return { id, type: 'keyValueList', items: validateKeyValues(input.items) };
    case 'divider':
      return { id, type: 'divider' };
    case 'pageBreak':
      return { id, type: 'pageBreak' };
    default:
      return `unhandled block type "${type}"`;
  }
}

function validatePage(input: unknown): DocumentPage | string {
  if (!isObj(input)) return 'a page was not an object';
  const kind = input.kind;
  if (typeof kind !== 'string' || !PAGE_KINDS.has(kind as PageKind)) {
    return `unknown page kind "${String(kind)}"`;
  }
  const id = str(input.id) || crypto.randomUUID();
  const blocks: Block[] = [];
  if (Array.isArray(input.blocks)) {
    for (const raw of input.blocks) {
      const b = validateBlock(raw);
      if (typeof b === 'string') return b;
      blocks.push(b);
    }
  }
  const page: DocumentPage = { id, kind: kind as PageKind, blocks };
  if (isObj(input.coverFields)) {
    page.coverFields = {
      title: str(input.coverFields.title, 2000),
      subtitle: str(input.coverFields.subtitle, 2000),
      clientName: str(input.coverFields.clientName, 500),
      date: str(input.coverFields.date, 40),
    };
  }
  if (isObj(input.sectionTitleFields)) {
    page.sectionTitleFields = {
      title: str(input.sectionTitleFields.title, 2000),
      subtitle: str(input.sectionTitleFields.subtitle, 2000),
      eyebrow: str(input.sectionTitleFields.eyebrow, 200),
    };
  }
  const backgroundDesignId = str(input.backgroundDesignId, 80);
  if (backgroundDesignId) page.backgroundDesignId = backgroundDesignId;
  const themeId = str(input.themeId, 100);
  if (themeId) page.themeId = themeId;
  return page;
}

/**
 * Validate an unknown value into a clean BuiltDocument. All-or-nothing on STRUCTURE
 * (non-array pages, unknown block type/page kind reject the whole thing); CONTENT is
 * sanitized/coerced (rich text stripped to the whitelist, bad numbers → 0, non-data image
 * URLs dropped) rather than rejected. Never returns the input object.
 */
export function validateDocument(
  input: unknown,
): { doc: BuiltDocument; error?: never } | { doc?: never; error: string } {
  if (!isObj(input)) return { error: 'Not a document object.' };
  if (!Array.isArray(input.pages)) return { error: 'Document has no pages array.' };
  const pages: DocumentPage[] = [];
  for (const raw of input.pages) {
    const p = validatePage(raw);
    if (typeof p === 'string') return { error: `Invalid document: ${p}.` };
    pages.push(p);
  }
  const now = new Date().toISOString();
  const doc: BuiltDocument = {
    id: str(input.id) || crypto.randomUUID(),
    name: str(input.name, 120) || 'Untitled document',
    createdAt: str(input.createdAt, 40) || now,
    updatedAt: str(input.updatedAt, 40) || now,
    themeId: str(input.themeId, 100) || 'classic',
    pages,
  };
  const templateId = str(input.templateId, 100);
  if (templateId) doc.templateId = templateId;
  // The CRM link. This validator deliberately never returns the input object, so a field
  // that isn't copied here is silently dropped on every save — organizationId has to be
  // carried explicitly or the link would evaporate the moment the document is written.
  const organizationId = str(input.organizationId, 40);
  if (UUID_RE.test(organizationId)) doc.organizationId = organizationId;
  return { doc };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---- CRUD -------------------------------------------------------------------------------

export function listDocs(): BuiltDocument[] {
  if (!storageAvailable()) return [];
  const out: BuiltDocument[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? '');
      const result = validateDocument(parsed);
      if (result.doc) out.push(result.doc);
    } catch {
      // Corrupt/foreign entry: skip, never destroy.
    }
  }
  // Most-recently-updated first — the documents list default sort.
  return out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
}

export function getDoc(id: string): BuiltDocument | undefined {
  if (!storageAvailable()) return undefined;
  try {
    const raw = window.localStorage.getItem(PREFIX + id);
    if (!raw) return undefined;
    const result = validateDocument(JSON.parse(raw));
    return result.doc;
  } catch {
    return undefined;
  }
}

export function saveDoc(doc: BuiltDocument): { ok: true } | { ok: false; error: string } {
  if (!storageAvailable()) return { ok: false, error: 'Storage is unavailable in this browser.' };
  const result = validateDocument(doc);
  if (!result.doc) return { ok: false, error: result.error };
  try {
    window.localStorage.setItem(PREFIX + result.doc.id, JSON.stringify(result.doc));
    emitChange();
    return { ok: true };
  } catch {
    // Almost always the ~5MB quota (images as data URLs eat it fast).
    return {
      ok: false,
      error: 'Could not save — browser storage is full. Export a copy and remove large images.',
    };
  }
}

export function deleteDoc(id: string): void {
  if (!storageAvailable()) return;
  window.localStorage.removeItem(PREFIX + id);
  emitChange();
}

export function docExists(id: string): boolean {
  if (!storageAvailable()) return false;
  return window.localStorage.getItem(PREFIX + id) !== null;
}

// ---- JSON export / import ---------------------------------------------------------------

export function docToJson(doc: BuiltDocument): string {
  return JSON.stringify(doc, null, 2);
}

/**
 * Parse + validate imported document JSON. All-or-nothing: any structural problem rejects
 * the whole file and nothing is written. If the id collides with an existing document the
 * import is re-keyed to a fresh id so it never silently overwrites.
 */
export function parseDocImport(
  text: string,
): { doc: BuiltDocument; error?: never } | { doc?: never; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: 'That file is not valid JSON.' };
  }
  const result = validateDocument(parsed);
  if (!result.doc) return { error: `Not a valid document file: ${result.error}` };
  if (docExists(result.doc.id)) {
    return { doc: { ...result.doc, id: crypto.randomUUID() } };
  }
  return { doc: result.doc };
}

// ---- live hook --------------------------------------------------------------------------

export function useDocs(): BuiltDocument[] {
  const [docs, setDocs] = useState<BuiltDocument[]>([]);
  const refresh = useCallback(() => setDocs(listDocs()), []);
  useEffect(() => {
    refresh();
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);
  return docs;
}

/** Approximate localStorage bytes used by everything (for the usage indicator). */
export function approximateStorageBytes(): number {
  if (!storageAvailable()) return 0;
  let total = 0;
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    total += key.length + (window.localStorage.getItem(key)?.length ?? 0);
  }
  // UTF-16 code units ≈ 2 bytes each in most engines.
  return total * 2;
}
