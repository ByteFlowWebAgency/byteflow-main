'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DocumentTemplate, TemplateDocumentType } from './templateTypes';
import { validateTemplate } from './templateTypes';
import { BUILT_IN_TEMPLATES, getBuiltInTemplate } from './builtInTemplates';
import type { ProposalData } from '@/lib/proposal-tool/types';
import type { AuditData } from '@/lib/audit-tool/types';
import { createDefaultProposal } from '@/lib/proposal-tool/defaults';
import { createDefaultAudit } from '@/lib/audit-tool/defaults';

// Custom-template persistence: one localStorage key per template under the
// bf-doc-templates: prefix (distinct from bf-themes:). Only keys with this exact
// prefix are read or written. Built-ins never enter storage.

const PREFIX = 'bf-doc-templates:';
const CHANGE_EVENT = 'bf-doc-templates-changed';

function storageAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

function emitChange(): void {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function listCustomTemplates(documentType?: TemplateDocumentType): DocumentTemplate[] {
  if (!storageAvailable()) return [];
  const templates: DocumentTemplate[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    try {
      const { template } = validateTemplate(JSON.parse(window.localStorage.getItem(key) ?? ''));
      if (template && (!documentType || template.documentType === documentType)) {
        templates.push(template);
      }
    } catch {
      // Unreadable entry: skip, never destroy.
    }
  }
  return templates.sort((a, b) => a.name.localeCompare(b.name));
}

export function getCustomTemplate(id: string): DocumentTemplate | undefined {
  if (!storageAvailable()) return undefined;
  const raw = window.localStorage.getItem(PREFIX + id);
  if (!raw) return undefined;
  try {
    return validateTemplate(JSON.parse(raw)).template;
  } catch {
    return undefined;
  }
}

export function saveCustomTemplate(
  template: DocumentTemplate,
): { ok: true } | { ok: false; error: string } {
  if (!storageAvailable()) return { ok: false, error: 'Storage is unavailable in this browser.' };
  if (getBuiltInTemplate(template.id)) {
    return { ok: false, error: 'Built-in templates cannot be overwritten.' };
  }
  const { template: valid, error } = validateTemplate(template);
  if (!valid) return { ok: false, error };
  window.localStorage.setItem(PREFIX + valid.id, JSON.stringify(valid));
  emitChange();
  return { ok: true };
}

export function deleteCustomTemplate(id: string): void {
  if (!storageAvailable()) return;
  window.localStorage.removeItem(PREFIX + id);
  emitChange();
}

export function templateToJson(template: DocumentTemplate): string {
  return JSON.stringify(template, null, 2);
}

/** Parse + validate an import; all-or-nothing. Built-in id collisions are re-keyed. */
export function parseTemplateImport(
  text: string,
): { template: DocumentTemplate; error?: never } | { template?: never; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: 'That file is not valid JSON.' };
  }
  const result = validateTemplate(parsed);
  if (!result.template) return { error: `Not a valid template file: ${result.error}` };
  if (getBuiltInTemplate(result.template.id)) {
    return {
      template: { ...result.template, id: `custom-${result.template.id}-${Date.now().toString(36)}` },
    };
  }
  return { template: result.template };
}

/** Live custom-template list for chooser UIs; updates on save/delete, incl. other tabs. */
export function useCustomTemplates(documentType: TemplateDocumentType): DocumentTemplate[] {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const refresh = useCallback(
    () => setTemplates(listCustomTemplates(documentType)),
    [documentType],
  );
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

/** Deep copy that regenerates every id-bearing item — a template and a document made
 * from it never share ids. */
function freshIds<T extends { id: string }>(items: T[] | undefined): T[] | undefined {
  return items?.map((item) => ({ ...item, id: crypto.randomUUID() }));
}

/**
 * Build a fresh ProposalData from a proposal template. Identity fields (id/createdAt)
 * are taken from the current in-flight document so the app's mount-time init survives.
 */
export function applyProposalTemplate(
  template: DocumentTemplate,
  current: ProposalData,
): ProposalData {
  const content = JSON.parse(JSON.stringify(template.defaultContent)) as Partial<ProposalData>;
  const base = createDefaultProposal();
  return {
    ...base,
    ...content,
    services: freshIds(content.services) ?? base.services,
    lineItems: freshIds(content.lineItems) ?? base.lineItems,
    id: current.id,
    createdAt: current.createdAt,
    themeId: template.themeId,
    includeCoverPage: template.includeCoverPage,
  };
}

/** Audit counterpart of applyProposalTemplate; also preserves the mount-set auditDate. */
export function applyAuditTemplate(template: DocumentTemplate, current: AuditData): AuditData {
  const content = JSON.parse(JSON.stringify(template.defaultContent)) as Partial<AuditData>;
  const base = createDefaultAudit();
  return {
    ...base,
    ...content,
    findings: freshIds(content.findings) ?? base.findings,
    id: current.id,
    createdAt: current.createdAt,
    auditDate: current.auditDate,
    themeId: template.themeId,
    includeCoverPage: template.includeCoverPage,
  };
}

/** Strip identity/id fields from a live document to store as template content. */
export function captureProposalContent(proposal: ProposalData): Partial<ProposalData> {
  const copy = JSON.parse(JSON.stringify(proposal)) as Partial<ProposalData>;
  delete copy.id;
  delete copy.createdAt;
  delete copy.themeId;
  delete copy.includeCoverPage;
  copy.services = copy.services?.map((s) => ({ ...s, id: '' }));
  copy.lineItems = copy.lineItems?.map((l) => ({ ...l, id: '' }));
  return copy;
}

export function captureAuditContent(audit: AuditData): Partial<AuditData> {
  const copy = JSON.parse(JSON.stringify(audit)) as Partial<AuditData>;
  delete copy.id;
  delete copy.createdAt;
  delete copy.auditDate;
  delete copy.themeId;
  delete copy.includeCoverPage;
  copy.findings = copy.findings?.map((f) => ({ ...f, id: '' }));
  return copy;
}

export { BUILT_IN_TEMPLATES };
