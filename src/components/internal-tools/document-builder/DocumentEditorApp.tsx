'use client';

import '@/components/internal-tools/tokens.css';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './editor.module.css';
import PageRail from './PageRail';
import EditorCanvas from './EditorCanvas';
import BuiltDocumentView from './BuiltDocumentView';
import SaveTemplateDialog from './SaveTemplateDialog';
import PreviewModal from './PreviewModal';
import ThemePicker from '../themes/ThemePicker';
import { resolveTheme } from '../themes/themeStorage';
import { generateDocumentPdf, renderDocumentPreview, sanitizeFilePart } from '../pdf/generateDocumentPdf';
import type { CapturedPage } from '../pdf/generateDocumentPdf';
import { editorReducer, type EditorAction } from './editorState';
import { getDoc, saveDoc } from '@/lib/document-builder/storage';
import { pushDocumentToServer } from '@/lib/document-builder/sync';
import {
  captureTemplateFromDoc,
  saveCustomTemplate,
  listCustomTemplateNames,
} from './templateStorage';
import type { BuiltDocument } from '@/lib/document-builder/types';

type SaveStatus = 'saved' | 'saving' | 'error';

export default function DocumentEditorApp({ id }: { id: string }) {
  const [doc, setDoc] = useState<BuiltDocument | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [exporting, setExporting] = useState(false);
  const [saveTplOpen, setSaveTplOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPages, setPreviewPages] = useState<CapturedPage[] | null>(null);
  const firstRun = useRef(true);
  const exportRef = useRef<HTMLDivElement>(null);

  // Load once from localStorage (client-only store).
  useEffect(() => {
    setDoc(getDoc(id) ?? null);
    setLoaded(true);
  }, [id]);

  // Debounced autosave on every change — never on the initial load.
  useEffect(() => {
    if (!doc) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setStatus('saving');
    const handle = setTimeout(() => {
      const result = saveDoc(doc);
      setStatus(result.ok ? 'saved' : 'error');
      // Mirror to the shared server copy so teammates and the meetings badge see it.
      // Deliberately after the local save and deliberately not awaited: localStorage is
      // the editing store and has already succeeded, so a network blip must not surface as
      // "save failed" on work that is, in fact, saved.
      if (result.ok) void pushDocumentToServer(doc);
    }, 600);
    return () => clearTimeout(handle);
  }, [doc]);

  function dispatch(action: EditorAction) {
    setDoc((current) => (current ? editorReducer(current, action) : current));
  }

  if (loaded && !doc) {
    return (
      <div className={styles.notFound}>
        <p>That document could not be found.</p>
        <Link href="/internal/documents" className={styles.backLink}>
          ← Back to documents
        </Link>
      </div>
    );
  }
  if (!doc) return <div className={styles.notFound}>Loading…</div>;

  const { theme, missing } = resolveTheme(doc.themeId);
  const hasCover = doc.pages[0]?.kind === 'cover';
  const safeIndex = Math.min(selectedIndex, doc.pages.length - 1);
  const page = doc.pages[safeIndex];

  async function onExport() {
    if (!exportRef.current || !doc) return;
    setExporting(true);
    try {
      await generateDocumentPdf(exportRef.current, `${sanitizeFilePart(doc.name)}.pdf`, {
        backgroundColor: theme.colors.background,
      });
    } finally {
      setExporting(false);
    }
  }

  async function onPreview() {
    if (!exportRef.current) return;
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewPages(null);
    try {
      const pages = await renderDocumentPreview(exportRef.current, {
        backgroundColor: theme.colors.background,
      });
      setPreviewPages(pages);
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className={styles.editor}>
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <Link href="/internal/documents" className={styles.backLink}>
            ← Documents
          </Link>
          <input
            className={styles.docName}
            value={doc.name}
            onChange={(e) => dispatch({ t: 'setName', name: e.target.value })}
            aria-label="Document name"
          />
        </div>
        <div className={styles.topRight}>
          <label className={styles.coverToggle}>
            <input type="checkbox" checked={hasCover} onChange={() => dispatch({ t: 'toggleCover' })} />
            Cover page
          </label>
          <ThemePicker
            id="doc-theme"
            value={doc.themeId}
            onChange={(themeId) => dispatch({ t: 'setTheme', themeId })}
            missing={missing}
          />
          <span className={`${styles.saveStatus} ${styles[`status_${status}`]}`} role="status">
            {status === 'saving' ? 'Saving…' : status === 'error' ? 'Storage full' : 'Saved'}
          </span>
          <button type="button" onClick={() => setSaveTplOpen(true)} className={styles.secondaryBtn}>
            Save as template
          </button>
          <button type="button" onClick={onPreview} className={styles.secondaryBtn}>
            Preview
          </button>
          <button type="button" onClick={onExport} disabled={exporting} className={styles.primaryBtn}>
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>
      </header>

      <div className={styles.workarea}>
        <PageRail
          pages={doc.pages}
          selectedIndex={safeIndex}
          onSelect={setSelectedIndex}
          onAddPage={(kind) => {
            dispatch({ t: 'addPage', kind, at: safeIndex + 1 });
            setSelectedIndex(safeIndex + 1);
          }}
          onMovePage={(index, dir) => {
            dispatch({ t: 'movePage', index, dir });
            setSelectedIndex(index + dir);
          }}
          onDuplicatePage={(index) => dispatch({ t: 'duplicatePage', index })}
          onDeletePage={(index) => dispatch({ t: 'deletePage', index })}
          hasCover={hasCover}
        />
        {page && <EditorCanvas page={page} theme={theme} dispatch={dispatch} />}
      </div>

      {/* Off-screen full-document render — the PDF export source (read-only, all pages). */}
      <div aria-hidden className={styles.exportHost}>
        <BuiltDocumentView ref={exportRef} document={doc} theme={theme} />
      </div>

      {previewOpen && (
        <PreviewModal
          pages={previewPages}
          loading={previewLoading}
          onClose={() => setPreviewOpen(false)}
          onDownload={onExport}
          downloading={exporting}
        />
      )}

      {saveTplOpen && (
        <SaveTemplateDialog
          existingNames={listCustomTemplateNames()}
          onCancel={() => setSaveTplOpen(false)}
          onSave={(name, description, category, overwrite) => {
            const tpl = captureTemplateFromDoc(doc, { name, description, category });
            const result = saveCustomTemplate(tpl, overwrite);
            if (!result.ok) return result.error;
            setSaveTplOpen(false);
            return null;
          }}
        />
      )}
    </div>
  );
}
