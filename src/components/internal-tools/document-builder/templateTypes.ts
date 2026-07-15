// Document Builder template model. A template is a BuiltDocument of placeholder content
// plus a name, one-line description, and a free-text category tag used to group the chooser.
// No separate content format — the document type is reused wholesale.

import { validateDocument } from '@/lib/document-builder/storage';
import type { BuiltDocument } from '@/lib/document-builder/types';

export interface DocTemplate {
  id: string;
  name: string;
  description: string;
  /** Free-text grouping label in the chooser (not a hardcoded enum). */
  category: string;
  isBuiltIn: boolean;
  /** The placeholder content, reused wholesale as the starting point. */
  document: BuiltDocument;
}

export const BLANK_CATEGORY = 'Start';

/**
 * Validate an unknown value into a clean DocTemplate (fresh object, all-or-nothing on
 * structure; the embedded document runs through the same validator/sanitizer as any
 * document). Forces isBuiltIn:false. Used on import.
 */
export function validateTemplate(
  input: unknown,
): { template: DocTemplate; error?: never } | { template?: never; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { error: 'Not a template object.' };
  }
  const raw = input as Record<string, unknown>;
  const name = typeof raw.name === 'string' ? raw.name.slice(0, 80).trim() : '';
  if (!name) return { error: 'Template is missing a name.' };
  const docResult = validateDocument(raw.document);
  if (!docResult.doc) return { error: `Template document invalid: ${docResult.error}` };
  return {
    template: {
      id: typeof raw.id === 'string' && raw.id ? raw.id : crypto.randomUUID(),
      name,
      description: typeof raw.description === 'string' ? raw.description.slice(0, 300) : '',
      category: typeof raw.category === 'string' && raw.category.trim() ? raw.category.slice(0, 60).trim() : 'Custom',
      isBuiltIn: false,
      document: docResult.doc,
    },
  };
}
