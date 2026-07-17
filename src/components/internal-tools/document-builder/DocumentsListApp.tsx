'use client';

import '@/components/internal-tools/tokens.css';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCrm } from '@/components/crm/CrmContext';
import { syncDocuments, pushDocumentToServer } from '@/lib/document-builder/sync';
import styles from './list.module.css';
import ConfirmDialog from '../ConfirmDialog';
import TemplateChooser from './TemplateChooser';
import { resolveTheme } from '../themes/themeStorage';
import { formatDisplayDate } from '@/lib/internal-tools/format';
import { newId } from '@/lib/document-builder/defaults';
import { clonePageFresh } from './editorState';
import {
  useDocs,
  saveDoc,
  deleteDoc,
  getDoc,
  docToJson,
  parseDocImport,
  approximateStorageBytes,
} from '@/lib/document-builder/storage';
import type { BuiltDocument } from '@/lib/document-builder/types';

const STORAGE_BUDGET = 5 * 1024 * 1024; // ~5MB localStorage ceiling

type Dialog =
  | { kind: 'rename'; doc: BuiltDocument }
  | { kind: 'delete'; doc: BuiltDocument }
  | null;

function download(name: string, json: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DocumentsListApp() {
  const router = useRouter();
  const docs = useDocs();
  const searchParams = useSearchParams();
  const { data: crm } = useCrm();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Arriving from the meetings flow: /internal/documents?forOrg=<uuid> means "start a
  // document for this client" (07-MISSING-DOCUMENT-FLOW.md step 3). Open the chooser
  // straight away rather than making the user find the button again.
  const forOrgId = searchParams.get('forOrg');
  const forOrg = forOrgId ? crm.organizations.find((o) => o.id === forOrgId) : undefined;
  useEffect(() => {
    if (forOrg) setChooserOpen(true);
  }, [forOrg]);

  // Mirror localStorage documents to the shared server copy, and pull down anything a
  // teammate made. Never deletes; never overwrites a newer copy either way. Best-effort —
  // a failure leaves local data untouched.
  const [syncNote, setSyncNote] = useState('');
  useEffect(() => {
    let cancelled = false;
    void syncDocuments().then((result) => {
      if (cancelled) return;
      if (result.offline) setSyncNote('Working offline — documents aren’t synced.');
      else if (result.failed > 0) setSyncNote(`${result.failed} document(s) could not sync.`);
      else setSyncNote('');
    });
    return () => {
      cancelled = true;
    };
    // Once on mount: this reconciles, and every later save pushes itself.
  }, []);

  // Deferred to an effect: reading localStorage during render would diverge between the
  // server (0 bytes) and the client, breaking hydration. Recomputes as documents change.
  const [usedBytes, setUsedBytes] = useState(0);
  useEffect(() => setUsedBytes(approximateStorageBytes()), [docs]);
  const usedPct = Math.min(100, Math.round((usedBytes / STORAGE_BUDGET) * 100));

  function createFrom(doc: BuiltDocument) {
    // Pre-fill from the CRM record when we arrived via ?forOrg. Only the organization link
    // and the cover's client name — everything else is the template's business, and
    // 00-GUARDRAILS.md forbids guessing at CRM data.
    const seeded: BuiltDocument = forOrg
      ? {
          ...doc,
          organizationId: forOrg.id,
          name: `${forOrg.name} — ${doc.name}`,
          // Only touch a cover that already has fields — coverFields carries a REQUIRED
          // title, so spreading an absent one would produce a malformed page.
          pages: doc.pages.map((page) =>
            page.kind === 'cover' && page.coverFields
              ? { ...page, coverFields: { ...page.coverFields, clientName: forOrg.name } }
              : page,
          ),
        }
      : doc;
    const result = saveDoc(seeded);
    if (!result.ok) return;
    // Push immediately so the meeting's badge flips to "Ready" on the next hub load rather
    // than waiting for the next full sync.
    void pushDocumentToServer(seeded);
    router.push(`/internal/documents/${seeded.id}`);
  }

  function duplicate(source: BuiltDocument) {
    const now = new Date().toISOString();
    const copy: BuiltDocument = {
      ...source,
      id: newId(),
      name: `${source.name} (copy)`,
      createdAt: now,
      updatedAt: now,
      pages: source.pages.map(clonePageFresh),
    };
    saveDoc(copy);
  }

  function onImportFile(file: File | undefined) {
    setImportError('');
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseDocImport(String(reader.result));
      if (!result.doc) {
        setImportError(result.error ?? 'That file could not be imported.');
        return;
      }
      saveDoc(result.doc);
    };
    reader.readAsText(file);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Documents</h1>
          <p className={styles.subtitle}>
            Compose free-form, on-brand documents from typed blocks.
          </p>
        </div>
        <div className={styles.headerActions}>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              onImportFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button type="button" className={styles.secondaryBtn} onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <button type="button" className={styles.primaryBtn} onClick={() => setChooserOpen(true)}>
            + New document
          </button>
        </div>
      </header>

      {importError && (
        <p className={styles.importError} role="alert">
          {importError}
        </p>
      )}

      <div className={styles.storageBar} title={`${usedPct}% of ~5MB used`}>
        <div className={styles.storageFill} style={{ width: `${usedPct}%` }} data-warn={usedPct >= 80} />
        <span className={styles.storageLabel}>
          Storage: ~{Math.round(usedBytes / 1024)} KB used{usedPct >= 80 ? ' — export & trim large images' : ''}
        </span>
      </div>

      {docs.length === 0 ? (
        <div className={styles.empty}>
          <p>No documents yet.</p>
          <button type="button" className={styles.primaryBtn} onClick={() => setChooserOpen(true)}>
            Create your first document
          </button>
        </div>
      ) : (
        <ul className={styles.grid}>
          {docs.map((doc) => {
            const { theme } = resolveTheme(doc.themeId);
            return (
              <li key={doc.id} className={styles.card}>
                <Link href={`/internal/documents/${doc.id}`} className={styles.cardMain}>
                  <span className={styles.cardName}>{doc.name}</span>
                  <span className={styles.cardMeta}>
                    {doc.pages.length} page{doc.pages.length === 1 ? '' : 's'} · {theme.name}
                  </span>
                  <span className={styles.cardDate}>Updated {formatDisplayDate(doc.updatedAt)}</span>
                </Link>
                <div className={styles.cardActions}>
                  <Link href={`/internal/documents/${doc.id}`} className={styles.cardAction}>
                    Open
                  </Link>
                  <button type="button" className={styles.cardAction} onClick={() => duplicate(doc)}>
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className={styles.cardAction}
                    onClick={() => setDialog({ kind: 'rename', doc })}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className={styles.cardAction}
                    onClick={() => download(`bf-document-${doc.id.slice(0, 8)}.json`, docToJson(doc))}
                  >
                    Export JSON
                  </button>
                  <button
                    type="button"
                    className={`${styles.cardAction} ${styles.danger}`}
                    onClick={() => setDialog({ kind: 'delete', doc })}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {dialog?.kind === 'rename' && (
        <ConfirmDialog
          title="Rename document"
          body="Give this document a new name."
          confirmLabel="Rename"
          promptLabel="Document name"
          promptDefault={dialog.doc.name}
          onCancel={() => setDialog(null)}
          onConfirm={(value) => {
            const fresh = getDoc(dialog.doc.id);
            if (fresh) saveDoc({ ...fresh, name: value.trim() || fresh.name, updatedAt: new Date().toISOString() });
            setDialog(null);
          }}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title="Delete document"
          body={`Delete “${dialog.doc.name}”? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            deleteDoc(dialog.doc.id);
            setDialog(null);
          }}
        />
      )}

      {chooserOpen && (
        <TemplateChooser onClose={() => setChooserOpen(false)} onCreate={createFrom} />
      )}
    </div>
  );
}
