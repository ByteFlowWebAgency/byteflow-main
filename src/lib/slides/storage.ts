// localStorage persistence for Presentations decks, matching the shape of every other
// storage adapter in this suite (document-builder/storage.ts, themeStorage.ts): one key per
// deck under a distinct prefix, all-or-nothing validation on every read and write, corrupt/
// foreign entries skipped (never destroyed), a same-tab CustomEvent change signal, JSON
// export/import.
//
// Slides' import validation is intentionally STRICTER than document-builder's: per
// docs/slides/00-GUARDRAILS.md and docs/slides/06-INTEGRATION-AND-QA.md, a missing required
// field must cause a clear rejection of the whole file, not silent coercion to an empty
// value — "fail with a clear message on anything malformed rather than partially applying
// it." Every per-template validator below throws ValidationError on the first problem found;
// validateDeck catches it once, at the top, and turns it into a single clear error message.

'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  ColumnItem,
  Deck,
  Milestone,
  PricingLineItem,
  ProcessStep,
  QaPair,
  RoadmapPhase,
  Service,
  Slide,
  SlideContent,
  SlideTemplateId,
  Stat,
  TeamMember,
} from './types';
import { SLIDE_TEMPLATE_ID_SET } from './types';

const PREFIX = 'bf-slides:';
const CHANGE_EVENT = 'bf-slides-changed';

function storageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

function emitChange(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

// ---- validation leaf helpers -------------------------------------------------------------

class ValidationError extends Error {}

function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function idOr(value: unknown): string {
  return typeof value === 'string' && value ? value : crypto.randomUUID();
}

function reqStr(value: unknown, field: string, max = 2000): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`"${field}" is required and must be a non-empty string.`);
  }
  return value.slice(0, max);
}

function optStr(value: unknown, max = 2000): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.slice(0, max) : undefined;
}

function reqNum(value: unknown, field: string): number {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) {
    throw new ValidationError(`"${field}" must be a number.`);
  }
  return n;
}

function reqObj(value: unknown, field: string): Record<string, unknown> {
  if (!isObj(value)) throw new ValidationError(`"${field}" must be an object.`);
  return value;
}

function reqArr(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) throw new ValidationError(`"${field}" must be an array.`);
  return value;
}

function reqStrArr(value: unknown, field: string, max = 2000): string[] {
  return reqArr(value, field).map((v, i) => {
    if (typeof v !== 'string') throw new ValidationError(`"${field}[${i}]" must be a string.`);
    return v.slice(0, max);
  });
}

/** Keep only strings that already are data: URLs (or empty) — never a bare https:// URL. */
function safeImageSrc(value: unknown): string {
  const s = typeof value === 'string' ? value.slice(0, 8_000_000) : '';
  return s === '' || s.startsWith('data:image/') ? s : '';
}

// ---- repeatable item validators ----------------------------------------------------------

function validateColumnItem(v: unknown, field: string): ColumnItem {
  const c = reqObj(v, field);
  return {
    heading: reqStr(c.heading, `${field}.heading`, 200),
    body: reqStr(c.body, `${field}.body`, 1000),
  };
}

function validateProcessStep(v: unknown, field: string): ProcessStep {
  const c = reqObj(v, field);
  return {
    id: idOr(c.id),
    number: reqNum(c.number, `${field}.number`),
    label: reqStr(c.label, `${field}.label`, 200),
    description: reqStr(c.description, `${field}.description`, 1000),
  };
}

function validateMilestone(v: unknown, field: string): Milestone {
  const c = reqObj(v, field);
  return {
    id: idOr(c.id),
    label: reqStr(c.label, `${field}.label`, 200),
    date: reqStr(c.date, `${field}.date`, 60),
  };
}

function validateTeamMember(v: unknown, field: string): TeamMember {
  const c = reqObj(v, field);
  return {
    id: idOr(c.id),
    name: reqStr(c.name, `${field}.name`, 200),
    role: reqStr(c.role, `${field}.role`, 200),
    photoDataUrl: safeImageSrc(c.photoDataUrl) || undefined,
  };
}

function validateStat(v: unknown, field: string): Stat {
  const c = reqObj(v, field);
  return {
    id: idOr(c.id),
    number: reqStr(c.number, `${field}.number`, 40),
    label: reqStr(c.label, `${field}.label`, 200),
  };
}

