'use client';

// localStorage for custom Document Builder templates. Distinct prefix from the phase-3
// proposal/audit template system (which owns `bf-doc-templates:`) — see DISCOVERY.md. Same
// conventions as themeStorage: validate-all-or-nothing, skip (never destroy) corrupt
// entries, CustomEvent change signal, JSON export/import with re-key on id collision.

import { useCallback, useEffect, useState } from 'react';
import { newId } from '@/lib/document-builder/defaults';
import { clonePageFresh } from './editorState';
import { validateTemplate, type DocTemplate } from './templateTypes';
import { BUILT_IN_TEMPLATES, getBuiltInTemplate } from './builtInTemplates';
import type { BuiltDocument } from '@/lib/document-builder/types';

const PREFIX = 'bf-builder-templates:';
const CHANGE_EVENT = 'bf-builder-templates-changed';

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

export function listCustomTemplates(): DocTemplate[] {
  if (!storageAvailable()) return [];
  const out: DocTemplate[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    try {
      const result = validateTemplate(JSON.parse(window.localStorage.getItem(key) ?? ''));
      if (result.template) out.push(result.template);
    } catch {
      /* corrupt/foreign entry: skip */
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function listCustomTemplateNames(): string[] {
  return listCustomTemplates().map((t) => t.name);
}

export function saveCustomTemplate(
  template: DocTemplate,
  overwrite = false,
): { ok: true } | { ok: false; error: string } {
  if (!storageAvailable()) return { ok: false, error: 'Storage is unavailable.' };
  if (getBuiltInTemplate(template.id)) {
    return { ok: false, error: 'Built-in templates cannot be overwritten.' };
  }
  const result = validateTemplate(template);
  if (!result.template) return { ok: false, error: result.error };
  let toSave = result.template;
  // On overwrite, reuse the id of the existing custom template with the same name.
  if (overwrite) {
    const existing = listCustomTemplates().find(
      (t) => t.name.toLowerCase() === toSave.name.toLowerCase(),
    );
    if (existing) toSave = { ...toSave, id: existing.id };
  }
  try {
    window.localStorage.setItem(PREFIX + toSave.id, JSON.stringify(toSave));
    emitChange();
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not save — browser storage is full.' };
  }
}

export function deleteCustomTemplate(id: string): void {
  if (!storageAvailable()) return;
  window.localStorage.removeItem(PREFIX + id);
  emitChange();
}

export function renameCustomTemplate(id: string, name: string): void {
  if (!storageAvailable()) return;
  const raw = window.localStorage.getItem(PREFIX + id);
  if (!raw) return;
  const result = validateTemplate(JSON.parse(raw));
  if (!result.template) return;
  window.localStorage.setItem(PREFIX + id, JSON.stringify({ ...result.template, name: name.trim() || result.template.name }));
  emitChange();
}

export function templateToJson(template: DocTemplate): string {
  return JSON.stringify(template, null, 2);
}

export function parseTemplateImport(
  text: string,
): { template: DocTemplate; error?: never } | { template?: never; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: 'That file is not valid JSON.' };
  }
  const result = validateTemplate(parsed);
  if (!result.template) return { error: `Not a valid template file: ${result.error}` };
  // Never let an import shadow a built-in id (or silently overwrite an existing custom).
  if (getBuiltInTemplate(result.template.id)) {
    return { template: { ...result.template, id: `custom-${result.template.id}-${newId().slice(0, 8)}` } };
  }
  return { template: result.template };
}

/** Snapshot the current document as a reusable template (content + theme preserved). */
export function captureTemplateFromDoc(
  doc: BuiltDocument,
  meta: { name: string; description: string; category: string },
): DocTemplate {
  return {
    id: newId(),
    name: meta.name.trim(),
    description: meta.description.trim(),
    category: meta.category.trim() || 'Custom',
    isBuiltIn: false,
    document: structuredClone(doc),
  };
}

/** Deep-copy a template into a brand-new document — fresh ids throughout, never shared. */
export function instantiateTemplate(template: DocTemplate): BuiltDocument {
  const now = new Date().toISOString();
  return {
    id: newId(),
    name: template.name,
    createdAt: now,
    updatedAt: now,
    themeId: template.document.themeId,
    pages: template.document.pages.map(clonePageFresh),
    templateId: template.id,
  };
}

export function useCustomTemplates(): DocTemplate[] {
  const [templates, setTemplates] = useState<DocTemplate[]>([]);
  const refresh = useCallback(() => setTemplates(listCustomTemplates()), []);
  useEffect(() => {
    refresh();
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);
  return templates;
}

export { BUILT_IN_TEMPLATES };
