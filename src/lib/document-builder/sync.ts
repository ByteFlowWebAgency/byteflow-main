'use client';

// Two-way sync between the browser's localStorage documents and the shared server copy.
//
// WHY THIS EXISTS: documents used to live only in localStorage, so "does this client have a
// proposal ready?" was unanswerable server-side, and a document written on a laptop was
// invisible on a phone and to every teammate. The server table is now the shared copy;
// localStorage stays the local editing store so the editor's behaviour is untouched.
//
// SAFETY CONTRACT (00-GUARDRAILS.md: never delete or overwrite existing document data):
//   - Nothing here ever deletes a local document. Ever.
//   - Nothing here ever overwrites a NEWER copy with an OLDER one, in either direction.
//   - A conflict is resolved by `updatedAt`, and ties do nothing.
//   - Sync failures are reported, never silently swallowed — a document that didn't reach
//     the server is still safe locally, but the user needs to know it isn't shared yet.
//
// Deliberately NOT a delete-propagating sync: a document missing locally but present on the
// server means "someone else made it", not "I deleted it". Distinguishing those needs
// tombstones, and guessing wrong destroys work.

import { listDocs, getDoc, saveDoc } from './storage';
import type { BuiltDocument } from './types';

export interface DocumentSummary {
  id: string;
  organizationId: string | null;
  name: string;
  updatedAt: string;
}

export interface SyncResult {
  uploaded: number;
  downloaded: number;
  failed: number;
  /** Set when the server couldn't be reached at all — local data is still intact. */
  offline?: boolean;
}

async function fetchSummaries(): Promise<DocumentSummary[]> {
  const response = await fetch('/api/documents/summaries', { cache: 'no-store' });
  if (!response.ok) throw new Error(`summaries ${response.status}`);
  const body = await response.json();
  return (body.data ?? []) as DocumentSummary[];
}

async function fetchDocument(id: string): Promise<BuiltDocument | null> {
  const response = await fetch(`/api/crm/documents/${id}`, { cache: 'no-store' });
  if (!response.ok) return null;
  const body = await response.json();
  return (body.data ?? null) as BuiltDocument | null;
}

async function pushDocument(doc: BuiltDocument): Promise<boolean> {
  const response = await fetch('/api/crm/documents', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  });
  return response.ok;
}

/**
 * Mirror one document to the server. Called on save — best-effort by design: a failure here
 * must not block the user's local save, which has already succeeded.
 */
export async function pushDocumentToServer(doc: BuiltDocument): Promise<boolean> {
  try {
    return await pushDocument(doc);
  } catch {
    return false;
  }
}

async function deleteDocument(id: string): Promise<boolean> {
  const response = await fetch(`/api/crm/documents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return response.ok;
}

/**
 * Remove a document's shared server copy. Called from the documents list right after the
 * local removal (deleteDoc): without it, syncDocuments re-downloads the still-present server
 * row on the next list load and the "deleted" document reappears. Returns whether the server
 * accepted the delete so the caller can warn when it didn't reach the server (offline/error)
 * and the document may resurface. Awaitable, but never throws.
 */
export async function deleteDocumentFromServer(id: string): Promise<boolean> {
  try {
    return await deleteDocument(id);
  } catch {
    return false;
  }
}

/** Reconcile local and server. Safe to call repeatedly; idempotent. */
export async function syncDocuments(): Promise<SyncResult> {
  const result: SyncResult = { uploaded: 0, downloaded: 0, failed: 0 };

  let summaries: DocumentSummary[];
  try {
    summaries = await fetchSummaries();
  } catch {
    return { ...result, offline: true };
  }

  const remote = new Map(summaries.map((s) => [s.id, s]));
  const local = new Map(listDocs().map((d) => [d.id, d]));

  // Up: anything local the server doesn't have, or that is newer here than there.
  for (const [id, doc] of local) {
    const server = remote.get(id);
    if (server && server.updatedAt >= doc.updatedAt) continue; // server same or newer
    const ok = await pushDocumentToServer(doc);
    if (ok) result.uploaded++;
    else result.failed++;
  }

  // Down: anything the server has that we lack, or that is newer there than here.
  for (const [id, server] of remote) {
    const doc = local.get(id);
    if (doc && doc.updatedAt >= server.updatedAt) continue; // local same or newer
    try {
      const full = await fetchDocument(id);
      if (!full) {
        result.failed++;
        continue;
      }
      // saveDoc re-validates and sanitizes — a hostile or corrupt server row can't smuggle
      // anything into local storage that a hand-edited import couldn't.
      const saved = saveDoc(full);
      if (saved.ok) result.downloaded++;
      else result.failed++;
    } catch {
      result.failed++;
    }
  }

  return result;
}

/** True when a local document differs from (or is missing on) the server. */
export function isUnsynced(doc: BuiltDocument, summaries: DocumentSummary[]): boolean {
  const server = summaries.find((s) => s.id === doc.id);
  return !server || server.updatedAt < doc.updatedAt;
}

export { getDoc };