function validatePricingLineItem(v: unknown, field: string): PricingLineItem {
  const c = reqObj(v, field);
  return {
    id: idOr(c.id),
    label: reqStr(c.label, `${field}.label`, 300),
    amount: reqNum(c.amount, `${field}.amount`),
  };
}

function validateService(v: unknown, field: string): Service {
  const c = reqObj(v, field);
  return {
    id: idOr(c.id),
    name: reqStr(c.name, `${field}.name`, 200),
    description: reqStr(c.description, `${field}.description`, 1000),
  };
}

function validateQaPair(v: unknown, field: string): QaPair {
  const c = reqObj(v, field);
  return {
    id: idOr(c.id),
    question: reqStr(c.question, `${field}.question`, 400),
    answer: reqStr(c.answer, `${field}.answer`, 2000),
  };
}

function validateRoadmapPhase(v: unknown, field: string): RoadmapPhase {
  const c = reqObj(v, field);
  return {
    id: idOr(c.id),
    label: reqStr(c.label, `${field}.label`, 200),
    description: reqStr(c.description, `${field}.description`, 1000),
  };
}

// ---- per-template content validators (all 25) ---------------------------------------------

function validateSlideContent(templateId: SlideTemplateId, raw: unknown): SlideContent {
  const c = reqObj(raw, 'content');
  switch (templateId) {
    case 'titleCover':
      return {
        templateId,
        content: {
          eyebrow: optStr(c.eyebrow, 200),
          title: reqStr(c.title, 'title', 300),
          subtitle: optStr(c.subtitle, 400),
          presentedTo: optStr(c.presentedTo, 200),
          date: optStr(c.date, 60),
          backgroundDesignId: optStr(c.backgroundDesignId, 80),
        },
      };
    case 'agenda':
      return {
        templateId,
        content: { title: reqStr(c.title, 'title', 300), items: reqStrArr(c.items, 'items', 500) },
      };
    case 'sectionDivider':
      return {
        templateId,
        content: {
          title: reqStr(c.title, 'title', 300),
          subtitle: optStr(c.subtitle, 400),
          backgroundDesignId: optStr(c.backgroundDesignId, 80),
        },
      };
    case 'problemStatement':
      return {
        templateId,
        content: {
          title: reqStr(c.title, 'title', 300),
          body: reqStr(c.body, 'body', 4000),
          points: reqStrArr(c.points, 'points', 500),
        },
      };
    case 'solutionOverview':
      return {
        templateId,
        content: {
          title: reqStr(c.title, 'title', 300),
          body: reqStr(c.body, 'body', 4000),
          points: reqStrArr(c.points, 'points', 500),
        },
      };
    case 'threeColumn': {
      const cols = reqArr(c.columns, 'columns');
      if (cols.length !== 3) throw new ValidationError('"columns" must have exactly 3 items.');
      return {
        templateId,
        content: {
          title: reqStr(c.title, 'title', 300),
          columns: [
            validateColumnItem(cols[0], 'columns[0]'),
            validateColumnItem(cols[1], 'columns[1]'),
            validateColumnItem(cols[2], 'columns[2]'),
          ],
        },
      };
    }
    case 'twoColumnComparison':
      return {
        templateId,
        content: {
          title: reqStr(c.title, 'title', 300),
          leftHeading: reqStr(c.leftHeading, 'leftHeading', 200),
          leftItems: reqStrArr(c.leftItems, 'leftItems', 500),
          rightHeading: reqStr(c.rightHeading, 'rightHeading', 200),
          rightItems: reqStrArr(c.rightItems, 'rightItems', 500),
        },
      };
    case 'processSteps': {
      const steps = reqArr(c.steps, 'steps');
      if (steps.length < 2 || steps.length > 5) {
        throw new ValidationError('"steps" must have between 2 and 5 items.');
      }
      return {
        templateId,
        content: {
          title: reqStr(c.title, 'title', 300),
          steps: steps.map((v, i) => validateProcessStep(v, `steps[${i}]`)),
        },
      };
    }
    case 'timeline':
      return {
        templateId,
        content: {
          title: reqStr(c.title, 'title', 300),
          milestones: reqArr(c.milestones, 'milestones').map((v, i) =>
            validateMilestone(v, `milestones[${i}]`),
          ),
        },
      };
    case 'teamIntro':
      return {
        templateId,
        content: {
          title: reqStr(c.title, 'title', 300),
          members: reqArr(c.members, 'members').map((v, i) => validateTeamMember(v, `members[${i}]`)),
        },
      };
    case 'caseStudySummary':
      return {
        templateId,
        content: {
          title: reqStr(c.title, 'title', 300),
          challenge: reqStr(c.challenge, 'challenge', 2000),
          approach: reqStr(c.approach, 'approach', 2000),
          result: reqStr(c.result, 'result', 2000),
        },
      };
    case 'testimonial':
      return {
        templateId,
        content: {
          quote: reqStr(c.quote, 'quote', 2000),
          attributionName: reqStr(c.attributionName, 'attributionName', 200),
          attributionRole: reqStr(c.attributionRole, 'attributionRole', 200),
        },
      };
    case 'bigStat':
      return {
        templateId,
        content: {
          statNumber: reqStr(c.statNumber, 'statNumber', 60),
          statLabel: reqStr(c.statLabel, 'statLabel', 200),
          supportingText: optStr(c.supportingText, 400),
        },
      };
    case 'statsGrid': {
      const stats = reqArr(c.stats, 'stats');
      if (stats.length < 3 || stats.length > 4) {
        throw new ValidationError('"stats" must have between 3 and 4 items.');
      }
      return {
        templateId,
        content: {
          title: reqStr(c.title, 'title', 300),
          stats: stats.map((v, i) => validateStat(v, `stats[${i}]`)),
        },
      };
    }
    case 'pricingInvestment':
      return {
        templateId,
        content: {
          title: reqStr(c.title, 'title', 300),
          lineItems: reqArr(c.lineItems, 'lineItems').map((v, i) =>
            validatePricingLineItem(v, `lineItems[${i}]`),
          ),
          total: typeof c.total === 'number' && Number.isFinite(c.total) ? c.total : undefined,
          note: optStr(c.note, 500),
        },
      };
    case 'servicesOverview':
      return {
        templateId,
        content: {
          title: reqStr(c.title, 'title', 300),
          services: reqArr(c.services, 'services').map((v, i) => validateService(v, `services[${i}]`)),
        },
      };
    case 'fullBleedImage':
      return {
        templateId,
        content: { imageDataUrl: safeImageSrc(c.imageDataUrl), caption: optStr(c.caption, 400) },
      };
    case 'imageAndText':
      return {
        templateId,
        content: {
          imageDataUrl: safeImageSrc(c.imageDataUrl),
          title: reqStr(c.title, 'title', 300),
          body: reqStr(c.body, 'body', 4000),
        },
      };
    case 'bulletList':
      return {
        templateId,
        content: { title: reqStr(c.title, 'title', 300), bullets: reqStrArr(c.bullets, 'bullets', 500) },
      };
    case 'chartImage':
      return {
        templateId,
        content: {
          title: reqStr(c.title, 'title', 300),
          chartImageDataUrl: safeImageSrc(c.chartImageDataUrl),
          caption: optStr(c.caption, 400),
        },
      };
    case 'faq':
      return {
        templateId,
        content: {
          title: reqStr(c.title, 'title', 300),
          qaPairs: reqArr(c.qaPairs, 'qaPairs').map((v, i) => validateQaPair(v, `qaPairs[${i}]`)),
        },
      };
    case 'roadmap':
      return {
        templateId,
        content: {
          title: reqStr(c.title, 'title', 300),
          phases: reqArr(c.phases, 'phases').map((v, i) => validateRoadmapPhase(v, `phases[${i}]`)),
        },
      };
    case 'contactNextSteps':
      return {
        templateId,
        content: {
          title: reqStr(c.title, 'title', 300),
          contactName: reqStr(c.contactName, 'contactName', 200),
          email: reqStr(c.email, 'email', 200),
          phone: optStr(c.phone, 60),
          website: optStr(c.website, 200),
          nextStepNote: optStr(c.nextStepNote, 500),
        },
      };
    case 'thankYouClosing':
      return {
        templateId,
        content: {
          title: reqStr(c.title, 'title', 300),
          subtitle: optStr(c.subtitle, 400),
          backgroundDesignId: optStr(c.backgroundDesignId, 80),
        },
      };
    case 'blankCustom':
      return {
        templateId,
        content: { title: reqStr(c.title, 'title', 300), freeText: reqStr(c.freeText, 'freeText', 8000) },
      };
  }
}

function validateSlide(input: unknown, index: number): Slide {
  const raw = reqObj(input, `slides[${index}]`);
  const templateId = raw.templateId;
  if (typeof templateId !== 'string' || !SLIDE_TEMPLATE_ID_SET.has(templateId as SlideTemplateId)) {
    throw new ValidationError(`slides[${index}] has an unknown templateId "${String(templateId)}".`);
  }
  const content = validateSlideContent(templateId as SlideTemplateId, raw.content);
  return { id: idOr(raw.id), ...content };
}

/**
 * Validate an unknown value into a clean Deck. All-or-nothing: the first problem found
 * anywhere — top-level shape, an unknown templateId, or a missing/malformed content field —
 * rejects the whole file with one clear message. Never returns the input object.
 */
export function validateDeck(input: unknown): { deck: Deck; error?: never } | { deck?: never; error: string } {
  try {
    const raw = reqObj(input, 'deck');
    const slidesRaw = reqArr(raw.slides, 'slides');
    const now = new Date().toISOString();
    const deck: Deck = {
      id: idOr(raw.id),
      name: optStr(raw.name, 200) ?? 'Untitled deck',
      createdAt: optStr(raw.createdAt, 40) ?? now,
      updatedAt: optStr(raw.updatedAt, 40) ?? now,
      themeId: optStr(raw.themeId, 100) ?? 'classic',
      slides: slidesRaw.map((v, i) => validateSlide(v, i)),
    };
    return { deck };
  } catch (error) {
    return { error: error instanceof ValidationError ? error.message : 'Not a valid deck file.' };
  }
}

// ---- CRUD ---------------------------------------------------------------------------------

export function listDecks(): Deck[] {
  if (!storageAvailable()) return [];
  const out: Deck[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? '');
      const result = validateDeck(parsed);
      if (result.deck) out.push(result.deck);
    } catch {
      // Corrupt/foreign entry: skip, never destroy.
    }
  }
  return out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
}

export function getDeck(id: string): Deck | undefined {
  if (!storageAvailable()) return undefined;
  try {
    const raw = window.localStorage.getItem(PREFIX + id);
    if (!raw) return undefined;
    return validateDeck(JSON.parse(raw)).deck;
  } catch {
    return undefined;
  }
}

export function saveDeck(deck: Deck): { ok: true } | { ok: false; error: string } {
  if (!storageAvailable()) return { ok: false, error: 'Storage is unavailable in this browser.' };
  const result = validateDeck(deck);
  if (!result.deck) return { ok: false, error: result.error };
  try {
    window.localStorage.setItem(PREFIX + result.deck.id, JSON.stringify(result.deck));
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

export function deleteDeck(id: string): void {
  if (!storageAvailable()) return;
  window.localStorage.removeItem(PREFIX + id);
  emitChange();
}

export function deckExists(id: string): boolean {
  if (!storageAvailable()) return false;
  return window.localStorage.getItem(PREFIX + id) !== null;
}

// ---- JSON export / import ------------------------------------------------------------------

export function deckToJson(deck: Deck): string {
  return JSON.stringify(deck, null, 2);
}

/**
 * Parse + validate imported deck JSON. All-or-nothing: any structural or content problem
 * rejects the whole file and nothing is written. If the id collides with an existing deck
 * the import is re-keyed to a fresh id so it never silently overwrites.
 */
export function parseDeckImport(
  text: string,
): { deck: Deck; error?: never } | { deck?: never; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: 'That file is not valid JSON.' };
  }
  const result = validateDeck(parsed);
  if (!result.deck) return { error: `Not a valid deck file: ${result.error}` };
  if (deckExists(result.deck.id)) {
    return { deck: { ...result.deck, id: crypto.randomUUID() } };
  }
  return { deck: result.deck };
}

// ---- live hook ------------------------------------------------------------------------------

export function useDecks(): Deck[] {
  const [decks, setDecks] = useState<Deck[]>([]);
  const refresh = useCallback(() => setDecks(listDecks()), []);
  useEffect(() => {
    refresh();
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);
  return decks;
}

/** Approximate localStorage bytes used by everything (for a storage-usage indicator). */
export function approximateStorageBytes(): number {
  if (!storageAvailable()) return 0;
  let total = 0;
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    total += key.length + (window.localStorage.getItem(key)?.length ?? 0);
  }
  return total * 2; // UTF-16 code units ≈ 2 bytes each in most engines.
}
